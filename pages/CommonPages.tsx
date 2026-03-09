import React, { useState } from 'react';
import { DashboardLayout } from '../components/Layout';
import { Card, Button, Input } from '../components/UIComponents';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ToastContext';
import { useTheme } from '../ThemeContext';

export const Settings = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Mock Profile State
    const [profile, setProfile] = useState({
        name: user?.name || 'Usuário',
        email: user?.email || 'usuario@email.com',
        bio: 'Apaixonado por fitness e vida saudável.'
    });

    // Mock Notification Settings
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        marketing: false
    });

    const handleLogout = () => {
        logout();
        navigate('/');
        showToast('Você saiu da conta.', 'info');
    };

    const handleSaveProfile = () => {
        setIsEditingProfile(false);
        showToast('Perfil atualizado com sucesso!', 'success');
    };

    const toggleNotification = (key: keyof typeof notifications) => {
        setNotifications(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            showToast(`Notificações ${key === 'email' ? 'por E-mail' : key === 'push' ? 'Push' : 'de Marketing'} ${newState[key] ? 'ativadas' : 'desativadas'}`, 'info');
            return newState;
        });
    };

    const { theme, toggleTheme } = useTheme();

    return (
        <DashboardLayout title="Configurações" showBack>
            <div className="space-y-6 max-w-2xl mx-auto">

                {/* Profile Section */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 mb-2 px-2 uppercase tracking-wide">Conta</h3>
                    <Card className="p-0 overflow-hidden">
                        {!isEditingProfile ? (
                            <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setIsEditingProfile(true)}>
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                                        {profile.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-light dark:text-white">{profile.name}</p>
                                        <p className="text-sm text-gray-400">{profile.email}</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-gray-500">edit</span>
                            </div>
                        ) : (
                            <div className="p-4 space-y-4 bg-black/20">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-text-light dark:text-white">Editar Perfil</h4>
                                    <button onClick={() => setIsEditingProfile(false)} className="text-gray-400 hover:text-white">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <Input
                                    label="Nome Completo"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                />
                                <Input
                                    label="E-mail"
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                />
                                <div>
                                    <label className="text-sm text-gray-400 font-bold ml-1 mb-1 block">Bio</label>
                                    <textarea
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-text-light dark:text-white focus:outline-none focus:border-primary resize-none h-24"
                                        value={profile.bio}
                                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button onClick={handleSaveProfile}>Salvar Alterações</Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Notifications Section */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 mb-2 px-2 uppercase tracking-wide">Notificações</h3>
                    <Card className="divide-y divide-white/5 p-0 overflow-hidden">
                        {[
                            { key: 'push', label: 'Notificações Push', icon: 'notifications' },
                            { key: 'email', label: 'E-mails de Atividade', icon: 'mail' },
                            { key: 'marketing', label: 'Novidades e Promoções', icon: 'campaign' }
                        ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${notifications[item.key as keyof typeof notifications] ? 'text-primary bg-primary/10' : 'text-gray-500 bg-white/5'}`}>
                                        <span className="material-symbols-outlined">{item.icon}</span>
                                    </div>
                                    <span className="font-medium text-text-light dark:text-gray-200">{item.label}</span>
                                </div>
                                <button
                                    onClick={() => toggleNotification(item.key as keyof typeof notifications)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${notifications[item.key as keyof typeof notifications] ? 'bg-primary' : 'bg-gray-700'}`}
                                >
                                    <div className={`size-4 rounded-full bg-white absolute top-1 transition-transform ${notifications[item.key as keyof typeof notifications] ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        ))}
                    </Card>
                </div>

                {/* Appearance Section */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 mb-2 px-2 uppercase tracking-wide">Aparência</h3>
                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                    <span className="material-symbols-outlined">
                                        {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                                    </span>
                                </div>
                                <span className="font-medium text-text-light dark:text-gray-200">
                                    {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
                                </span>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-purple-500' : 'bg-gray-300'}`}
                            >
                                <div className={`size-4 rounded-full bg-white absolute top-1 transition-transform ${theme === 'dark' ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </Card>
                    <p className="text-xs text-gray-500 px-2 mt-2">
                        Alternar entre temas claro e escuro.
                    </p>
                </div>

                <Button variant="danger" className="w-full h-14 mt-8" onClick={handleLogout}>
                    <span className="material-symbols-outlined mr-2">logout</span> Sair da Conta
                </Button>

                {/* Force Update / Debug Section */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/5 text-center space-y-3 pb-8">
                    <p className="text-xs text-gray-400">Versão: v{import.meta.env.PACKAGE_VERSION}</p>
                    <button
                        onClick={() => {
                            showToast('Verificando e recarregando...', 'info');
                            setTimeout(() => window.location.reload(), 500);
                        }}
                        className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1 mx-auto py-2 px-4 rounded-lg hover:bg-white/5 active:bg-white/10"
                    >
                        <span className="material-symbols-outlined text-sm">update</span>
                        Forçar Atualização Local
                    </button>
                </div>
            </div>
        </DashboardLayout>
    )
}

export const PaymentSuccessPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-[#1e293b] border border-white/10 rounded-3xl p-8 text-center shadow-2xl animate-fade-in-up">
                <div className="size-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">Pagamento Confirmado!</h1>
                <p className="text-gray-400 mb-8">
                    Sua assinatura foi processada com sucesso. Bem-vindo ao time de profissionais de elite.
                </p>

                <Button
                    className="w-full py-4 text-lg font-bold"
                    onClick={() => navigate(user && user.role === 'TRAINER' ? '/trainer/dashboard' : '/')}
                >
                    Ir para o Dashboard
                </Button>
            </div>
        </div>
    );
};