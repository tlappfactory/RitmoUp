import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc, Timestamp, onSnapshot } from 'firebase/firestore';

export interface ConnectionRequest {
    id: string;
    studentId: string;
    studentName: string;
    studentAvatarUrl?: string; // Optional to display in list
    trainerId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: any;
}

export const connectionService = {
    // Send a request from Student to Trainer
    async sendRequest(studentId: string, studentName: string, studentAvatarUrl: string, trainerId: string) {
        // Check if pending request already exists
        const q = query(
            collection(db, 'connection_requests'),
            where('studentId', '==', studentId),
            where('trainerId', '==', trainerId),
            where('status', '==', 'pending')
        );
        const existing = await getDocs(q);
        if (!existing.empty) throw new Error('Já existe uma solicitação pendente para este treinador.');

        await addDoc(collection(db, 'connection_requests'), {
            studentId,
            studentName,
            studentAvatarUrl,
            trainerId,
            status: 'pending',
            createdAt: Timestamp.now()
        });
    },

    // Get pending requests for a Trainer (One-off)
    async getPendingRequests(trainerId: string): Promise<ConnectionRequest[]> {
        const q = query(
            collection(db, 'connection_requests'),
            where('trainerId', '==', trainerId)
        );
        const snap = await getDocs(q);
        return snap.docs
            .map(d => ({ id: d.id, ...d.data() } as ConnectionRequest))
            .filter(req => req.status === 'pending');
    },

    // Subscribe to pending requests (Real-time)
    subscribeToPendingRequests(trainerId: string, onUpdate: (requests: ConnectionRequest[]) => void) {
        const q = query(
            collection(db, 'connection_requests'),
            where('trainerId', '==', trainerId)
        );

        return onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() } as ConnectionRequest))
                .filter(req => req.status === 'pending');
            onUpdate(requests);
        });
    },

    // Accept or Reject a request
    async respondToRequest(requestId: string, status: 'accepted' | 'rejected') {
        const reqRef = doc(db, 'connection_requests', requestId);
        const reqSnap = await getDoc(reqRef);

        if (!reqSnap.exists()) throw new Error('Solicitação não encontrada');

        await updateDoc(reqRef, { status });

        if (status === 'accepted') {
            const data = reqSnap.data();
            if (data) {
                // Link trainer to student in the 'users' collection
                // Note: This assumes 'users' collection holds both roles.
                // If 'students' are in a separate collection, adjust here. 
                // Based on `userService.ts`, we use `users` collection.
                const studentRef = doc(db, 'users', data.studentId);
                await updateDoc(studentRef, { trainerId: data.trainerId });
            }
        }
    },

    // Helper to list all trainers (for the Connect page)
    async getAvailableTrainers() {
        // Fetch trainers
        const qTrainers = query(
            collection(db, 'users'),
            where('role', '==', 'TRAINER')
        );
        const trainersSnap = await getDocs(qTrainers);

        // 1. Fetch App Students (Users collection)
        const qAppStudents = query(
            collection(db, 'users'),
            where('role', '==', 'STUDENT')
        );
        const appStudentsSnap = await getDocs(qAppStudents);

        // Aggregate counts
        const studentCounts: { [key: string]: number } = {};

        // Count App Students
        appStudentsSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.trainerId) {
                studentCounts[data.trainerId] = (studentCounts[data.trainerId] || 0) + 1;
            }
        });

        // 2. Fetch Manual Students (Students collection) - WRAPPED IN TRY/CATCH FOR SAFETY
        try {
            const qManualStudents = query(
                collection(db, 'students')
            );
            const manualStudentsSnap = await getDocs(qManualStudents);

            // Count Manual Students
            manualStudentsSnap.docs.forEach(doc => {
                const data = doc.data();
                if (data.trainerId) {
                    studentCounts[data.trainerId] = (studentCounts[data.trainerId] || 0) + 1;
                }
            });
        } catch (e) {
            console.warn("Could not fetch 'students' collection (legacy):", e);
            // Continue without manual students count, this is not critical
        }

        return trainersSnap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                name: data.name,
                avatarUrl: data.avatarUrl,
                bio: data.bio || '',
                rating: 5.0, // Mock or fetch real
                specialties: data.specialties || [],
                certifications: data.certifications || [],
                yearsExperience: data.experienceYears || 0,
                studentsCount: studentCounts[d.id] || 0,
                pixKey: data.pixKey || '',
                price: data.price || 0
            };
        });
    },

    // Get the trainer connected to the student
    async getMyTrainers(studentId: string) {
        // Fetch student doc to get trainerId
        const studentRef = doc(db, 'users', studentId);
        const studentSnap = await getDoc(studentRef);

        if (studentSnap.exists()) {
            const data = studentSnap.data();
            if (data.trainerId) {
                // Fetch trainer details
                const trainerRef = doc(db, 'users', data.trainerId);
                const trainerSnap = await getDoc(trainerRef);
                if (trainerSnap.exists()) {
                    const tData = trainerSnap.data();
                    return [{
                        id: trainerSnap.id,
                        name: tData.name,
                        avatarUrl: tData.avatarUrl,
                        bio: tData.bio || '',
                        specialties: tData.specialties || [],
                        pixKey: tData.pixKey || ''
                    }];
                }
            }
        }
        return [];
    },

    // NEW: Get pending requests for a Student
    async getStudentPendingRequests(studentId: string): Promise<string[]> {
        const q = query(
            collection(db, 'connection_requests'),
            where('studentId', '==', studentId),
            where('status', '==', 'pending')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data().trainerId);
    },

    // NEW: Disconnect student from trainer
    async disconnect(studentId: string) {
        const studentRef = doc(db, 'users', studentId);
        await updateDoc(studentRef, { trainerId: null });
    }
};
