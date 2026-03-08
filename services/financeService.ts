import { db } from '../lib/firebase';
import {
    collection,
    getDocs,
    addDoc,
    setDoc,
    doc,
    query,
    where,
    orderBy,
    Timestamp,
    writeBatch,
    updateDoc,
    deleteDoc,
    onSnapshot
} from 'firebase/firestore';
import { FinancialRecord, SubscriptionPlan } from '../types';

export const financeService = {
    // Get records for a specific trainer
    getFinancialRecords: async (trainerId: string): Promise<FinancialRecord[]> => {
        const q = query(
            collection(db, 'financialRecords'),
            where('trainerId', '==', trainerId),
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialRecord));
    },

    getSubscriptionPlans: async (): Promise<SubscriptionPlan[]> => {
        const querySnapshot = await getDocs(collection(db, 'subscriptionPlans'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
    },

    addFinancialRecord: async (record: FinancialRecord) => {
        // Ensure date is a Timestamp
        const data = {
            ...record,
            // If date is a JS Date, convert it. If it's already a Timestamp or string, handle accordingly.
            date: record.date instanceof Date ? Timestamp.fromDate(record.date) : record.date,
            createdAt: Timestamp.now()
        };
        const docRef = await addDoc(collection(db, 'financialRecords'), data);
        return docRef.id;
    },

    addFinancialRecordBatch: async (records: FinancialRecord[]) => {
        const batch = writeBatch(db);
        const collectionRef = collection(db, 'financialRecords');

        records.forEach(record => {
            const data = {
                ...record,
                date: record.date instanceof Date ? Timestamp.fromDate(record.date) : record.date,
                createdAt: Timestamp.now()
            };
            const newDocRef = doc(collectionRef); // Generate ID automatically
            batch.set(newDocRef, data);
        });

        await batch.commit();
    },

    updateFinancialRecord: async (id: string, data: Partial<FinancialRecord>) => {
        // Handle date conversion if present in updates
        const cleanData = { ...data };
        if (cleanData.date && cleanData.date instanceof Date) {
            cleanData.date = Timestamp.fromDate(cleanData.date);
        }
        await updateDoc(doc(db, 'financialRecords', id), cleanData);
    },

    deleteFinancialRecord: async (id: string) => {
        await deleteDoc(doc(db, 'financialRecords', id));
    },

    addSubscriptionPlan: async (plan: SubscriptionPlan) => {
        if (plan.id) {
            const { id, ...rest } = plan;
            await setDoc(doc(db, 'subscriptionPlans', id), rest);
        } else {
            await addDoc(collection(db, 'subscriptionPlans'), plan);
        }
    },

    getStudentPendingPayments: async (studentId: string): Promise<FinancialRecord[]> => {
        const q = query(
            collection(db, 'financialRecords'),
            where('studentId', '==', studentId),
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        // Client-side filter for 'Pendente' or 'Aguardando Confirmação' because 'in' query limitations or simplicity
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as FinancialRecord))
            .filter(r => r.status === 'Pendente' || r.status === 'Aguardando Confirmação');
    },

    confirmPaymentByStudent: async (recordId: string) => {
        await updateDoc(doc(db, 'financialRecords', recordId), {
            status: 'Aguardando Confirmação'
        });
    },

    confirmPaymentByTrainer: async (recordId: string) => {
        await updateDoc(doc(db, 'financialRecords', recordId), {
            status: 'Pago'
        });
    },

    subscribeToPendingConfirmations: (trainerId: string, onUpdate: (records: FinancialRecord[]) => void) => {
        const q = query(
            collection(db, 'financialRecords'),
            where('trainerId', '==', trainerId),
            where('status', '==', 'Aguardando Confirmação'),
            orderBy('date', 'desc')
        );

        return onSnapshot(q, (snapshot: any) => {
            const records = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as FinancialRecord));
            onUpdate(records);
        });
    }
};
