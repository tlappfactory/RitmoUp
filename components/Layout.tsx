import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { UserRole } from '../types';
import { useToast } from '../ToastContext';
import { useTheme } from '../ThemeContext';
import { BackButton } from './BackButton';
import { PullToRefresh } from './PullToRefresh';

interface NavLink {
  icon: string;
  label: string;
  path: string;
  primary?: boolean;
}

const getLinks = (user: any): NavLink[] => {
  const role = user?.role;
  const status = user?.subscriptionStatus || 'trial';

  if (role === UserRole.TRAINER) {
    const isLocked = status !== 'active' && status !== 'trial';

    if (isLocked) {
      return [
        { icon: 'card_membership', label: 'Assinatura', path: '/trainer/subscription' },
      ];
    }

    return [
      { icon: 'dashboard', label: 'Painel', path: '/trainer/dashboard' },
      { icon: 'group', label: 'Alunos', path: '/trainer/students' },
      { icon: 'fitness_center', label: 'Treinos', path: '/trainer/workouts' }, // Merged
      { icon: 'calendar_month', label: 'Agenda', path: '/trainer/schedule' },
      { icon: 'payments', label: 'Financeiro', path: '/trainer/financial' }, // Merged
      { icon: 'forum', label: 'Comunidade', path: '/trainer/community' },
    ];
  }
  return [
    { icon: 'home', label: 'Início', path: '/student/dashboard' },
    { icon: 'fitness_center', label: 'Treinos', path: '/student/workouts' }, // Merged
    { icon: 'bar_chart', label: 'Progresso', path: '/student/progress' },

    { icon: 'calendar_month', label: 'Agenda', path: '/student/schedule' },
    { icon: 'forum', label: 'Comunidade', path: '/student/community' },
    { icon: 'group_add', label: 'Personal', path: '/connections' }, // Moved
  ];
};

export const DashboardLayout = ({ children, title, rightAction, showBack = false }: { children: React.ReactNode, title?: string, rightAction?: React.ReactNode, showBack?: boolean }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const links = getLinks(user);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const mainScrollRef = React.useRef<HTMLElement>(null);

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background-dark text-text-light flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col w-64 glass border-r border-glass-border h-screen sticky top-0 transition-all duration-300 ${isSidebarOpen ? '' : '-ml-48 opacity-50'}`}>
        <div className="p-6 flex items-center gap-3">
          <img src="/favicon.png" alt="Logo" className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight">Ritmo<span className="text-primary">Up</span></span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {links.map(link => {
            const isActive = location.pathname === link.path;
            const isPrimary = link.path === '/trainer/workouts' && user?.role === UserRole.TRAINER; // Make Workouts primary? Or maybe Create Workout? For now let's keep it simple. Actually sticking to text based.

            // Highlight parent paths for consolidated routes
            const isParentActive = isActive ||
              (link.path === '/trainer/workouts' && (location.pathname === '/trainer/exercises' || location.pathname === '/trainer/create-workout')) ||
              (link.path === '/trainer/financial' && location.pathname === '/trainer/subscription') ||
              (link.path === '/student/workouts' && location.pathname === '/student/exercises');

            // Actually better to handle this via creating the tabs in the page itself, but the sidebar should stay active.
            // We will handle the route redirect logic in the pages themselves or just ensure the user lands there.
            // For sidebar highlighting, let's use startsWith for sub-features if they shared path structure, but they don't perfectly. 
            // Let's just stick to exact match or specific overrides.
            const isHighlighted = isActive ||
              (link.path === '/trainer/workouts' && (location.pathname.startsWith('/trainer/workouts') || location.pathname === '/trainer/exercises' || location.pathname === '/trainer/create-workout')) ||
              (link.path === '/trainer/financial' && location.pathname === '/trainer/subscription') ||
              (link.path === '/student/workouts' && location.pathname === '/student/exercises');


            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${isHighlighted ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white'}`}
              >
                <span className={`material-symbols-outlined ${isHighlighted ? 'filled' : ''}`}>{link.icon}</span>
                <span className="font-medium">{link.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen relative min-w-0">
        {/* Mobile Header / Desktop Top Bar */}
        <header className="sticky top-0 z-30 flex flex-nowrap items-center justify-between px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] md:px-8 md:py-5 glass border-b border-glass-border bg-background-dark/80 backdrop-blur-md gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {(showBack) && (
              <BackButton className="-ml-2" />
            )}
            {title && <h1 className="text-lg md:text-xl font-bold truncate">{title}</h1>}
            {!title && (
              <div className="flex items-center gap-3 md:hidden">
                <img src="/favicon.png" alt="Logo" className="w-8 h-8 shrink-0" />
                <span className="text-lg font-bold">RitmoUp</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4 ml-auto shrink-0">
            {rightAction}
            <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-glass-border">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors ${theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-black hover:bg-black/5'
                  }`}
                title={`Mudar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
              >
                <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
              </button>

              <div className="text-right hidden md:block">
                <p className="text-sm font-bold leading-none">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {(user?.role || '').toString().toUpperCase() === 'STUDENT' ? 'Aluno' :
                    (user?.role || '').toString().toUpperCase() === 'TRAINER' ? 'Personal' : user?.role}
                </p>
              </div>

              {/* Profile Link in Header */}
              <button
                onClick={() => navigate(user?.role === UserRole.TRAINER ? '/trainer/profile' : '/student/profile')}
                className="size-8 md:size-10 rounded-full bg-surface-dark border border-white/10 flex items-center justify-center overflow-hidden shrink-0 hover:ring-2 ring-primary transition-all"
              >
                {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-gray-400">person</span>}
              </button>
            </div>
          </div>
        </header>

        <main ref={mainScrollRef} className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden pb-36 md:pb-8 w-full">
          <PullToRefresh onRefresh={handleRefresh} scrollAreaRef={mainScrollRef as React.RefObject<HTMLElement>}>
            <div className="max-w-6xl mx-auto w-full min-h-[calc(100vh-8rem)]">
              {children}
            </div>
          </PullToRefresh>
        </main>

        {/* Mobile Bottom Nav - Simplified to 5 items */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 pb-[calc(env(safe-area-inset-bottom)+0.25rem)]">
          <div className="flex justify-around items-center h-16 px-2">
            {links.map((link) => {
              // Match logic same as sidebar
              const isHighlighted = location.pathname === link.path ||
                (link.path === '/trainer/workouts' && (location.pathname.startsWith('/trainer/workouts') || location.pathname === '/trainer/exercises' || location.pathname === '/trainer/create-workout')) ||
                (link.path === '/trainer/financial' && location.pathname === '/trainer/subscription') ||
                (link.path === '/student/workouts' && location.pathname === '/student/exercises');

              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`flex flex-col items-center justify-center gap-1 w-[16%] min-w-0 transition-colors ${isHighlighted ? 'text-primary' : 'text-gray-500'}`}
                >
                  <span className={`material-symbols-outlined text-2xl ${isHighlighted ? 'filled' : ''}`}>{link.icon}</span>
                  <span className="text-[9px] font-medium leading-tight w-full text-center">{link.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

// Deprecated components kept for compatibility during refactor if needed, 
// but we should switch to DashboardLayout
export const Header = ({ title, showBack, rightAction }: any) => null;
export const BottomNav = () => null;