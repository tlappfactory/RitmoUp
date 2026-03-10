import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

admin.initializeApp();

const db = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

// This is the secret provided by the user
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const stripeWebhook = functions.https.onRequest(async (request, response) => {
    const sig = request.headers['stripe-signature'];

    let event;

    try {
        // Verify the event came from Stripe
        // Note: request.rawBody is available in Firebase Cloud Functions
        event = stripe.webhooks.constructEvent(request.rawBody, sig as string, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            console.log('Checkout Session completed:', session.id);

            // Retrieve the user ID from client_reference_id or metadata
            const userId = session.client_reference_id || session.metadata?.userId;

            if (userId) {
                try {
                    let expiresAt: admin.firestore.FieldValue | string = admin.firestore.FieldValue.serverTimestamp();
                    let subscriptionId = session.subscription as string;

                    if (typeof session.subscription === 'string') {
                        const sub = await stripe.subscriptions.retrieve(session.subscription);
                        expiresAt = new Date(sub.current_period_end * 1000).toISOString();
                        subscriptionId = sub.id;
                    } else if ((session.subscription as any)?.current_period_end) {
                        // In case it is already expanded
                        expiresAt = new Date((session.subscription as any).current_period_end * 1000).toISOString();
                        subscriptionId = (session.subscription as any).id;
                    }

                    await db.collection('users').doc(userId).update({
                        subscriptionStatus: 'active',
                        subscriptionId: subscriptionId,
                        subscriptionPlan: 'pro_trainer',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        subscriptionExpiresAt: expiresAt
                    });
                    console.log(`Successfully updated subscription for user ${userId}`);
                } catch (error) {
                    console.error('Error updating user subscription:', error);
                }
            } else {
                console.warn('No userId found in session');
            }
            break;

        case 'invoice.payment_succeeded':
            // Logic to extend subscription or handle recurring payment success
            // invoice variable removed as it was unused
            // Similar update logic if needed
            break;

        case 'customer.subscription.deleted':
            // Logic to mark user as inactive
            // subscription variable removed as it was unused
            // Need to find user by subscription ID if userId is not in event directly
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    response.json({ received: true });
});

export const createCheckoutSession = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to create a checkout session.');
    }

    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;
    const { priceId, successUrl, cancelUrl } = data;

    // Use a placeholder or environment variable for Price ID if not provided
    // Ideally this should be in .env or config
    const actualPriceId = priceId || 'price_1S1AgALWgxsXnx7iTLGBsGih';

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: actualPriceId,
                    quantity: 1,
                },
            ],
            client_reference_id: userId,
            customer_email: userEmail,
            success_url: successUrl,
            cancel_url: cancelUrl,
            subscription_data: {
                trial_period_days: 7 // Default 7-day free trial as requested
            },
            metadata: {
                userId: userId
            }
        });

        return { url: session.url };
    } catch (error: any) {
        console.error('Stripe Session Creation Error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

export const createPaymentSheet = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;
    const { priceId } = data;
    const actualPriceId = priceId || 'price_1S1AgALWgxsXnx7iTLGBsGih';

    try {
        // 1. Create or Retrieve Customer
        // In a real app, store customerId in Firestore to avoid duplicates.
        // For now, we'll create a new one or search by email.
        const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
        let customer = customers.data[0];

        if (!customer) {
            customer = await stripe.customers.create({
                email: userEmail,
                metadata: { userId: userId }
            });
        }

        // 2. Create Ephemeral Key
        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customer.id },
            { apiVersion: '2023-10-16' } // Ensure this version is compatible with your Stripe SDK
        );

        // 3. Create Subscription (with Trial)
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: actualPriceId }],
            trial_period_days: 7,
            payment_behavior: 'default_incomplete',
            expand: ['pending_setup_intent', 'latest_invoice.payment_intent'],
            metadata: { userId: userId },
        });

        // 4. Determine Client Secret
        // For a trial, we usually need the pending_setup_intent to collect card details without charging.
        // If there's an immediate charge (no trial), we use latest_invoice.payment_intent.
        let clientSecret;
        if (subscription.pending_setup_intent && typeof subscription.pending_setup_intent !== 'string') {
            clientSecret = subscription.pending_setup_intent.client_secret;
        } else if (subscription.latest_invoice && typeof subscription.latest_invoice !== 'string' && subscription.latest_invoice.payment_intent && typeof subscription.latest_invoice.payment_intent !== 'string') {
            clientSecret = subscription.latest_invoice.payment_intent.client_secret;
        }

        if (!clientSecret) {
            throw new Error('Could not generate client secret for subscription.');
        }

        return {
            paymentIntent: clientSecret, // The capacitor plugin uses 'paymentIntent' param for both PI and SI secrets often, or we return strict names.
            ephemeralKey: ephemeralKey.secret,
            customer: customer.id,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ''
        };

    } catch (error: any) {
        console.error('Stripe Payment Sheet Error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini (User needs to set GEMINI_API_KEY in functions config or .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const chatWithAI = functions.https.onCall(async (data: any, context: any) => {
    // Ensure user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { messages, userContext } = data;
    // messages: { role: 'user' | 'model', parts: [{ text: string }] }[]

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const systemPrompt = `
        You are an elite Personal Trainer AI named "Coach Ritmo".
        Your goal is to help users with fitness advice, motivation, and physiology questions.
        User Context: ${JSON.stringify(userContext || {})}
        
        Traits:
        - Energetic and motivating but professional.
        - Knowledgeable about hypertrophy, strength, and cardio.
        - Concisely answer questions about exercises, diet concepts (no specific meal plans), and recovery.
        
        IMPORTANT RESTRICTION:
        - You are NOT allowed to prescribe specific workout plans (sets, reps, lists of exercises) for the user.
        - If the user asks for a workout, politely say: "A criação de treinos completos é exclusiva do seu Personal Trainer. Posso te dar dicas sobre exercícios específicos ou tirar dúvidas, mas o plano ideal deve ser feito por ele!"
        - Do not give medical advice for serious injuries, suggest seeing a doctor.
        `;

        // Format history for Gemini
        // Gemini expects: { role: 'user' | 'model', parts: [{ text: string }] }
        // Our app sends: { role: 'user' | 'assistant', content: string }
        const history = [
            {
                role: "user",
                parts: [{ text: systemPrompt }],
            },
            {
                role: "model",
                parts: [{ text: "Understood. I am Coach Ritmo, ready to help the athlete achieve their goals. Let's train!" }],
            }
        ];

        // Add previous messages (excluding the very last one which is the new prompt)
        const previousMessages = messages.slice(0, -1);
        previousMessages.forEach((m: any) => {
            history.push({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            });
        });

        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const lastMessageContent = messages[messages.length - 1].content;
        const result = await chat.sendMessage(lastMessageContent);
        const response = await result.response;
        const text = response.text();

        return { text };

    } catch (error: any) {
        console.error('AI Chat Error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to generate response.', error);
    }
});

export const generateWorkoutWithAI = functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { prompt, availableExercises, userProfile, targetExerciseCount, targetDuration } = data; // availableExercises is Array<string>

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const systemPrompt = `
        You are an elite Personal Trainer.
        Create a workout based on the user's request and profile.
        
        User Profile: ${JSON.stringify(userProfile || {})}
        Request: "${prompt}"

        ${targetExerciseCount ? `IMPORTANT: You MUST return EXACTLY ${targetExerciseCount} exercises.` : ''}
        ${targetDuration ? `IMPORTANT: The workout should be designed to take approximately ${targetDuration} minutes. Adjust sets, reps, and rest periods accordingly.` : ''}

        Available Exercises (Select ONLY from this list if possible, but you can suggest others if strictly necessary):
        ${JSON.stringify(availableExercises ? availableExercises.slice(0, 300) : [])}

        Return strictly a JSON Array of objects with this schema:
        [
            {
                "exerciseName": "Exact name from list or close match",
                "sets": 3,
                "reps": "string (e.g. '12' or '10-12')",
                "rest": "string (e.g. '60s')",
                "notes": "Brief technique tip or focus",
                "weight": "suggested load (e.g. 'Moderada', 'Bodyweight')"
            }
        ]
        
        IMPORTANT: Return ONLY the JSON. No markdown formatting, no code blocks. Just the raw JSON string.
        CRITICAL: If the user requested a specific number of exercises, you MUST return EXACTLY that number of exercises.
        `;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        let text = response.text();

        // Cleanup potential markdown code blocks if the model adds them
        text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();

        return JSON.parse(text);

    } catch (error: any) {
        console.error('AIGen Error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to generate workout.', error);
    }
});
