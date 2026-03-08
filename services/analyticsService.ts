
import { Workout, WorkoutExercise } from '../types';

export const analyticsService = {
    /**
     * Parses numeric values from string fields like "10kg" or "12 reps"
     */
    parseValue: (val: string | undefined): number => {
        if (!val) return 0;
        const numbers = val.match(/\d+(\.\d+)?/);
        return numbers ? parseFloat(numbers[0]) : 0;
    },

    /**
     * Estimates 1 Rep Max using the Epley formula: Weight * (1 + Reps/30)
     */
    calculateOneRM: (weightStr: string, repsStr: string): number => {
        const weight = analyticsService.parseValue(weightStr);
        const reps = analyticsService.parseValue(repsStr);

        if (weight === 0 || reps === 0) return 0;

        // Epley Formula
        return Math.round(weight * (1 + reps / 30));
    },

    /**
     * Aggregates total volume (sets * reps * weight) by muscle group
     * Returns a map of Muscle Name -> Total Volume Load
     */
    getVolumeByMuscleGroup: (workouts: Workout[]): Record<string, number> => {
        const volumeMap: Record<string, number> = {};

        workouts.forEach(workout => {
            workout.exercises?.forEach(ex => {
                const muscle = ex.muscleGroup;
                const weight = analyticsService.parseValue(ex.weight);
                const reps = analyticsService.parseValue(ex.reps);
                const sets = ex.sets || 1;

                // Volume Load = Sets * Reps * Weight
                // If weight is 0 (bodyweight), we can assign a placeholder or just count reps
                const load = weight > 0 ? (sets * reps * weight) : (sets * reps);

                if (muscle) {
                    volumeMap[muscle] = (volumeMap[muscle] || 0) + load;
                }
            });
        });

        return volumeMap;
    },

    /**
     * Calculates the frequency of training for each muscle group
     */
    getMuscleFrequency: (workouts: Workout[]): Record<string, number> => {
        const freqMap: Record<string, number> = {};

        workouts.forEach(workout => {
            const uniqueMuscles = new Set(workout.exercises?.map(e => e.muscleGroup).filter(Boolean));
            uniqueMuscles.forEach(muscle => {
                freqMap[muscle!] = (freqMap[muscle!] || 0) + 1;
            });
        });

        return freqMap;
    },

    /**
     * Tracks 1RM progression for a specific exercise over time
     */
    getOneRMProgression: (workouts: Workout[], exerciseName: string) => {
        const data: { date: string; oneRM: number; weight: number; reps: number }[] = [];

        // Sort workouts by date ascending
        const sortedWorkouts = [...workouts].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        sortedWorkouts.forEach(workout => {
            const exercise = workout.exercises?.find(e =>
                e.name.toLowerCase() === exerciseName.toLowerCase()
            );

            if (exercise) {
                const oneRM = analyticsService.calculateOneRM(exercise.weight || '0', exercise.reps);
                if (oneRM > 0) {
                    data.push({
                        date: new Date(workout.createdAt).toLocaleDateString('pt-BR'),
                        oneRM,
                        weight: analyticsService.parseValue(exercise.weight),
                        reps: analyticsService.parseValue(exercise.reps)
                    });
                }
            }
        });

        return data;
    }
};
