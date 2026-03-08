import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, setDoc, query, orderBy, limit, collection, getDocs, where } from 'firebase/firestore';
import { Student, GamificationProfile, Achievement } from '../types';
import { socialService } from './socialService';

const LEVEL_BS = 100; // Base XP for level 1
const EXPONENT = 1.5; // Difficulty curve

export const gamificationService = {
    // --- XP & Leveling Logic ---

    // Calculate XP needed for a specific level (Formula: Base * Level^1.5)
    xpForLevel: (level: number): number => {
        return Math.floor(LEVEL_BS * Math.pow(level, EXPONENT));
    },

    // Initialize profile if it doesn't exist
    checkAndInitProfile: async (studentId: string): Promise<GamificationProfile> => {
        const studentRef = doc(db, 'students', studentId);
        const studentSnap = await getDoc(studentRef);

        // Check main collection first, then try 'users' if not found (legacy support)
        let data;
        let refToUse = studentRef;

        if (studentSnap.exists()) {
            data = studentSnap.data() as Student;
        } else {
            // Safe fallback for 'users' collection (app users)
            const userRef = doc(db, 'users', studentId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                data = userSnap.data() as Student;
                refToUse = userRef;
            }
        }

        if (!data) throw new Error("Student not found");

        if (data.gamification) {
            return data.gamification;
        }

        // Default Profile
        const newProfile: GamificationProfile = {
            level: 1,
            currentXp: 0,
            nextLevelXp: 100, // xpForLevel(1)
            currentStreak: 0,
            longestStreak: 0,
            achievements: []
        };

        await setDoc(refToUse, { gamification: newProfile }, { merge: true });
        return newProfile;
    },

    // --- Core Action: Process Workout Completion ---
    processWorkoutCompletion: async (user: { id: string; name: string; avatarUrl?: string; trainerId?: string }, durationMinutes: number) => {
        try {
            const studentId = user.id;

            // 1. Get current profile
            const profile = await gamificationService.checkAndInitProfile(studentId);

            // 2. Calculate XP Gained
            const xpGained = 10 + (durationMinutes * 2);

            // 3. Update Level
            let newXp = profile.currentXp + xpGained;
            let newLevel = profile.level;
            let nextLevelXp = profile.nextLevelXp;

            while (newXp >= nextLevelXp) {
                newXp -= nextLevelXp;
                newLevel++;
                nextLevelXp = gamificationService.xpForLevel(newLevel);
            }

            // 4. Update Streak
            const today = new Date().toISOString().split('T')[0];
            const lastDate = profile.lastWorkoutDate ? profile.lastWorkoutDate.split('T')[0] : null;

            let newStreak = profile.currentStreak;

            if (lastDate === today) {
                // Already worked out today
            } else {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastDate === yesterdayStr) {
                    newStreak++;
                } else {
                    newStreak = 1;
                }
            }

            const newLongest = Math.max(newStreak, profile.longestStreak);

            // 5. Check Achievements
            const newAchievements = [...profile.achievements];
            const recentlyUnlocked: Achievement[] = [];

            const awardBadge = (id: string, title: string, desc: string, icon: string) => {
                if (!newAchievements.find(a => a.id === id)) {
                    const achievement = { id, title, description: desc, icon, unlockedAt: new Date().toISOString() };
                    newAchievements.push(achievement);
                    recentlyUnlocked.push(achievement);
                    return true;
                }
                return false;
            };

            // Badge Logic
            awardBadge('first_workout', 'Primeiros Passos', 'Concluiu o primeiro treino', 'footprint');

            if (newStreak >= 3) awardBadge('streak_3', 'Pegando o Ritmo', 'Sequência de 3 dias', 'local_fire_department');
            if (newStreak >= 7) awardBadge('streak_7', 'Imparável', 'Sequência de 7 dias seguidos', 'whatshot');
            if (newStreak >= 30) awardBadge('streak_30', 'Lendário', 'Sequência de 30 dias! Você é lenda!', 'diamond');

            if (newLevel >= 5) awardBadge('level_5', 'Dedicado', 'Alcançou o nível 5', 'military_tech');
            if (newLevel >= 10) awardBadge('level_10', 'Atleta', 'Alcançou o nível 10', 'sports_martial_arts');
            if (newLevel >= 25) awardBadge('level_25', 'Elite', 'Alcançou o nível 25', 'workspace_premium');

            if (durationMinutes >= 60) awardBadge('marathon', 'Maratonista', 'Completou um treino de +60 minutos', 'timer');

            const currentHour = new Date().getHours();
            if (currentHour < 7) awardBadge('early_bird', 'Madrugador', 'Treinou antes das 7h da manhã', 'wb_twilight');

            // --- SOCIAL GAMIFICATION TRIGGER ---
            if (user.trainerId) {
                // Post for Level Up
                if (newLevel > profile.level) {
                    try {
                        await socialService.createPost({
                            authorId: user.id,
                            authorName: user.name,
                            authorAvatar: user.avatarUrl,
                            trainerId: user.trainerId,
                            content: `🆙 **Subiu de Nível!**\n\nAlcancei o nível ${newLevel}! Quem vem comigo? 🚀`,
                        });
                    } catch (e) {
                        console.warn("Autopost level failed", e);
                    }
                }

                // Post for New Badges (Group them or post the most significant one?)
                // Let's post just the first one to avoid spam, or combine them.
                if (recentlyUnlocked.length > 0) {
                    const badgesNames = recentlyUnlocked.map(b => b.title).join(', ');
                    try {
                        await socialService.createPost({
                            authorId: user.id,
                            authorName: user.name,
                            authorAvatar: user.avatarUrl,
                            trainerId: user.trainerId,
                            content: `🏆 **Nova Conquista Desbloqueada!**\n\nAcabei de ganhar a medalha: **${badgesNames}**! 💪`,
                        });
                    } catch (e) {
                        console.warn("Autopost badge failed", e);
                    }
                }
            }


            // 6. Save Updates
            const updatedProfile: GamificationProfile = {
                level: newLevel,
                currentXp: newXp,
                nextLevelXp: nextLevelXp,
                currentStreak: newStreak,
                longestStreak: newLongest,
                lastWorkoutDate: new Date().toISOString(),
                achievements: newAchievements
            };

            const studentRef = doc(db, 'students', studentId);
            const studentSnap = await getDoc(studentRef);

            if (studentSnap.exists()) {
                await updateDoc(studentRef, { gamification: updatedProfile });
            } else {
                const userRef = doc(db, 'users', studentId);
                await updateDoc(userRef, { gamification: updatedProfile });
            }

            return {
                xpGained,
                levelUp: newLevel > profile.level,
                newLevel,
                newBadges: newAchievements.length > profile.achievements.length
            };

        } catch (error) {
            console.error("Error processing gamification:", error);
            throw error;
        }
    },

    // --- Ranking Queries ---

    getGlobalRanking: async (maxLimit: number = 50) => {
        // We query 'students' collection sorted by XP
        const q = query(
            collection(db, 'students'),
            orderBy('gamification.currentXp', 'desc'),
            limit(maxLimit)
        );
        const snapshot = await getDocs(q);

        // Also query 'users' to catch any that might be there (legacy/auth structure)
        const qUsers = query(
            collection(db, 'users'), // Assuming 'role' check might be needed if trainers also have XP, but let's stick to XP existence
            orderBy('gamification.currentXp', 'desc'),
            limit(maxLimit)
        );
        const snapshotUsers = await getDocs(qUsers);

        // Merge and sort
        const students = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        const users = snapshotUsers.docs
            .map(d => ({ id: d.id, ...d.data() } as Student))
            .filter(u => u.gamification?.currentXp !== undefined); // Ensure they have gamification data

        const all = [...students, ...users];

        // Deduplicate by ID
        const unique = Array.from(new Map(all.map(item => [item.id, item])).values());

        // Sort desc
        return unique.sort((a, b) => (b.gamification?.currentXp || 0) - (a.gamification?.currentXp || 0)).slice(0, maxLimit);
    },

    getTribeRanking: async (trainerId: string, maxLimit: number = 50) => {
        // Query 'users' where trainerId == X
        // We might need an index for trainerId + gamification.currentXp
        const q = query(
            collection(db, 'users'),
            where('trainerId', '==', trainerId),
            orderBy('gamification.currentXp', 'desc'),
            limit(maxLimit)
        );

        // Catch fail if index missing
        try {
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        } catch (e) {
            console.warn("Index might be missing for Tribe Ranking, falling back to client-side sort if needed or just erroring", e);
            // Fallback: Query by trainerId only, then sort
            const qFallback = query(
                collection(db, 'users'),
                where('trainerId', '==', trainerId)
            );
            const snapshot = await getDocs(qFallback);
            const students = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
            return students
                .filter(s => s.gamification)
                .sort((a, b) => (b.gamification?.currentXp || 0) - (a.gamification?.currentXp || 0))
                .slice(0, maxLimit);
        }
    },

    getProfile: async (studentId: string) => {
        return gamificationService.checkAndInitProfile(studentId);
    }

};
