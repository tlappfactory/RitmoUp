export enum UserRole {
  STUDENT = 'STUDENT',
  TRAINER = 'TRAINER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  specialties?: string[];
  certifications?: string[];
  bio?: string;
  pixKey?: string;
  experienceYears?: number;
  rating?: number;
  studentsCount?: number;
  gender?: 'Mulher' | 'Homem' | 'Não binário / Outro' | 'Prefiro não informar';
  subscriptionStatus?: 'active' | 'inactive' | 'trial' | 'past_due';
  subscriptionExpiresAt?: any;
  createdAt?: any;
  planId?: string;
  weeklyGoal?: number;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment?: string;
  level?: 'Iniciante' | 'Intermediário' | 'Avançado';
  description?: string;
  instructions?: string[];
  tips?: string[];
  imageUrl?: string;
  videoUrl?: string;
  type?: string; // Added to match mockData
}

export interface WorkoutExercise extends Exercise {
  sets: number;
  reps: string;
  weight?: string;
  rest?: string;
  notes?: string;
  groupId?: string; // Exercises with same groupId form a superset
}

export interface Workout {
  id: string;
  trainerId?: string; // Made optional for mockData compatibility
  studentId?: string; // Made optional for mockData compatibility
  studentName?: string; // Optional for display
  title: string;
  description?: string;
  exercises?: WorkoutExercise[]; // Made optional as mockData doesn't always have it
  createdAt?: any; // Timestamp
  updatedAt?: any;
  duration?: number; // Added
  level?: string; // Added
  type?: string; // Added
  exercisesCount?: number; // Added
  isTemplate?: boolean;
  originalTemplateId?: string;
  tags?: string[];
}

export interface SubscriptionPlan {
  id: string;
  title: string;
  price: number;
  features: string[];
  periodicity: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
  active: boolean;
}

export type PaymentMethod = 'PIX' | 'CREDIT_CARD';

export interface Student {
  id: string;
  name: string;
  email?: string;
  status: 'Ativo' | 'Pendente' | 'Inativo';
  lastWorkout?: string;
  goal: string;
  progress: number;
  avatarUrl?: string;
  subscriptionId?: string;
  subscriptionStatus?: 'Ativo' | 'Cancelado' | 'Vencido';
  nextPaymentDate?: string;
  weight?: number;
  height?: number;
  age?: number;
  injuries?: string;
  isRegistered?: boolean;
  trainerId?: string;
  trainerNotes?: string;
  gender?: 'Mulher' | 'Homem' | 'Não binário / Outro' | 'Prefiro não informar';
  gamification?: GamificationProfile;
}

export interface TrainerProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  specialties: string[];
  certifications: string[];
  bio: string;
  pixKey: string;
  experienceYears: number;
  rating: number;
  studentsCount: number;
  gender?: 'Mulher' | 'Homem' | 'Não binário / Outro' | 'Prefiro não informar';
  subscriptionStatus?: 'active' | 'inactive' | 'trial' | 'past_due';
  planId?: string;
}

export interface FinancialRecord {
  id?: string;
  trainerId?: string; // Optional for mock
  studentId?: string; // Optional for mock
  studentName: string;
  amount: number;
  status: 'Pago' | 'Pendente' | 'Atrasado' | 'Aguardando Confirmação';
  date: any; // Timestamp
  dueDate?: any; // Timestamp
  method: PaymentMethod;
  description?: string; // Optional
  type?: 'income' | 'expense'; // Optional
  avatarUrl?: string;
  createdAt?: any;
  recurrenceId?: string;
  planName?: string; // Added
}

export interface ProgressEntry {
  id?: string;
  studentId: string;
  date: any; // Timestamp
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  sleepQuality?: number; // 1-10
  dailyEnergy?: number; // 1-10
  stressLevel?: number; // 1-10
  progressSatisfaction?: number; // 1-10
  hydration?: number; // liters
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    armRight?: number;
    armLeft?: number;
    thighRight?: number;
    thighLeft?: number;
    calfRight?: number;
    calfLeft?: number;
  };
  notes?: string;
  photos?: string[];
}
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface GamificationProfile {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate?: string;
  achievements: Achievement[];
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string; // ISO String
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  imageUrl?: string;
  likes: string[]; // Array of user IDs
  comments: Comment[];
  createdAt: string; // ISO String
  trainerId: string; // The "Tribe" identifier
}
