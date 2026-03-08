import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, setDoc } from 'firebase/firestore';
import { User, UserRole } from '../types';

export const userService = {
    getUser: async (userId: string): Promise<User | null> => {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as User;
        }
        return null;
    },

    updateUser: async (userId: string, data: Partial<User>) => {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, data);
    },

    createUser: async (user: User) => {
        const { id, ...rest } = user;
        await setDoc(doc(db, 'users', id), rest);
    },

    getAllTrainers: async () => {
        const q = query(collection(db, 'users'), where('role', '==', UserRole.TRAINER));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};
