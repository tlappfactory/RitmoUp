import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, setDoc, getDoc, query, where, writeBatch } from 'firebase/firestore';
import { Workout, Exercise } from '../types';
import { exerciseCatalog } from '../mockData';

const DEFAULT_EXERCISES: Exercise[] = exerciseCatalog;

export const workoutService = {
    getAllWorkouts: async (): Promise<Workout[]> => {
        const querySnapshot = await getDocs(collection(db, 'workouts'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workout));
    },

    getWorkoutsByStudent: async (studentId: string): Promise<Workout[]> => {
        const q = query(collection(db, 'workouts'), where('studentId', '==', studentId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workout));
    },

    getWorkoutsByTrainer: async (trainerId: string): Promise<Workout[]> => {
        const q = query(collection(db, 'workouts'), where('trainerId', '==', trainerId));
        const querySnapshot = await getDocs(q);
        // Sort by date desc
        const workouts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workout));
        return workouts.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return dateB - dateA;
        });
    },

    getTrainerTemplates: async (trainerId: string): Promise<Workout[]> => {
        const q = query(
            collection(db, 'workouts'),
            where('trainerId', '==', trainerId),
            where('isTemplate', '==', true)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workout));
    },

    saveTrainerVideo: async (trainerId: string, exerciseId: string, videoUrl: string) => {
        const id = `${trainerId}_${exerciseId}`;
        await setDoc(doc(db, 'trainer_videos', id), {
            trainerId,
            exerciseId,
            videoUrl,
            updatedAt: new Date()
        });
    },

    getTrainerVideos: async (trainerId: string): Promise<Record<string, string>> => {
        const q = query(collection(db, 'trainer_videos'), where('trainerId', '==', trainerId));
        const snapshot = await getDocs(q);
        const videos: Record<string, string> = {};
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            videos[data.exerciseId] = data.videoUrl;
        });
        return videos;
    },

    createWorkout: async (workout: Omit<Workout, 'id'>) => {
        const docRef = await addDoc(collection(db, 'workouts'), workout);
        return { id: docRef.id, ...workout };
    },

    saveWorkoutWithId: async (workout: Workout) => {
        await setDoc(doc(db, 'workouts', workout.id), workout);
    },

    addExerciseToCatalog: async (exercise: Exercise) => {
        // Ensure global exercises DO NOT have videoUrl by default as per requirement
        const { videoUrl, ...exerciseData } = exercise;
        await setDoc(doc(db, 'exercises', exercise.id), { ...exerciseData, videoUrl: '' });
    },

    getWorkoutById: async (id: string, trainerId?: string): Promise<Workout | null> => {
        const docRef = doc(db, 'workouts', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const workout = { id: docSnap.id, ...docSnap.data() } as Workout;

            // If trainerId provided, attempt to inject custom videos
            if (trainerId && workout.exercises) {
                const trainerVideos = await workoutService.getTrainerVideos(trainerId);
                workout.exercises = workout.exercises.map(ex => ({
                    ...ex,
                    videoUrl: trainerVideos[ex.id] || ex.videoUrl || '' // Use custom, or existing, or empty
                }));
            } else if (workout.exercises) {
                // Ensure we prefer existing videoUrl if available
                workout.exercises = workout.exercises.map(ex => ({ ...ex, videoUrl: ex.videoUrl || '' }));
            }

            return workout;
        }
        return null;
    },

    getExerciseCatalog: async (trainerId?: string): Promise<Exercise[]> => {
        return workoutService.getExercises(trainerId);
    },

    getExercises: async (trainerId?: string): Promise<Exercise[]> => {
        try {
            const querySnapshot = await getDocs(collection(db, 'exercises'));
            const trainerVideos = trainerId ? await workoutService.getTrainerVideos(trainerId) : {};

            if (!querySnapshot.empty) {
                const dbExercises = querySnapshot.docs.map(doc => {
                    const data = doc.data() as Exercise;
                    return {
                        id: doc.id,
                        ...data,
                        // Override videoUrl if trainer has one, otherwise use original or empty
                        videoUrl: trainerVideos[doc.id] || data.videoUrl || ''
                    };
                });
                // Bulletproof Portuguese alphabetical sorting
                return dbExercises.sort((a, b) => {
                    const normalize = (str: string) => {
                        return str.toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '');
                    };
                    const nameA = normalize(a.name);
                    const nameB = normalize(b.name);
                    if (nameA < nameB) return -1;
                    if (nameA > nameB) return 1;
                    return 0;
                });
            }
            // Fallback for mock/default data - ensuring no videos shown unless somehow we want to map default mocks (unlikely needed for prod)
            const normalize = (str: string) => {
                return str.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');
            };
            return DEFAULT_EXERCISES.map(ex => ({ ...ex, videoUrl: '' })).sort((a, b) => {
                const nameA = normalize(a.name);
                const nameB = normalize(b.name);
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
        } catch (e) {
            console.warn("Error fetching exercises, using default:", e);
            return DEFAULT_EXERCISES.map(ex => ({ ...ex, videoUrl: '' }));
        }
    },


    clearExercisesCollection: async () => {
        try {
            console.log("Starting to clear exercises collection...");
            const querySnapshot = await getDocs(collection(db, 'exercises'));
            const totalDocs = querySnapshot.size;
            console.log(`Found ${totalDocs} exercises to delete.`);

            if (totalDocs === 0) return true;

            // Use Batch for delete as well
            const batch = writeBatch(db);
            querySnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            console.log("Exercises collection cleared successfully.");
            return true;
        } catch (e) {
            console.error("Error clearing exercises collection:", e);
            throw e;
        }
    },

    seedExercisesDatabase: async () => {
        try {
            // First, fetch all existing exercises to check for custom images/videos
            const snapshot = await getDocs(collection(db, 'exercises'));
            const existingExercisesMap = new Map();
            snapshot.docs.forEach(doc => {
                existingExercisesMap.set(doc.id, doc.data());
            });

            const batch = writeBatch(db);
            let count = 0;
            const validIds = new Set();

            DEFAULT_EXERCISES.forEach((ex) => {
                validIds.add(ex.id);
                const exRef = doc(db, 'exercises', ex.id);
                const existingData = existingExercisesMap.get(ex.id);

                let dataToSave = { ...ex };

                // LOGIC UPDATE: We want to FORCE OVERWRITE from CODEBASE as source of truth for images.
                // We only preserve videoUrl if trainers have added custom ones (or if we really want to keep them).
                // However, for this fix, we assume mockData.ts is the definitive source for images.
                if (existingData) {
                    if (existingData.videoUrl && existingData.videoUrl.length > 0) {
                        dataToSave.videoUrl = existingData.videoUrl;
                    }
                }

                batch.set(exRef, dataToSave, { merge: true });
                count++;
            });

            // --- PRUNE ORPHANED EXERCISES ---
            // If an exercise exists in DB but is NOT in validIds (source code), delete it.
            let deletedCount = 0;
            existingExercisesMap.forEach((_, id) => {
                if (!validIds.has(id)) {
                    const docToDelete = doc(db, 'exercises', id);
                    batch.delete(docToDelete);
                    deletedCount++;
                }
            });

            await batch.commit();
            console.log(`Database seeded successfully. Added/Updated: ${count}. Deleted Orphans: ${deletedCount}.`);
            return true;
        } catch (e) {
            console.error("Error seeding database:", e);
            throw e;
        }
    },

    logWorkoutCompletion: async (userId: string, workoutId: string, duration: number, title: string) => {
        try {
            await addDoc(collection(db, 'workout_history'), {
                userId,
                workoutId,
                title,
                duration,
                completedAt: new Date(),
                weekNumber: getWeekNumber(new Date())
            });
            return true;
        } catch (e) {
            console.error("Error logging workout:", e);
            return false;
        }
    },

    getWeeklyWorkoutCount: async (userId: string): Promise<number> => {
        try {
            // Robust approach: Fetch recent history (ordered by default/docId is fine, or explicitly by completedAt if index exists)
            // If we use orderBy('completedAt', 'desc'), it usually requires an index.
            // Safe bet: Fetch last 50 items for this user. If no index, simple query by userId is safe.
            // Ideally we'd order by completedAt descending. Let's try to query just by userId to avoid index issues 
            // and filter in memory.
            const q = query(
                collection(db, 'workout_history'),
                where('userId', '==', userId)
                // limit(50) // Optional: limit if list gets too huge, but 50 might miss if user works out A LOT. 
            );

            const snapshot = await getDocs(q);

            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start
            startOfWeek.setHours(0, 0, 0, 0);

            // Filter in memory
            const count = snapshot.docs.filter(doc => {
                const data = doc.data();
                // Handle Timestamp or Date string/object
                let completedAt = new Date();
                if (data.completedAt?.toDate) {
                    completedAt = data.completedAt.toDate();
                } else if (data.completedAt?.seconds) {
                    completedAt = new Date(data.completedAt.seconds * 1000);
                } else if (data.completedAt) {
                    completedAt = new Date(data.completedAt);
                }

                return completedAt >= startOfWeek;
            }).length;

            return count;
        } catch (e) {
            console.error("Error getting weekly count:", e);
            return 0;
        }
    },

    getWeeklyStats: async (userId: string) => {
        try {
            // Same robust approach
            const q = query(
                collection(db, 'workout_history'),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);

            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start
            startOfWeek.setHours(0, 0, 0, 0);

            let totalMinutes = 0;
            let count = 0;

            snapshot.docs.forEach(doc => {
                const data = doc.data();

                let completedAt = new Date();
                if (data.completedAt?.toDate) {
                    completedAt = data.completedAt.toDate();
                } else if (data.completedAt?.seconds) {
                    completedAt = new Date(data.completedAt.seconds * 1000);
                } else if (data.completedAt) {
                    completedAt = new Date(data.completedAt);
                }

                if (completedAt >= startOfWeek) {
                    count++;
                    totalMinutes += (data.duration || 0) / 60;
                }
            });

            return {
                count: count,
                minutes: Math.round(totalMinutes),
                calories: Math.round(totalMinutes * 5)
            };
        } catch (e) {
            console.error("Error getting weekly stats:", e);
            return { count: 0, minutes: 0, calories: 0 };
        }
    },

    // Helper for week number if needed elsewhere, but not used for stats anymore
    getWeekNumber: (d: Date) => getWeekNumber(d),

    getWorkoutHistory: async (userId: string) => {
        const q = query(
            collection(db, 'workout_history'),
            where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Normalize date
            let completedAt = new Date();
            if (data.completedAt?.toDate) {
                completedAt = data.completedAt.toDate();
            } else if (data.completedAt?.seconds) {
                completedAt = new Date(data.completedAt.seconds * 1000);
            } else if (data.completedAt) {
                completedAt = new Date(data.completedAt);
            }
            return {
                id: doc.id,
                ...data,
                completedAt
            };
        });
    }
};

// Helper function to get week number
function getWeekNumber(d: Date) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}
