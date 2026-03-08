import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { Stripe } from '@capacitor-community/stripe';

export const paymentService = {
    initiatePayment: async (priceId?: string) => {
        // 1. Call Backend to get Client Secret & Ephemeral Key
        const createPaymentSheetFn = httpsCallable(functions, 'createPaymentSheet');
        const { data } = await createPaymentSheetFn({ priceId });
        const { paymentIntent, ephemeralKey, customer, publishableKey } = data as any;

        // 2. Initialize Stripe
        // Ideally initialize once in App.tsx or a dedicated provider, but here ensures we have the key.
        // We can check if it's already initialized if the plugin supports it, but initialize is generally safe to call.
        await Stripe.initialize({
            publishableKey: publishableKey,
        });

        // 3. Create Payment Sheet
        // Detect if it is a SetupIntent (for trials) or PaymentIntent (immediate charge)
        const isSetupIntent = paymentIntent.startsWith('seti_');

        await Stripe.createPaymentSheet({
            paymentIntentClientSecret: isSetupIntent ? undefined : paymentIntent,
            setupIntentClientSecret: isSetupIntent ? paymentIntent : undefined,
            customerId: customer,
            customerEphemeralKeySecret: ephemeralKey,
            merchantDisplayName: 'RitmoUp',
        });

        // 4. Present Payment Sheet
        const result = await Stripe.presentPaymentSheet();

        if (result.paymentResult === 'paymentSheetCompleted') {
            return { success: true };
        } else {
            throw new Error('Payment cancelled or failed');
        }
    }
};
