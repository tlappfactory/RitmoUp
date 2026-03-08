import { workoutService } from '../services/workoutService';
import { userService } from '../services/userService';
import { financeService } from '../services/financeService';
import { studentService } from '../services/studentService';
import {
    currentUserMock,
    trainerUserMock,
    currentStudentProfileMock,
    currentTrainerProfileMock,
    workoutsMock,
    subscriptionPlansMock,
    studentsMock,
    financialRecordsMock,
    trainersMock,
    exerciseCatalog
} from '../mockData';
import { UserRole } from '../types';

export const seedDatabase = async () => {
    console.log('Starting Seeding...');

    // 1. Users & Profiles
    // Trainer
    // 1. Users & Profiles - SKIPPED FOR CATALOG UPDATE
    // Trainer
    /*
    console.log('Seeding Trainer...');
    await userService.createUser({
        ...trainerUserMock,
        role: UserRole.TRAINER
    });
    
    await userService.updateUser(trainerUserMock.id, currentTrainerProfileMock);

    // Student (Generic "Current User")
    console.log('Seeding Current Student...');
    await userService.createUser({
        ...currentUserMock,
        role: UserRole.STUDENT
    });
    await userService.updateUser(currentUserMock.id, currentStudentProfileMock);

    // Other Trainers
    console.log('Seeding Other Trainers...');
    for (const trainer of trainersMock) {
        if (trainer.id === trainerUserMock.id) continue;
        await userService.createUser({
            id: trainer.id,
            name: trainer.name,
            email: `trainer${trainer.id}@example.com`,
            role: UserRole.TRAINER,
            avatarUrl: trainer.avatarUrl
        });
        
        await userService.updateUser(trainer.id, {
            experienceYears: 5,
            rating: trainer.rating,
            studentsCount: trainer.students,
            specialties: [trainer.specialty]
        } as any);
    }
    */

    // 2. Workouts
    console.log('Seeding Workouts...');
    for (const workout of workoutsMock) {
        await workoutService.saveWorkoutWithId(workout);
    }

    // 3. Exercises
    console.log('Seeding Exercises...');
    await workoutService.clearExercisesCollection();
    for (const exercise of exerciseCatalog) {
        await workoutService.addExerciseToCatalog(exercise);
    }

    // 4. Financials
    console.log('Seeding Plans...');
    for (const plan of subscriptionPlansMock) {
        await financeService.addSubscriptionPlan(plan);
    }

    console.log('Seeding Transactions...');
    for (const record of financialRecordsMock) {
        await financeService.addFinancialRecord(record);
    }

    // 5. Students List (for Trainer View)
    console.log('Seeding Students List...');
    for (const student of studentsMock) {
        await studentService.saveStudent(student);
    }

    console.log('Seeding Completed!');
};
