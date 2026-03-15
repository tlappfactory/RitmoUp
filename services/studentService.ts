import { db } from '../lib/firebase';
import { collection, getDocs, query, where, setDoc, doc, orderBy, getDoc, addDoc, Timestamp } from 'firebase/firestore';
import { Student } from '../types';

export const studentService = {
    getAllStudents: async (): Promise<Student[]> => {
        const querySnapshot = await getDocs(collection(db, 'students'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    },

    getStudentsByTrainerSafe: async (trainerId: string): Promise<Student[]> => {
        // 1. Fetch Manual Students (Robust "Fetch All + Filter" strategy)
        let manualStudents: Student[] = [];
        try {
            const studentsQuery = query(collection(db, 'students'));
            const studentsSnap = await getDocs(studentsQuery);
            manualStudents = studentsSnap.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Student))
                .filter(s => s.trainerId === trainerId)
                .map(s => ({ ...s, isRegistered: false }));
        } catch (e) {
            console.error("Error fetching manual students:", e);
        }

        // 2. Fetch App Users (Risky query, wrapped in try/catch)
        let appUsers: Student[] = [];
        try {
            // FETCH ALL strategy for users collection to bypass missing index error
            const usersQuery = query(collection(db, 'users'));
            const usersSnap = await getDocs(usersQuery);
            appUsers = usersSnap.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Student))
                .filter(u => {
                    // Filter in memory for both Trainer ID and Role
                    const r = (u as any).role;
                    const tid = (u as any).trainerId;
                    const isStudent = r === 'STUDENT' || r === 'student';
                    const matchesTrainer = tid === trainerId;
                    return isStudent && matchesTrainer;
                })
                .map(u => ({ ...u, status: (u as any).status || 'Ativo', isRegistered: true }));
        } catch (e) {
            console.log("Error fetching app users (non-fatal):", e);
        }

        // 3. Merge
        const allStudents = [...manualStudents, ...appUsers];
        const unique = Array.from(new Map(allStudents.map(s => [s.id, s])).values());

        return unique;
    },

    // Legacy support (deprecated)
    getStudentsByTrainer: async (trainerId: string) => {
        return studentService.getStudentsByTrainerSafe(trainerId);
    },

    saveStudent: async (student: Student) => {
        const { id, ...rest } = student;
        await setDoc(doc(db, 'students', id), rest);
    },

    deleteStudent: async (studentId: string) => {
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'students', studentId));
    },

    getWeightHistory: async (studentId: string) => {
        try {
            // Try to fetch history subcollection
            const historyRef = collection(db, `users/${studentId}/weight_history`);
            const q = query(historyRef, orderBy('date', 'asc'));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                return snapshot.docs.map(doc => ({
                    date: doc.data().date.toDate().toLocaleDateString('pt-BR'),
                    weight: doc.data().weight
                }));
            }

            // Fallback: Get current weight from profile
            const userDoc = await getDoc(doc(db, 'users', studentId));
            if (userDoc.exists() && userDoc.data().weight) {
                return [{
                    date: 'Atual',
                    weight: userDoc.data().weight
                }];
            }

            return [];
        } catch (e) {
            console.error("Error fetching weight history:", e);
            return [];
        }
    },

    addProgress: async (studentId: string, data: any) => {
        // Remove undefined fields just in case
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );

        const progressData = {
            ...cleanData,
            date: data.date ? Timestamp.fromDate(new Date(data.date)) : Timestamp.now()
        };

        // 1. Save to students collection (Main trainer view)
        const progressRef = collection(db, `students/${studentId}/progress`);
        await addDoc(progressRef, progressData);

        // 2. Also save to users collection if it's an app user
        // This allows the student to see their own progress in their app
        try {
            const userDoc = await getDoc(doc(db, 'users', studentId));
            if (userDoc.exists()) {
                const userProgressRef = collection(db, `users/${studentId}/progress`);
                await addDoc(userProgressRef, progressData);
                
                // Update weight in user profile if provided
                if (data.weight) {
                    await setDoc(doc(db, 'users', studentId), { weight: data.weight }, { merge: true });
                }
            }
        } catch (e) {
            console.warn("Could not sync progress to app user profile:", e);
        }

        // 3. Update main student document (Trainer's manual entry)
        const updates: any = { lastProgressUpdate: Timestamp.now() };
        if (data.weight) updates.weight = data.weight;
        if (data.notes) updates.trainerNotes = data.notes;

        await setDoc(doc(db, 'students', studentId), updates, { merge: true });
    },

    getStudentById: async (studentId: string): Promise<Student | null> => {
        try {
            // Priority: Users collection (App users)
            const userDoc = await getDoc(doc(db, 'users', studentId));
            if (userDoc.exists()) return { id: userDoc.id, ...userDoc.data() } as Student;

            // Fallback: Students collection (Manual entries)
            const studentDoc = await getDoc(doc(db, 'students', studentId));
            if (studentDoc.exists()) return { id: studentDoc.id, ...studentDoc.data() } as Student;

            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    getDetailedProgress: async (studentId: string) => {
        const progressRef = collection(db, `students/${studentId}/progress`);
        const q = query(progressRef, orderBy('date', 'desc')); // Newest first
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
};
