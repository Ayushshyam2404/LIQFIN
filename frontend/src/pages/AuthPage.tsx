import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Key, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required')
});

const registerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [useBiometrics, setUseBiometrics] = useState(false);
  const [biometricEmail, setBiometricEmail] = useState('');
  
  const { login, register: signUp, loginWithPasskey, error, clearError, isLoading } = useAuthStore();

  React.useEffect(() => {
    const defaultToPasskey = localStorage.getItem('liquid_default_to_passkey') === 'true';
    const savedEmail = localStorage.getItem('liquid_saved_email') || '';
    if (defaultToPasskey && savedEmail) {
      setUseBiometrics(true);
      setBiometricEmail(savedEmail);
    }
  }, []);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' }
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', password: '' }
  });

  const handleToggle = () => {
    clearError();
    setIsLogin(!isLogin);
    setUseBiometrics(false);
  };

  const onLoginSubmit = async (values: LoginFormValues) => {
    await login(values);
  };

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    await signUp(values);
  };

  const handlePasskeyLogin = async () => {
    if (!biometricEmail) {
      alert('Please enter your email to search passkeys.');
      return;
    }
    const success = await loginWithPasskey(biometricEmail);
    if (!success) {
      alert('Biometric verification failed. Please use standard password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative selection:bg-brand-secondary-fixed">
      {/* Abstract background grid */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      <div className="w-full max-w-md space-y-6 z-10">
        
        {/* Logo Section */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 bg-brand-primary border-4 border-brand-on-surface flex items-center justify-center shadow-[4px_4px_0px_0px_var(--border-color)] mx-auto sticker-rotate-left">
            <span className="font-extrabold text-white text-2xl tracking-tighter">L</span>
          </div>
          <div>
            <h1 className="font-black text-brand-on-surface text-3xl tracking-tight leading-none">LIQIFIN</h1>
            <p className="font-mono text-[9px] text-brand-outline font-black uppercase tracking-widest pt-1">PERSONAL_FINANCE_OS</p>
          </div>
        </div>

        {/* Credentials Form Box */}
        <div className="bg-brand-surface-lowest border-4 border-brand-on-surface p-6 shadow-[8px_8px_0px_0px_var(--border-color)] relative overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-2 border-brand-on-surface p-1 bg-brand-surface-lowest mb-6">
            <button
              onClick={() => { setIsLogin(true); setUseBiometrics(false); }}
              className={`flex-1 py-1.5 rounded-none text-[10px] font-black uppercase transition-all duration-200 cursor-pointer ${
                isLogin && !useBiometrics
                  ? 'bg-brand-secondary-fixed text-brand-on-surface border border-brand-on-surface shadow-[1px_1px_0px_0px_var(--border-color)]'
                  : 'text-brand-outline hover:text-brand-on-surface'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(true); setUseBiometrics(true); }}
              className={`flex-1 py-1.5 rounded-none text-[10px] font-black uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 ${
                isLogin && useBiometrics
                  ? 'bg-brand-secondary-fixed text-brand-on-surface border border-brand-on-surface shadow-[1px_1px_0px_0px_var(--border-color)]'
                  : 'text-brand-outline hover:text-brand-on-surface'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Passkey</span>
            </button>
            <button
              onClick={handleToggle}
              className={`flex-1 py-1.5 rounded-none text-[10px] font-black uppercase transition-all duration-200 cursor-pointer ${
                !isLogin
                  ? 'bg-brand-secondary-fixed text-brand-on-surface border border-brand-on-surface shadow-[1px_1px_0px_0px_var(--border-color)]'
                  : 'text-brand-outline hover:text-brand-on-surface'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-none bg-rose-100 border-2 border-brand-on-surface text-rose-700 text-[10px] font-bold text-center font-mono">
              {error.toUpperCase()}
            </div>
          )}

          {/* Login Form */}
          {isLogin && !useBiometrics && (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Account</span>
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  {...loginForm.register('email')}
                  className="w-full px-3 py-2.5 neo-input"
                />
                {loginForm.formState.errors.email && (
                  <span className="text-[9px] text-rose-500 block font-bold">{loginForm.formState.errors.email.message}</span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-mono font-bold text-brand-outline flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Password</span>
                  </label>
                  <a href="#" className="text-[9px] font-black uppercase text-brand-primary underline">Forgot?</a>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...loginForm.register('password')}
                  className="w-full px-3 py-2.5 neo-input"
                />
                {loginForm.formState.errors.password && (
                  <span className="text-[9px] text-rose-500 block font-bold">{loginForm.formState.errors.password.message}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 border-2 border-brand-on-surface bg-brand-primary text-white font-black uppercase shadow-[4px_4px_0px_0px_var(--border-color)] pressed-state text-xs tracking-wider cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </div>
                ) : 'Sign In'}
              </button>
            </form>
          )}

          {/* Passkey Login */}
          {isLogin && useBiometrics && (
            <div className="space-y-4 py-2 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Passkey Email Account</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter email to find passkey"
                  value={biometricEmail}
                  onChange={(e) => setBiometricEmail(e.target.value)}
                  className="w-full px-3 py-2.5 neo-input"
                />
              </div>

              <button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={isLoading}
                className="w-full py-3 border-2 border-brand-on-surface bg-brand-primary text-white font-black uppercase shadow-[4px_4px_0px_0px_var(--border-color)] pressed-state text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>VERIFYING PASSKEY...</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-brand-secondary-fixed" />
                    <span>Biometric FaceID Verify</span>
                  </>
                )}
              </button>

              <p className="text-[9px] text-brand-outline text-center leading-normal font-mono font-bold pt-2">
                VERIFICATION REQUIRES A REGISTERED BIOMETRIC CREDENTIAL INSIDE SETTINGS.
              </p>
            </div>
          )}

          {/* Registration Form */}
          {!isLogin && (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Julian Sterling"
                  {...registerForm.register('name')}
                  className="w-full px-3 py-2.5 neo-input"
                />
                {registerForm.formState.errors.name && (
                  <span className="text-[9px] text-rose-500 block font-bold">{registerForm.formState.errors.name.message}</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  {...registerForm.register('email')}
                  className="w-full px-3 py-2.5 neo-input"
                />
                {registerForm.formState.errors.email && (
                  <span className="text-[9px] text-rose-500 block font-bold">{registerForm.formState.errors.email.message}</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...registerForm.register('password')}
                  className="w-full px-3 py-2.5 neo-input"
                />
                {registerForm.formState.errors.password && (
                  <span className="text-[9px] text-rose-500 block font-bold">{registerForm.formState.errors.password.message}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 border-2 border-brand-on-surface bg-brand-primary text-white font-black uppercase shadow-[4px_4px_0px_0px_var(--border-color)] pressed-state text-xs tracking-wider cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>CREATING PROFILE...</span>
                  </div>
                ) : 'Register'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
