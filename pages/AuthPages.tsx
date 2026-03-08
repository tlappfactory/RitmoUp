import React, { useState } from 'react';
import { Browser } from '@capacitor/browser';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { UserRole } from '../types';
import { Button, Input } from '../components/UIComponents';
import { BackButton } from '../components/BackButton';
import { useToast } from '../ToastContext';
import { paymentService } from '../services/paymentService';

export const Login = () => {
  const navigate = useNavigate();
  const { login, resetPassword, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // Flow continues via redirect, no need to navigate manually
    } catch (error: any) {
      console.error('Google Login Error:', error);
      let errorMessage = 'Erro ao realizar login com Google.';
      if (error.code) {
        errorMessage += ` (Erro: ${error.code})`;
      } else if (error.message) {
        errorMessage += ` (${error.message})`;
      }
      showToast(errorMessage, 'error');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Login realizado com sucesso!', 'success');
      navigate('/student/dashboard');
    } catch (error: any) {
      console.error(error);
      showToast('Erro ao realizar login. Verifique suas credenciais.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await resetPassword(email);
      showToast('E-mail de recuperação enviado! Verifique sua caixa de entrada.', 'success');
      setIsResettingPassword(false);
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Erro ao enviar e-mail. Tente novamente.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'E-mail não encontrado.';
      }
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[#0f172a] text-[#f1f5f9]">


      <div className="w-full max-w-sm flex flex-col gap-8 p-6 rounded-2xl bg-[#1e293b]/50 backdrop-blur-xl border border-white/5 shadow-xl">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <img src="/favicon.png" alt="Logo" className="w-16 h-16 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-white">{isResettingPassword ? 'Recuperar Senha' : 'RitmoUp'}</h1>
          <p className="text-gray-400">{isResettingPassword ? 'Digite seu e-mail para continuar' : 'Seu Treino, Seu Ritmo.'}</p>
        </div>

        {isResettingPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-500">mail</span>
              </div>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required
                className="w-full bg-[#1e293b]/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] outline-none transition-all"
              />
            </div>

            <div className="pt-4 space-y-3">
              <button type="submit" disabled={isLoading} className="w-full bg-[#00ff88] text-[#0f172a] font-bold rounded-xl py-3 hover:bg-[#00cc6a] transition-all shadow-lg hover:shadow-[#00ff88]/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Enviando...' : 'Enviar Link'}
              </button>
              <button
                type="button"
                onClick={() => setIsResettingPassword(false)}
                className="w-full bg-transparent text-white font-bold rounded-xl py-3 hover:bg-white/5 transition-all"
              >
                Voltar
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Custom Dark Input Styles */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-500">mail</span>
              </div>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required
                className="w-full bg-[#1e293b]/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] outline-none transition-all"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-500">lock</span>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                required
                className="w-full bg-[#1e293b]/50 border border-white/10 rounded-xl py-3 pl-12 pr-10 text-white placeholder-gray-500 focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"
              >
                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={() => setIsResettingPassword(true)} className="text-sm text-[#00ff88] hover:underline">Esqueceu a senha?</button>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={isLoading} className="w-full bg-[#00ff88] text-[#0f172a] font-bold rounded-xl py-3 hover:bg-[#00cc6a] transition-all shadow-lg hover:shadow-[#00ff88]/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>

            <div className="relative flex items-center justify-center my-4">
              <div className="absolute w-full border-t border-gray-600"></div>
              <span className="relative px-2 bg-[#1e293b]/50 text-gray-400 text-sm">ou</span>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white text-gray-900 font-bold rounded-xl py-3 hover:bg-gray-100 transition-all shadow-lg hover:shadow-white/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Entrar com Google
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-2">
          Não tem uma conta? <button className="text-[#00ff88] font-bold hover:underline" onClick={() => navigate('/welcome')}>Cadastre-se</button>
        </p>
      </div>
    </div>
  );
};

export const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col p-6 bg-[#0f172a] text-white">
      <div className="flex-1 flex flex-col items-center text-center justify-center max-w-md mx-auto w-full space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <img src="/favicon.png" alt="Logo" className="w-20 h-20" />
          </div>
          <h1 className="text-4xl font-bold">Bem-vindo ao RitmoUp</h1>
          <p className="text-gray-500 text-lg">
            A plataforma completa que conecta Personal Trainers e Alunos para resultados incríveis.
          </p>
        </div>

        <div className="w-full space-y-4">
          <div className="p-4 rounded-2xl bg-[#1e293b] border border-white/5 shadow-sm flex items-start gap-4 text-left">
            <div className="p-2 rounded-xl bg-blue-900/30 text-blue-400">
              <span className="material-symbols-outlined">fitness_center</span>
            </div>
            <div>
              <h3 className="font-bold text-white">Treinos Personalizados</h3>
              <p className="text-sm text-gray-400">Receba ou crie treinos adaptados aos seus objetivos.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1e293b] border border-white/5 shadow-sm flex items-start gap-4 text-left">
            <div className="p-2 rounded-xl bg-purple-900/30 text-purple-400">
              <span className="material-symbols-outlined">monitoring</span>
            </div>
            <div>
              <h3 className="font-bold text-white">Acompanhe seu Progresso</h3>
              <p className="text-sm text-gray-400">Visualize sua evolução com gráficos detalhados.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1e293b] border border-white/5 shadow-sm flex items-start gap-4 text-left">
            <div className="p-2 rounded-xl bg-orange-900/30 text-orange-400">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div>
              <h3 className="font-bold text-white">Gestão Facilitada</h3>
              <p className="text-sm text-gray-400">Organize alunos, agenda e financeiro em um só lugar.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto pt-8">
        <button onClick={() => navigate('/register')} className="w-full bg-[#00ff88] text-[#0f172a] font-bold rounded-xl py-3 hover:bg-[#00cc6a] transition-all shadow-lg hover:shadow-[#00ff88]/20 active:scale-95">
          Começar Agora
        </button>
        <p className="text-center text-sm text-gray-500 mt-4">
          Já tem uma conta? <button className="text-[#00ff88] font-bold hover:underline" onClick={() => navigate('/')}>Entrar</button>
        </p>
      </div>
    </div>
  );
};




export const RegisterSelection = () => {
  const navigate = useNavigate();
  const { firebaseUser, user, completeGoogleLogin } = useAuth();
  const { showToast } = useToast();

  // Auto-handle returned Google users who pre-selected a role
  React.useEffect(() => {
    const intendedRole = sessionStorage.getItem('intendedRole') as UserRole;

    // If we have a firebase user (auth success), no profile yet (!user), and a stored intent
    if (firebaseUser && !user && intendedRole) {
      // Clear intent to prevent loops
      sessionStorage.removeItem('intendedRole');

      // Execute the selection logic automatically
      handleSelectRole(intendedRole);
    }
  }, [firebaseUser, user]);

  // Safety redirect: If user already has a profile (is fully logged in), move them away from here
  React.useEffect(() => {
    if (user) {
      if (user.role === UserRole.TRAINER) {
        navigate('/trainer/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSelectRole = async (role: UserRole) => {
    // Check if it's a Google Auth completion flow
    if (firebaseUser && !user) {
      try {
        await completeGoogleLogin(role);

        if (role === UserRole.TRAINER) {
          showToast('Redirecionando para pagamento...', 'info');
          try {
            // Open Stripe Payment Link
            await Browser.open({ url: 'https://buy.stripe.com/5kQ5kEblQ2az2QU0R800000' });

            // Listen for browser close to navigate to dashboard
            Browser.addListener('browserFinished', () => {
              navigate('/trainer/dashboard');
            });
          } catch (error) {
            console.error(error);
            showToast('Erro ao abrir pagamento', 'error');
            // Fallback navigation in case browser fails or user cancels but we want them in
            navigate('/trainer/dashboard');
          }
        } else {
          // Explicitly navigate for students
          navigate('/student/dashboard');
        }
      } catch (error) {
        console.error("Error completing profile:", error);
      }
    } else {
      // Normal registration flow
      navigate('/register/form', { state: { role } });
    }
  };

  return (
    // ... (rest of the component)
    <div className="min-h-screen flex flex-col p-6 items-center justify-center relative bg-black selection:bg-[#00ff88] selection:text-black">
      <div className="absolute top-4 left-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <div className="w-full max-w-5xl">
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Qual é o seu objetivo?</h1>
          <p className="text-xl text-gray-400">Escolha como você vai usar o RitmoUp.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
          {/* Student Card */}
          <button
            onClick={() => handleSelectRole(UserRole.STUDENT)}
            className="group relative h-[400px] rounded-[2rem] overflow-hidden border border-white/5 transition-all duration-500 hover:shadow-[0_0_50px_rgba(0,255,136,0.3)] hover:scale-[1.02] text-left"
          >
            {/* Background Image */}
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: "url('/student_hero_card_v3.png')" }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500"></div>

            {/* Content */}
            <div className="absolute inset-0 p-8 flex flex-col justify-end">


              <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-[#00ff88] transition-colors">Sou Aluno</h3>
              <p className="text-gray-300 text-lg group-hover:text-white transition-colors">Quero treinos personalizados, acompanhar minha evolução e atingir metas.</p>

              {/* Arrow Indicator */}
              <div className="absolute top-8 right-8 size-12 rounded-full border border-white/20 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                <span className="material-symbols-outlined text-white">arrow_forward</span>
              </div>
            </div>
          </button>

          {/* Trainer Card */}
          <button
            onClick={() => handleSelectRole(UserRole.TRAINER)}
            className="group relative h-[400px] rounded-[2rem] overflow-hidden border border-white/5 transition-all duration-500 hover:shadow-[0_0_50px_rgba(59,130,246,0.3)] hover:scale-[1.02] text-left"
          >
            {/* Background Image */}
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2940&auto=format&fit=crop')" }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500"></div>

            {/* Content */}
            <div className="absolute inset-0 p-8 flex flex-col justify-end">


              <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Sou Personal Trainer</h3>
              <p className="text-gray-300 text-lg group-hover:text-white transition-colors">Quero gerenciar alunos, prescrever treinos com IA e escalar minha consultoria.</p>

              {/* Arrow Indicator */}
              <div className="absolute top-8 right-8 size-12 rounded-full border border-white/20 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                <span className="material-symbols-outlined text-white">arrow_forward</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export const RegisterForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const role = location.state?.role || UserRole.STUDENT;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password Validation State
  const [validations, setValidations] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false
  });

  React.useEffect(() => {
    setValidations({
      minLength: password.length >= 6,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  }, [password]);

  const isPasswordValid = Object.values(validations).every(Boolean);

  const handleGoogleLogin = async () => {
    try {
      // Persist the selected role before redirecting
      sessionStorage.setItem('intendedRole', role);

      await loginWithGoogle();
      // Flow continues via redirect
    } catch (error: any) {
      console.error('Google Register Error:', error);
      let errorMessage = 'Erro ao realizar cadastro com Google.';
      if (error.code) {
        errorMessage += ` (Erro: ${error.code})`;
      } else if (error.message) {
        errorMessage += ` (${error.message})`;
      }
      showToast(errorMessage, 'error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      showToast('A senha não atende aos requisitos mínimos.', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, name, role);
      showToast('Conta criada com sucesso!', 'success');

      if (role === UserRole.TRAINER) {
        showToast('Redirecionando para pagamento...', 'info');
        try {
          // Open Stripe Payment Link
          await Browser.open({ url: 'https://buy.stripe.com/5kQ5kEblQ2az2QU0R800000' });

          // Listen for browser close to navigate to dashboard
          Browser.addListener('browserFinished', () => {
            navigate('/trainer/dashboard');
          });
        } catch (error) {
          console.error(error);
          showToast('Erro ao abrir pagamento', 'error');
          // Fallback navigation
          navigate('/trainer/dashboard');
        }
      } else {
        navigate('/student/dashboard');
      }
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Erro ao criar conta. Tente novamente.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail já está em uso.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'E-mail inválido.';
      }

      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col p-6 items-center justify-center relative bg-[#0f172a] text-[#f1f5f9]">
      <div className="absolute top-4 left-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <div className="max-w-md mx-auto w-full p-6 rounded-2xl bg-[#1e293b]/50 backdrop-blur-xl border border-white/5 shadow-xl">
        <h1 className="text-3xl font-bold mb-2 text-white">Crie sua conta</h1>
        <p className="text-gray-400 mb-8">
          {role === UserRole.TRAINER ? 'Comece a gerenciar seus alunos.' : 'Comece sua jornada fitness.'}
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-500">person</span>
            </div>
            <input
              type="text"
              placeholder="Nome Completo"
              value={name}
              onChange={(e: any) => setName(e.target.value)}
              required
              className="w-full bg-[#1e293b]/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] outline-none transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-500">mail</span>
            </div>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
              className="w-full bg-[#1e293b]/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] outline-none transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-500">lock</span>
            </div>
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              required
              className="w-full bg-[#1e293b]/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] outline-none transition-all"
            />
          </div>

          {/* Password Validation Checklist */}
          {password.length > 0 && (
            <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-1">
              <p className="text-xs text-gray-400 mb-2 font-bold uppercase">Requisitos da senha:</p>
              <ValidationItem isValid={validations.minLength} text="Mínimo 6 caracteres" />
              <ValidationItem isValid={validations.hasUpper} text="Letra maiúscula (A-Z)" />
              <ValidationItem isValid={validations.hasLower} text="Letra minúscula (a-z)" />
              <ValidationItem isValid={validations.hasNumber} text="Número (0-9)" />
              <ValidationItem isValid={validations.hasSpecial} text="Caractere especial (!@#...)" />
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || (password.length > 0 && !isPasswordValid)}
              className="w-full bg-[#00ff88] text-[#0f172a] font-bold rounded-xl py-3 hover:bg-[#00cc6a] transition-all shadow-lg hover:shadow-[#00ff88]/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </div>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute w-full border-t border-gray-600"></div>
            <span className="relative px-2 bg-[#1e293b]/50 text-gray-400 text-sm">ou</span>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white text-gray-900 font-bold rounded-xl py-3 hover:bg-gray-100 transition-all shadow-lg hover:shadow-white/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Entrar com Google
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
  <div className={`flex items-center gap-2 text-xs transition-colors ${isValid ? 'text-green-400' : 'text-gray-500'}`}>
    <span className="material-symbols-outlined text-[10px]">
      {isValid ? 'check_circle' : 'radio_button_unchecked'}
    </span>
    {text}
  </div>
);