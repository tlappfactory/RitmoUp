import React from 'react';
import { DashboardLayout } from '../components/Layout';
import { ExercisesContent } from '../components/Exercises/ExercisesContent';

export const ExercisesPage = () => {
    return (
        <DashboardLayout
            title="Exercícios (A-Z)"
        >
            <ExercisesContent />
        </DashboardLayout>
    );
};
