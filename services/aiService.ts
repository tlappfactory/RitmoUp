import { getFunctions, httpsCallable } from 'firebase/functions';
import { Exercise, WorkoutExercise } from '../types';

interface ScoredExercise extends Exercise {
    score: number;
}

// Antagonist muscle pairs for intelligent superset creation
const antagonistPairs: Record<string, string[]> = {
    'Peito': ['Costas', 'Bíceps'], // Chest + Back or Biceps
    'Costas': ['Peito', 'Tríceps'], // Back + Chest or Triceps
    'Bíceps': ['Tríceps'],
    'Tríceps': ['Bíceps'],
    'Ombros': ['Costas', 'Pernas'], // Shoulders + Back/Legs (common splits)
    'Pernas': ['Ombros', 'Abdômen'],
    'Glúteos': ['Abdômen'],
    'Abdômen': ['Lombar', 'Pernas']
};

export const aiService = {
    generateWorkout: async (prompt: string, catalog: Exercise[], student?: any): Promise<WorkoutExercise[]> => {
        try {
            const functionsVal = getFunctions();
            const genFn = httpsCallable(functionsVal, 'generateWorkoutWithAI');

            // Send names to safe tokens/context
            const exerciseNames = catalog.map(e => e.name);

            const result = await genFn({
                prompt,
                availableExercises: exerciseNames,
                userProfile: student
            });

            const generated = result.data as any[];

            // Map back to full exercise objects
            return generated.map((gen: any) => {
                // Find best match in catalog
                const match = catalog.find(c => c.name.toLowerCase() === gen.exerciseName.toLowerCase())
                    || catalog.find(c => c.name.toLowerCase().includes(gen.exerciseName.toLowerCase()))
                    || catalog[0]; // Fallback (should be better handled)

                return {
                    ...match,
                    sets: gen.sets,
                    reps: gen.reps,
                    rest: gen.rest,
                    weight: gen.weight,
                    notes: gen.notes
                } as WorkoutExercise;
            });

        } catch (e) {
            console.error("AI Generation Failed, falling back to Classic", e);
            return aiService.generateWorkoutClassic(prompt, catalog, student);
        }
    },
    /**
     * Generates a workout based on a natural language prompt.
     * Uses a keyword scoring algorithm to find the most relevant exercises.
     * Supports superset creation when requested or for metabolic workouts.
     */
    generateWorkoutClassic: async (prompt: string, catalog: Exercise[], student?: any): Promise<WorkoutExercise[]> => {
        // 1. Preprocessing
        const normalize = (str: string) => str.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^\w\s]/g, ""); // Remove punctuation
        const tokens = normalize(prompt).split(/\s+/).filter(t => t.length > 2); // Filter short words

        if (tokens.length === 0) return [];

        const promptLower = normalize(prompt);

        // Detect superset request OR high intensity/metabolic context
        const supersetKeywords = ['superset', 'super set', 'biset', 'bi-set', 'combinado', 'combinados', 'antagonista', 'pareado', 'intenso', 'metabolico', 'rapido'];
        const wantsSupersets = supersetKeywords.some(kw => promptLower.includes(kw));

        // Detect requested level
        const levelKeywords = {
            'iniciante': 'Iniciante',
            'comecando': 'Iniciante',
            'facil': 'Iniciante',
            'intermediario': 'Intermediário',
            'medio': 'Intermediário',
            'avancado': 'Avançado',
            'dificil': 'Avançado',
            'experiente': 'Avançado'
        };

        // Comprehensive synonym map
        const muscleGroupSynonyms: Record<string, string[]> = {
            'superiores': ['Peito', 'Costas', 'Ombros', 'Bíceps', 'biceps', 'Tríceps', 'triceps'],
            'superior': ['Peito', 'Costas', 'Ombros', 'Bíceps', 'biceps', 'Tríceps', 'triceps'],
            'bracos': ['Bíceps', 'biceps', 'Tríceps', 'triceps', 'Ombros'],
            'peito': ['Peito'],
            'costas': ['Costas'],
            'ombros': ['Ombros'],
            'trapezio': ['Costas', 'Ombros'], // Encolhimento usually implies traps
            'inferiores': ['Pernas', 'Glúteos', 'Panturrilhas'],
            'inferior': ['Pernas', 'Glúteos', 'Panturrilhas'],
            'pernas': ['Pernas', 'Glúteos', 'Panturrilhas'],
            'perna': ['Pernas', 'Glúteos', 'Panturrilhas'],
            'coxa': ['Pernas'],
            'gluteo': ['Glúteos', 'Pernas'],
            'bumbum': ['Glúteos', 'Pernas'],
            'abdome': ['Abdômen'],
            'barriga': ['Abdômen'],
            'core': ['Abdômen'],
            'cardio': ['Cardio'],
            'aerobico': ['Cardio'],
            'esteira': ['Cardio'],
            // Generic terms imply full body
            'completo': ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Cardio'],
            'fullbody': ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Cardio'],
            'geral': ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Cardio'],
            'todo': ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Cardio']
        };

        const expandedTokens = new Set<string>(tokens); // Use Set to avoid duplicates
        let targetLevel: string | undefined;
        const targetMuscleGroups = new Set<string>();

        tokens.forEach(t => {
            if (levelKeywords[t as keyof typeof levelKeywords]) {
                targetLevel = levelKeywords[t as keyof typeof levelKeywords];
            }

            // Expand synonyms and track target muscles
            if (muscleGroupSynonyms[t]) {
                muscleGroupSynonyms[t].forEach(mg => {
                    expandedTokens.add(normalize(mg));
                    targetMuscleGroups.add(mg);
                });
            } else {
                // If token directly matches a muscle group in the catalog (fuzzy)
                const match = catalog.find(c => normalize(c.muscleGroup).includes(t));
                if (match) {
                    targetMuscleGroups.add(match.muscleGroup);
                }
            }

            // Special case for 'Encolhimento' or specific exercises named in prompt
            const exerciseMatch = catalog.find(c => normalize(c.name).includes(t));
            if (exerciseMatch) {
                targetMuscleGroups.add(exerciseMatch.muscleGroup);
            }
        });

        // Convert back to array for scoring
        const scoringTokens = Array.from(expandedTokens);
        const isGenericRequest = targetMuscleGroups.size === 0;

        // 2. Scoring Algorithm
        const scoredExercises: ScoredExercise[] = catalog.map(ex => {
            let score = 0;
            const normName = normalize(ex.name);
            const normMuscle = normalize(ex.muscleGroup);
            const normDesc = ex.description ? normalize(ex.description) : "";
            const normTips = ex.tips ? normalize(ex.tips.join(" ")) : "";

            scoringTokens.forEach(token => {
                // Exact matches get high points
                if (normMuscle.includes(token)) score += 15; // Increased weight for muscle group match
                if (normName.includes(token)) score += 20; // High score if user names the exercise (e.g. "Supino")

                // Description/Context matches get points
                if (normDesc.includes(token)) score += 3;
                if (normTips.includes(token)) score += 1;
            });

            // Level Bonus
            if (targetLevel && ex.level === targetLevel) {
                score += 5;
            }

            // Fallback for generic requests: Give everyone a chance
            if (isGenericRequest) {
                score += 1;
            }

            // Random jitter INCREASED to rotate exercises (0 to 5 points)
            // This ensures "consider all exercises" over time by breaking ties randomly and shuffling 'top' candidates
            score += Math.random() * 5;

            return { ...ex, score };
        });

        // 3. Selection Strategy (Balanced)
        const relevant = scoredExercises.filter(ex => ex.score > 1.0).sort((a, b) => b.score - a.score);

        // Identify unique target muscle groups from the prompt
        const groupsToFill = isGenericRequest
            ? ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen']
            : Array.from(targetMuscleGroups);

        const selected: ScoredExercise[] = [];
        const selectedIds = new Set<string>();

        // Priority Pass: Ensure we hit the targeted groups
        groupsToFill.forEach(group => {
            const groupExercises = relevant.filter(e => e.muscleGroup === group || (isGenericRequest && group === 'Pernas' && (e.muscleGroup === 'Glúteos' || e.muscleGroup === 'Panturrilhas')));

            // Shuffle top candidates slightly to avoid always picking the same #1 exercise
            // Take top 5 valid for this group and pick randomly
            const topCandidates = groupExercises.slice(0, 8).sort(() => Math.random() - 0.5);

            // For specific groups, take more. For generic fullbody, take 1-2 per group.
            const quantity = isGenericRequest ? 1 : (topCandidates.length > 4 ? 3 : 2);

            for (let i = 0; i < Math.min(quantity, topCandidates.length); i++) {
                const ex = topCandidates[i];
                if (!selectedIds.has(ex.id)) {
                    selected.push(ex);
                    selectedIds.add(ex.id);
                }
            }
        });

        // Fill remainder with highest score (which now includes random jitter)
        // Detect explicitly requested number of exercises
        let maxExercises = isGenericRequest ? 10 : 8;

        // Map common text numbers to digits for parsing
        const textToNum: Record<string, string> = {
            'um': '1', 'dois': '2', 'tres': '3', 'quatro': '4', 'cinco': '5',
            'seis': '6', 'sete': '7', 'oito': '8', 'nove': '9', 'dez': '10',
            'onze': '11', 'doze': '12', 'treze': '13', 'quatorze': '14', 'catorze': '14',
            'quinze': '15', 'dezesseis': '16', 'dezessete': '17', 'dezoito': '18',
            'dezenove': '19', 'vinte': '20'
        };

        let promptWithDigits = promptLower;
        Object.entries(textToNum).forEach(([word, digit]) => {
            promptWithDigits = promptWithDigits.replace(new RegExp(`\\b${word}\\b`, 'g'), digit);
        });

        const numMatch = promptWithDigits.match(/(\d+)\s*(exercicio|ex|movimento)/);
        if (numMatch && numMatch[1]) {
            const requested = parseInt(numMatch[1], 10);
            if (!isNaN(requested) && requested > 0 && requested <= 30) {
                maxExercises = requested;
            }
        }

        let i = 0;
        // Re-sort remaining by score to fill gaps
        const remaining = relevant.filter(e => !selectedIds.has(e.id)).sort((a, b) => b.score - a.score);

        while (selected.length < maxExercises && i < remaining.length) {
            const ex = remaining[i];
            selected.push(ex);
            selectedIds.add(ex.id);
            i++;
        }

        // --- NEW: Intensity & Load Estimation ---
        let intensity = 'moderate'; // 'strength', 'hypertrophy', 'endurance', 'moderate'

        if (promptLower.includes('forca') || promptLower.includes('pesado') || promptLower.includes('carga')) {
            intensity = 'strength';
        } else if (promptLower.includes('resistencia') || promptLower.includes('secar') || promptLower.includes('leve') || promptLower.includes('metabolico')) {
            intensity = 'endurance';
        } else if (promptLower.includes('hipertrofia') || promptLower.includes('musculo') || promptLower.includes('crescer')) {
            intensity = 'hypertrophy';
        } else {
            // Check student goal
            const goal = student?.goal ? normalize(student.goal) : '';
            if (goal.includes('forca')) intensity = 'strength';
            else if (goal.includes('emagrecer') || goal.includes('perder')) intensity = 'endurance';
            else intensity = 'hypertrophy'; // Default for most gym goers
        }

        const getLoadDescription = (int: string): string => {
            switch (int) {
                case 'strength': return 'Carga Alta / Falha';
                case 'endurance': return 'Leve / Confortável';
                case 'hypertrophy': return 'Moderada / Desafiadora';
                default: return 'Moderada';
            }
        };

        const getSetsRepsRest = (int: string, muscle: string) => {
            if (muscle === 'Cardio') return { sets: 1, reps: '10-20 min', rest: '0s' };
            if (muscle === 'Abdômen') return { sets: 3, reps: '15-20', rest: '30s' };

            switch (int) {
                case 'strength': return { sets: 5, reps: '5', rest: '90s-120s' };
                case 'endurance': return { sets: 3, reps: '15-20', rest: '30s-45s' };
                case 'hypertrophy': return { sets: 3, reps: '10-12', rest: '60s' };
                default: return { sets: 3, reps: '12', rest: '60s' };
            }
        };

        const loadDesc = getLoadDescription(intensity);
        const bodyweightKeywords = ['flexão', 'flexao', 'abdominal', 'infra', 'supra', 'prancha', 'mergulho', 'barra fixa', 'agachamento livre', 'burpee', 'polichinelo', 'agachamento com salto', 'banco', 'tríceps banco', 'peso corporal', 'bodyweight'];

        // 4. Superset Pairing (Enhanced)
        let result: WorkoutExercise[] = selected.map(ex => {
            const p = getSetsRepsRest(intensity, ex.muscleGroup);
            const lowerName = normalize(ex.name);
            const lowerDesc = ex.description ? normalize(ex.description) : "";
            const lowerInstr = ex.instructions ? normalize(ex.instructions.join(" ")) : "";

            const isBodyweight = bodyweightKeywords.some(kw =>
                lowerName.includes(kw) || lowerDesc.includes(kw) || lowerInstr.includes(kw)
            );

            return {
                ...ex,
                sets: p.sets,
                reps: p.reps,
                rest: p.rest,
                weight: isBodyweight ? 'Peso do Corpo' : loadDesc,
                notes: `Foco: ${intensity === 'strength' ? 'Força' : intensity === 'endurance' ? 'Resistência' : 'Hipertrofia'}`
            };
        });

        if (wantsSupersets && result.length >= 2) {
            const paired = new Set<number>();

            // Try to pair intelligently
            for (let j = 0; j < result.length - 1; j++) {
                if (paired.has(j)) continue;

                const current = result[j];
                const next = result[j + 1];

                // Check Antagonist
                const isAntagonist = antagonistPairs[current.muscleGroup]?.includes(next.muscleGroup);

                // Check Synergist/Same Group (for hypertrophy burn)
                const isSameMuscle = current.muscleGroup === next.muscleGroup;

                // If simple pairing fails, search ahead for a better match!
                // This is the "Intelligence" part -> Find a buddy for this exercise
                let buddyIndex = -1;

                if (isAntagonist || isSameMuscle) {
                    buddyIndex = j + 1;
                } else {
                    // Start searching from j+1 to find a match
                    for (let k = j + 1; k < Math.min(j + 4, result.length); k++) {
                        if (paired.has(k)) continue;
                        const candidate = result[k];
                        if (antagonistPairs[current.muscleGroup]?.includes(candidate.muscleGroup) ||
                            current.muscleGroup === candidate.muscleGroup) {
                            buddyIndex = k;
                            break;
                        }
                    }
                }

                if (buddyIndex !== -1) {
                    // Swap buddy to be adjacent (j+1)
                    if (buddyIndex !== j + 1) {
                        const temp = result[j + 1];
                        result[j + 1] = result[buddyIndex];
                        result[buddyIndex] = temp;
                    }

                    const groupId = `superset-${Date.now()}-${j}`;
                    result[j] = { ...result[j], groupId, rest: '0s', notes: result[j].notes + ' (Superset)' };
                    result[j + 1] = { ...result[j + 1], groupId, notes: result[j + 1].notes + ' (Superset)' };

                    paired.add(j);
                    paired.add(j + 1);
                    j++; // Skip next
                }
            }
        }

        return result;
    },

    /**
     * Simulates a chat response (Mock for Phase 2 start)
     * In Phase 3, this will call a real LLM (Cloud Function or API)
     */
    /**
     * Calls the Cloud Function 'chatWithAI' to get a response from Gemini
     */
    chat: async (userMessage: string, userContext?: any): Promise<string> => {
        try {
            const functionsVal = getFunctions();
            const chatFn = httpsCallable(functionsVal, 'chatWithAI');

            // Timeout to prevent hanging if backend is cold/down 
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
            );

            const result: any = await Promise.race([
                chatFn({
                    messages: [{ role: 'user', content: userMessage }],
                    userContext: userContext
                }),
                timeoutPromise
            ]);

            const data = result.data as any;
            return data.text;

        } catch (error) {
            console.warn("AI Service Backend Error (Falling back to local):", error);

            // Client-side simulation for offline/error handling
            const lowerMsg = userMessage.toLowerCase();

            if (lowerMsg.includes('creatina')) {
                return "A creatina é um composto que fornece energia para os músculos, melhorando força, potência e recuperação entre séries. É ideal para treinos de alta intensidade.";
            }
            if (lowerMsg.includes('agachamento')) {
                return "Para melhorar o agachamento: mantenha os pés na largura dos ombros, costas retas, olhe para frente e desça controlando o movimento. Evite que os joelhos entrem para dentro (valgo).";
            }
            if (lowerMsg.includes('aerobico') || lowerMsg.includes('cardio')) {
                return "O exercício aeróbico (cardio) usa oxigênio para gerar energia e é ótimo para resistência e queima de gordura (ex: corrida). O anaeróbico é de alta intensidade e curta duração (ex: musculação).";
            }

            return "Estou operando em modo offline provisório. Como posso te ajudar com seu treino hoje?";
        }
    }
};
