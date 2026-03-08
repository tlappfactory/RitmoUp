import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { UserRole } from '../types';
import { useToast } from '../ToastContext';
import { Button } from '../components/UIComponents';
import { paymentService } from '../services/paymentService';

export const WelcomePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    React.useEffect(() => {
        if (user) {
            navigate(user.role === UserRole.TRAINER ? '/trainer/dashboard' : '/student/dashboard');
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#00ff88] selection:text-black overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl pt-safe">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="relative">
                            <img src="/favicon.png" alt="Logo" className="w-8 h-8 transition-transform group-hover:rotate-12" />
                            <div className="absolute inset-0 bg-[#00ff88]/50 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Ritmo<span className="text-[#00ff88]">Up</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/pricing')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Planos</button>
                        <button onClick={() => navigate('/login')} className="px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold transition-all hover:scale-105">
                            Entrar
                        </button>
                        <button onClick={() => navigate('/register')} className="px-5 py-2 rounded-full bg-[#00ff88] text-black text-sm font-bold hover:bg-[#00cc6a] transition-all hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:scale-105 hidden sm:block">
                            Começar
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-36 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#00ff88]/20 blur-[120px] rounded-full opacity-30 pointer-events-none" />
                <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full opacity-30 pointer-events-none" />

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-[#00ff88] mb-6 animate-fade-in-up">
                            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                            A Ferramenta para Personais de Elite
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-gray-500 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            Sua Consultoria <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff88] to-emerald-400 relative">
                                Em Outro Nível
                                <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#00ff88] opacity-50" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                                </svg>
                            </span>
                        </h1>

                        <p className="text-xl text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            Centralize seus alunos, automatize treinos com IA e entregue uma experiência premium que justifica seu valor. Pare de usar planilhas e WhatsApp.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#00ff88] text-black font-bold text-lg hover:bg-[#00cc6a] transition-all hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] hover:-translate-y-1 relative overflow-hidden group">
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    Começar Gratuitamente <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                                </span>
                            </button>
                            <button onClick={() => window.open('https://youtu.be/rH674m_Mn4Y', '_blank')} className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-lg transition-all hover:-translate-y-1 flex items-center justify-center gap-2 group">
                                <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-[#00ff88]">play_circle</span>
                                Ver Tour da Plataforma
                            </button>
                        </div>

                        <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-sm font-medium text-gray-500 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#00ff88]">check_circle</span> 7 dias grátis Pro
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#00ff88]">check_circle</span> App para você e seus alunos
                            </div>
                        </div>
                    </div>

                    {/* Hero Visual - Business Style */}
                    <div className="relative lg:h-[600px] flex items-center justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <div className="relative w-full max-w-lg aspect-square">
                            {/* Decorative Circles */}
                            <div className="absolute inset-0 border border-white/5 rounded-full animate-[spin_10s_linear_infinite]" />
                            <div className="absolute inset-12 border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

                            {/* Glass Mockup Card */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-[#1e293b] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md rotate-[-5deg] hover:rotate-0 transition-all duration-500 group">
                                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                    <h3 className="font-bold text-white">Resumo Financeiro</h3>
                                    <span className="text-xs font-bold bg-green-500/20 text-green-500 px-2 py-1 rounded">Este Mês</span>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase font-bold mb-1">Receita Confirmada</p>
                                        <p className="text-3xl font-bold text-white">R$ 12.450,00</p>
                                        <div className="h-1.5 w-full bg-gray-700 rounded-full mt-2">
                                            <div className="h-1.5 rounded-full bg-[#00ff88] w-[85%]" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                            <span className="material-symbols-outlined text-purple-400 mb-2">group</span>
                                            <p className="text-2xl font-bold text-white">42</p>
                                            <p className="text-[10px] text-gray-400">Alunos Ativos</p>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                            <span className="material-symbols-outlined text-blue-400 mb-2">event_available</span>
                                            <p className="text-2xl font-bold text-white">18</p>
                                            <p className="text-[10px] text-gray-400">Aulas Hoje</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Stats Card */}
                            <div className="absolute -bottom-4 right-10 bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl animate-bounce-slow">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 text-blue-500 rounded-lg">
                                        <span className="material-symbols-outlined text-xl">auto_fix_high</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Tempo Economizado</p>
                                        <p className="text-lg font-bold text-white">~15h / semana</p>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Users Avatar Group */}
                            <div className="absolute top-10 -left-4 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-xl animate-float" style={{ animationDelay: '1s' }}>
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map(i => (
                                            <img key={i} src={`https://i.pravatar.cc/100?u=${i + 20}`} className="size-8 rounded-full border-2 border-black" alt="user" />
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold text-white">Novos Alunos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Showcase Section */}
            <section className="py-24 px-6 relative">
                <div className="absolute inset-0 bg-[#1e293b]/50 skew-y-1 transform origin-top-left -z-10" />

                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-3xl lg:text-5xl font-bold mb-6">Sua consultoria merece <span className="text-[#00ff88]">mais que planilhas</span></h2>
                        <p className="text-gray-400 text-lg">Substitua o caos de PDFs e Whatsapp por uma plataforma que trabalha por você.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-3xl group md:col-span-2 relative overflow-hidden bg-[#1e293b]/50 border border-white/5 backdrop-blur-xl">
                            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-9xl">monitoring</span>
                            </div>
                            <div className="relative z-10">
                                <div className="size-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <span className="material-symbols-outlined text-3xl">smart_display</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Painel de Controle Centralizado</h3>
                                <p className="text-gray-400 leading-relaxed max-w-md">Gerencie 10, 50 ou 100 alunos sem perder o controle. Saiba quem treinou, quem faltou e quem precisa de ajuste na carga, tudo em uma única tela.</p>
                            </div>
                            <div className="absolute -bottom-10 right-0 w-2/3 h-40 bg-gradient-to-t from-blue-500/10 to-transparent blur-2xl" />
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-3xl group relative overflow-hidden bg-gradient-to-b from-white/5 to-transparent border border-white/5 backdrop-blur-xl">
                            <div className="relative z-10">
                                <div className="size-14 rounded-2xl bg-[#00ff88]/10 text-[#00ff88] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <span className="material-symbols-outlined text-3xl">bolt</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-3">IA que Economiza Tempo</h3>
                                <p className="text-gray-400 leading-relaxed">Crie periodizações completas em segundos, não horas. Nossa IA sugere treinos baseados no perfil do aluno.</p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-3xl group relative overflow-hidden bg-gradient-to-b from-white/5 to-transparent border border-white/5 backdrop-blur-xl">
                            <div className="relative z-10">
                                <div className="size-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <span className="material-symbols-outlined text-3xl">payments</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Financeiro Profissional</h3>
                                <p className="text-gray-400 leading-relaxed">Automatize cobranças e lembretes. Pare de cobrar "no boca a boca" e profissionalize sua renda.</p>
                            </div>
                        </div>

                        {/* Feature 4 */}
                        <div className="p-8 rounded-3xl group md:col-span-2 relative overflow-hidden bg-[#1e293b]/50 border border-white/5 backdrop-blur-xl">
                            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-9xl">phone_iphone</span>
                            </div>
                            <div className="relative z-10">
                                <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <span className="material-symbols-outlined text-3xl">app_shortcut</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-3">App Premium com Sua Marca</h3>
                                <p className="text-gray-400 leading-relaxed max-w-md">Entregue valor real. Seus alunos terão um app moderno para acessar treinos, vídeos demonstrativos e registrar progresso.</p>
                            </div>
                            <div className="absolute -bottom-10 right-0 w-2/3 h-40 bg-gradient-to-t from-amber-500/10 to-transparent blur-2xl" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats/Social Proof */}
            <section className="py-20 border-y border-white/5 bg-black/40">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div>
                        <p className="text-4xl lg:text-5xl font-bold text-white mb-2">+15h</p>
                        <p className="text-gray-500 font-medium">Economizadas Semana</p>
                    </div>
                    <div>
                        <p className="text-4xl lg:text-5xl font-bold text-white mb-2">3x</p>
                        <p className="text-gray-500 font-medium">Mais Alunos Atendidos</p>
                    </div>
                    <div>
                        <p className="text-4xl lg:text-5xl font-bold text-white mb-2">98%</p>
                        <p className="text-gray-500 font-medium">Retenção de Alunos</p>
                    </div>
                    <div>
                        <p className="text-4xl lg:text-5xl font-bold text-white mb-2">Zero</p>
                        <p className="text-gray-500 font-medium">Inadimplência</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#00ff88]/5 to-transparent pointer-events-none" />
                <div className="max-w-3xl mx-auto relative z-10">
                    <h2 className="text-4xl lg:text-6xl font-bold mb-8">Pronto para evoluir?</h2>
                    <p className="text-xl text-gray-400 mb-12">Junte-se a milhares de profissionais que já modernizaram sua consultoria.</p>
                    <button onClick={() => navigate('/register')} className="px-10 py-5 rounded-full bg-[#00ff88] text-black font-bold text-xl hover:bg-[#00cc6a] transition-all hover:scale-105 shadow-[0_0_40px_rgba(0,255,136,0.3)]">
                        Criar Conta Grátis
                    </button>
                    <p className="mt-6 text-sm text-gray-500">Sem cartão de crédito • Cancelamento a qualquer momento</p>
                </div>
            </section>

            <footer className="py-12 border-t border-white/5 text-center text-gray-600 text-sm">
                <p>&copy; {new Date().getFullYear()} RitmoUp. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};


export const PricingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();



    const handleSubscribe = async () => {
        if (!user) {
            showToast("Crie uma conta ou faça login para assinar.", "info");
            navigate('/register');
            return;
        }

        if (user.role !== 'TRAINER') {
            showToast("Este plano é exclusivo para Personal Trainers.", "warning");
            return;
        }

        showToast("Iniciando pagamento seguro...", "info");
        try {
            await paymentService.initiatePayment();
            navigate('/payment/success');
        } catch (error) {
            console.error(error);
            showToast("Pagamento cancelado ou falhou", "error");
        }
    };

    return (
        <div className="min-h-screen py-32 px-6 flex flex-col items-center bg-[#0f172a] text-white">
            <button onClick={() => navigate(user ? '/trainer/dashboard' : '/welcome')} className="fixed top-6 left-6 p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all z-50">
                <span className="material-symbols-outlined">arrow_back</span>
            </button>

            <h1 className="text-4xl font-bold mb-4 text-center">Planos para Personal Trainers</h1>
            <p className="text-gray-400 mb-16 text-center max-w-lg">
                Comece com 7 dias grátis. Cancele quando quiser.
            </p>

            <div className="flex flex-col md:flex-row gap-8 max-w-4xl w-full">
                {/* Free Tier (Implicit in message, usually purely trial or limited) - Let's just show the main Pro plan */}
                <div className="flex-1 relative border-[#00ff88]/50 shadow-2xl shadow-[#00ff88]/10 bg-[#1e293b]/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8">
                    <div className="absolute top-0 right-0 bg-[#00ff88] text-black text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                        MAIS POPULAR
                    </div>

                    <h3 className="text-2xl font-bold mb-2">Pro Trainer</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-bold">R$ 12,99</span>
                        <span className="text-gray-400">/mês</span>
                    </div>

                    <ul className="space-y-4 mb-8 text-gray-300">
                        <li className="flex items-center gap-3"><span className="text-[#00ff88] material-symbols-outlined text-sm">check</span> Alunos Ilimitados</li>
                        <li className="flex items-center gap-3"><span className="text-[#00ff88] material-symbols-outlined text-sm">check</span> Criação de Treinos com IA</li>
                        <li className="flex items-center gap-3"><span className="text-[#00ff88] material-symbols-outlined text-sm">check</span> Templates Personalizados</li>
                        <li className="flex items-center gap-3"><span className="text-[#00ff88] material-symbols-outlined text-sm">check</span> Gestão Financeira Completa</li>
                    </ul>

                    <button
                        onClick={handleSubscribe}
                        className="w-full py-4 text-lg bg-[#00ff88] text-[#0f172a] font-bold rounded-xl hover:bg-[#00cc6a] transition-all shadow-lg hover:shadow-[#00ff88]/20 active:scale-95"
                    >
                        {user ? 'Assinar Agora' : 'Começar Teste Grátis de 7 Dias'}
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-4">Compra segura via Stripe.</p>
                </div>
            </div>
        </div>
    );
};
