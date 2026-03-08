import React from 'react';
import { DashboardLayout } from '../../components/Layout';
import { SubscriptionContent } from './SubscriptionContent';

export const SubscriptionManagementPage = () => {
    return (
        <DashboardLayout title="Minha Assinatura" showBack>
            <SubscriptionContent />
        </DashboardLayout>
    );
};
