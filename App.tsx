import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './ToastContext';
import { ThemeProvider } from './ThemeContext';
import { Login, RegisterSelection, RegisterForm } from './pages/AuthPages';
import { PricingPage } from './pages/PublicPages';
import { SeedPage } from './pages/SeedPage';
import { StudentDashboard, StudentWorkouts, StudentProfile, WorkoutSession, StudentProgress, StudentSchedule } from './pages/StudentPages';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { StudentStatsPage } from './pages/StudentStatsPage';
import { TrainerDashboard, TrainerStudents, CreateWorkout, TrainerSchedule, TrainerFinancials, TrainerProfile } from './pages/TrainerPages';
import { TrainerWorkouts } from './pages/TrainerWorkouts';
import { Settings, PaymentSuccessPage } from './pages/CommonPages';
import { Connections } from './pages/Connections';
import { SubscriptionManagementPage } from './components/Financials/SubscriptionManagementPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { CommunityPage } from './pages/CommunityPage';
import { UserRole } from './types';
import { VersionChecker } from './components/System/VersionChecker';

import { PullToRefresh } from './components/PullToRefresh';

const PrivateRoute = ({ children, allowedRole }: { children?: React.ReactNode, allowedRole?: UserRole }) => {
  const { user, firebaseUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;
  }

  if (!user) {
    // If authenticated but no user profile (new Google user), redirect to complete profile
    if (firebaseUser) {
      return <Navigate to="/complete-profile" replace />;
    }
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === UserRole.TRAINER ? '/trainer/dashboard' : '/student/dashboard'} replace />;
  }

  // Subscription Lock for Trainers
  if (user.role === UserRole.TRAINER) {
    // Calculate if within 7 days trial
    const trialEndDate = user?.createdAt ? new Date(user.createdAt.seconds * 1000 + 7 * 24 * 60 * 60 * 1000) : new Date();
    const isWithinTrialPeriod = new Date() < trialEndDate;

    const isSubscriptionActive = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trial' || isWithinTrialPeriod;
    const isSubscriptionPage = location.pathname === '/trainer/subscription';

    // If not active/trial and not on subscription page, redirect
    if (!isSubscriptionActive && !isSubscriptionPage) {
      return <Navigate to="/trainer/subscription" replace />;
    }
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, firebaseUser, loading } = useAuth();

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    window.location.reload();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0f172a]"><span className="material-symbols-outlined animate-spin text-4xl text-[#00ff88]">progress_activity</span></div>;
  }

  if (user) {
    return <Navigate to={user.role === UserRole.TRAINER ? '/trainer/dashboard' : '/student/dashboard'} replace />;
  }

  // If authenticated via Google but no profile, allow access to public routes? 
  // No, we should probably redirect them to complete profile if they try to access Login page again.
  if (firebaseUser && !user) {
    return <Navigate to="/complete-profile" replace />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {children}
    </PullToRefresh>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterSelection /></PublicRoute>} />
      <Route path="/welcome" element={<Navigate to="/login" replace />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/register/form" element={<PublicRoute><RegisterForm /></PublicRoute>} />
      <Route path="/complete-profile" element={<RegisterSelection />} />



      {/* Student Routes */}
      <Route path="/student/dashboard" element={<PrivateRoute allowedRole={UserRole.STUDENT}><StudentDashboard /></PrivateRoute>} />
      <Route path="/student/workouts" element={<PrivateRoute allowedRole={UserRole.STUDENT}><StudentWorkouts /></PrivateRoute>} />
      <Route path="/student/workout/:id" element={<PrivateRoute allowedRole={UserRole.STUDENT}><WorkoutSession /></PrivateRoute>} />
      <Route path="/student/workout/:id" element={<PrivateRoute allowedRole={UserRole.STUDENT}><WorkoutSession /></PrivateRoute>} />
      <Route path="/student/progress" element={<PrivateRoute allowedRole={UserRole.STUDENT}><StudentStatsPage /></PrivateRoute>} />
      <Route path="/student/analytics" element={<Navigate to="/student/progress" replace />} />
      <Route path="/student/schedule" element={<PrivateRoute allowedRole={UserRole.STUDENT}><StudentSchedule /></PrivateRoute>} />
      <Route path="/student/profile" element={<PrivateRoute allowedRole={UserRole.STUDENT}><StudentProfile /></PrivateRoute>} />
      <Route path="/student/exercises" element={<PrivateRoute allowedRole={UserRole.STUDENT}><ExercisesPage /></PrivateRoute>} />
      <Route path="/student/community" element={<PrivateRoute allowedRole={UserRole.STUDENT}><CommunityPage /></PrivateRoute>} />


      {/* Trainer Routes */}
      <Route path="/trainer/dashboard" element={<PrivateRoute allowedRole={UserRole.TRAINER}><TrainerDashboard /></PrivateRoute>} />
      <Route path="/trainer/students" element={<PrivateRoute allowedRole={UserRole.TRAINER}><TrainerStudents /></PrivateRoute>} />
      <Route path="/trainer/workouts" element={<PrivateRoute allowedRole={UserRole.TRAINER}><TrainerWorkouts /></PrivateRoute>} />
      <Route path="/trainer/create-workout" element={<PrivateRoute allowedRole={UserRole.TRAINER}><CreateWorkout /></PrivateRoute>} />
      <Route path="/trainer/schedule" element={<PrivateRoute allowedRole={UserRole.TRAINER}><TrainerSchedule /></PrivateRoute>} />
      <Route path="/trainer/financial" element={<PrivateRoute allowedRole={UserRole.TRAINER}><TrainerFinancials /></PrivateRoute>} />
      <Route path="/trainer/subscription" element={<PrivateRoute allowedRole={UserRole.TRAINER}><SubscriptionManagementPage /></PrivateRoute>} />
      <Route path="/trainer/profile" element={<PrivateRoute allowedRole={UserRole.TRAINER}><TrainerProfile /></PrivateRoute>} />
      <Route path="/trainer/exercises" element={<PrivateRoute allowedRole={UserRole.TRAINER}><ExercisesPage /></PrivateRoute>} />
      <Route path="/trainer/community" element={<PrivateRoute allowedRole={UserRole.TRAINER}><CommunityPage /></PrivateRoute>} />

      <Route path="/connections" element={<PrivateRoute><Connections /></PrivateRoute>} />

      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

      {/* Success Route - Public to ensure visibility after redirect */}
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/seed" element={<PrivateRoute><SeedPage /></PrivateRoute>} />

      {/* Catch-all - Redirect to home which handles role redirection */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

import { App as CapApp } from '@capacitor/app';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <VersionChecker />
          <HashRouter>
            <DeepLinkHandler />
            <AppRoutes />
          </HashRouter>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const DeepLinkHandler = () => {
  const navigate = React.useMemo(() => {
    // We need to use useNavigate but we are outside of HashRouter in App usually.
    // Wait, HashRouter is inside App. So we should put DeepLinkHandler inside HashRouter.
    return null;
  }, []);

  const { firebaseUser } = useAuth();
  const location = useLocation();
  const navigateFn = useNavigate();

  React.useEffect(() => {
    const setupDeepLinks = async () => {
      CapApp.addListener('appUrlOpen', (event: any) => {
        // Example: ritmoup://trainer/dashboard
        const url = new URL(event.url);
        const path = url.host + url.pathname; // host can be 'trainer', pathname '/dashboard'

        if (path === 'trainer/dashboard' || event.url.includes('trainer/dashboard')) {
          navigateFn('/trainer/dashboard');
        } else if (event.url.includes('payment/success')) {
          navigateFn('/payment/success');
        }
      });
    };

    setupDeepLinks();

    return () => {
      CapApp.removeAllListeners();
    };
  }, [navigateFn]);

  return null;
};