import { db } from '../lib/firebase';
import { collection, getDocs, query, where, addDoc, Timestamp, orderBy } from 'firebase/firestore';

export interface Appointment {
    id?: string;
    trainerId: string;
    studentId?: string; // Optional for now, fallback to studentName
    studentName: string;
    trainerName?: string; // Add trainer name for display on student side
    date: Timestamp;
    duration?: number; // Duration in minutes (default 60)
    type: string; // Musculação, Cardio, Avaliação, etc.
    status: 'scheduled' | 'completed' | 'cancelled' | 'reschedule_pending';
    notes?: string; // Trainer notes
    location?: string; // Optional location
}

export const scheduleService = {
    // Helper to get all appointments for a trainer (base query)
    getAllAppointments: async (trainerId: string) => {
        const q = query(
            collection(db, 'appointments'),
            where('trainerId', '==', trainerId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    },

    getClasses: async (trainerId: string) => {
        // Fetch all and sort in memory
        const appointments = await scheduleService.getAllAppointments(trainerId);
        return appointments.sort((a, b) => a.date.toMillis() - b.date.toMillis());
    },

    getTodayClasses: async (trainerId: string) => {
        const appointments = await scheduleService.getAllAppointments(trainerId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return appointments
            .filter(apt => {
                const date = apt.date.toDate();
                return date >= today && date < tomorrow;
            })
            .sort((a, b) => a.date.toMillis() - b.date.toMillis());
    },

    getUpcomingClasses: async (trainerId: string) => {
        const appointments = await scheduleService.getAllAppointments(trainerId);
        const now = new Date();

        return appointments
            .filter(apt => apt.date.toDate() >= now)
            .sort((a, b) => a.date.toMillis() - b.date.toMillis());
    },

    createClass: async (data: Omit<Appointment, 'id'>) => {
        // Sanitize data to remove undefined values
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );
        const docRef = await addDoc(collection(db, 'appointments'), cleanData);
        return docRef.id;
    },

    updateAppointment: async (id: string, data: Partial<Appointment>) => {
        const { updateDoc, doc } = await import('firebase/firestore');
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );
        await updateDoc(doc(db, 'appointments', id), cleanData);
    },

    deleteAppointment: async (id: string) => {
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'appointments', id));
    },

    getAppointmentById: async (id: string) => {
        const { getDoc, doc } = await import('firebase/firestore');
        const docSnap = await getDoc(doc(db, 'appointments', id));
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Appointment;
        }
        return null;
    },

    getAppointmentsByDateRange: async (trainerId: string, startDate: Date, endDate: Date) => {
        const appointments = await scheduleService.getAllAppointments(trainerId);

        // Ensure start/end are comparable
        const start = startDate.getTime();
        const end = endDate.getTime();

        return appointments
            .filter(apt => {
                const time = apt.date.toDate().getTime();
                return time >= start && time <= end;
            })
            .sort((a, b) => a.date.toMillis() - b.date.toMillis());
    },

    getDashboardUpcoming: async (trainerId: string) => {
        const appointments = await scheduleService.getAllAppointments(trainerId);

        // Show all classes from Today (00:00) onwards, so the trainer sees the day's full agenda
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        return appointments
            .filter(apt => {
                if (!apt.date || !apt.date.toDate) return false;
                const d = apt.date.toDate();
                return apt.status !== 'cancelled' && d >= startOfToday;
            })
            .sort((a, b) => a.date.toMillis() - b.date.toMillis())
            .slice(0, 4);
    },

    getStudentAppointments: async (studentId: string) => {
        const q = query(
            collection(db, 'appointments'),
            where('studentId', '==', studentId)
        );
        const snapshot = await getDocs(q);
        const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        return appointments.sort((a, b) => {
            const aTime = a.date?.toMillis ? a.date.toMillis() : 0;
            const bTime = b.date?.toMillis ? b.date.toMillis() : 0;
            return aTime - bTime;
        });
    },

    getStudentDashboardUpcoming: async (studentId: string) => {
        const appointments = await scheduleService.getAllAppointmentsByStudent(studentId);

        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        return appointments
            .filter(apt => {
                if (!apt.date || !apt.date.toDate) return false;
                const d = apt.date.toDate();
                return apt.status !== 'cancelled' && d >= startOfToday;
            })
            .sort((a, b) => a.date.toMillis() - b.date.toMillis())
            .slice(0, 4);
    },

    getAllAppointmentsByStudent: async (studentId: string) => {
        const q = query(
            collection(db, 'appointments'),
            where('studentId', '==', studentId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    },

    // Reschedule Request Logic
    requestReschedule: async (appointmentId: string, studentId: string, studentName: string, trainerId: string, oldDate: Timestamp, newDate: Date) => {
        const cleanData = {
            appointmentId,
            studentId,
            studentName,
            trainerId,
            oldDate,
            requestedDate: Timestamp.fromDate(newDate),
            status: 'pending',
            createdAt: Timestamp.now()
        };
        const batch = (await import('firebase/firestore')).writeBatch(db);
        const { doc } = await import('firebase/firestore');

        // Create request
        const reqRef = doc(collection(db, 'reschedule_requests'));
        batch.set(reqRef, cleanData);

        // Update appointment status
        const appRef = doc(db, 'appointments', appointmentId);
        batch.update(appRef, { status: 'reschedule_pending' });

        await batch.commit();
    },

    getPendingRescheduleRequests: async (trainerId: string) => {
        console.log("Fetching reschedule requests for:", trainerId);
        const q = query(
            collection(db, 'reschedule_requests'),
            where('trainerId', '==', trainerId),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RescheduleRequest));
        // Sort in memory to avoid index issues for now
        return reqs.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    },

    respondToRescheduleRequest: async (requestId: string, appointmentId: string, newDate: Timestamp | null, status: 'accepted' | 'rejected') => {
        const { updateDoc, doc } = await import('firebase/firestore');
        const batch = (await import('firebase/firestore')).writeBatch(db);

        // Update request status
        const requestRef = doc(db, 'reschedule_requests', requestId);
        batch.update(requestRef, { status });

        const appointmentRef = doc(db, 'appointments', appointmentId);

        if (status === 'accepted' && newDate) {
            // Update appointment to new date and confirm
            batch.update(appointmentRef, { date: newDate, status: 'scheduled' });
        } else {
            // Revert status to scheduled if rejected
            batch.update(appointmentRef, { status: 'scheduled' });
        }

        await batch.commit();
    },

    // Class Request Logic (New)
    requestClass: async (studentId: string, studentName: string, trainerId: string, date: Date, type: string) => {
        const cleanData = {
            studentId,
            studentName,
            trainerId,
            requestedDate: Timestamp.fromDate(date),
            type,
            status: 'pending',
            createdAt: Timestamp.now()
        };
        const { addDoc, collection } = await import('firebase/firestore');
        await addDoc(collection(db, 'class_requests'), cleanData);
    },

    getPendingClassRequests: async (trainerId: string) => {
        const q = query(
            collection(db, 'class_requests'),
            where('trainerId', '==', trainerId),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassRequest));
        return reqs.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    },

    respondToClassRequest: async (requestId: string, status: 'accepted' | 'rejected') => {
        const { updateDoc, doc, getDoc } = await import('firebase/firestore');
        const batch = (await import('firebase/firestore')).writeBatch(db);

        const requestRef = doc(db, 'class_requests', requestId);
        batch.update(requestRef, { status });

        if (status === 'accepted') {
            // Fetch request data to create appointment
            const reqSnap = await getDoc(requestRef);
            if (reqSnap.exists()) {
                const data = reqSnap.data() as ClassRequest;
                // Create appointment
                const newAppt = {
                    trainerId: data.trainerId,
                    studentId: data.studentId,
                    studentName: data.studentName,
                    date: data.requestedDate,
                    type: data.type,
                    status: 'scheduled',
                    duration: 60 // Default
                };
                const apptRef = doc(collection(db, 'appointments'));
                batch.set(apptRef, newAppt);
            }
        }

        await batch.commit();
    }
};

export interface RescheduleRequest {
    id: string;
    appointmentId: string;
    studentId: string;
    studentName: string;
    trainerId: string;
    oldDate: Timestamp;
    requestedDate: Timestamp;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Timestamp;
}

export interface ClassRequest {
    id: string;
    studentId: string;
    studentName: string;
    trainerId: string;
    requestedDate: Timestamp;
    type: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Timestamp;
}
