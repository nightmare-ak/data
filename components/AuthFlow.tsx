
import React, { useState } from 'react';
import { Mail, User, Lock, ShieldCheck, ShieldAlert, LogIn, UserPlus, Chrome } from 'lucide-react';
import { authService } from '../services/authService';
import { UserProfile } from '../types';

interface Props {
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthFlow: React.FC<Props> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const user = await authService.signIn(email, password);
        onLoginSuccess(user);
      } else {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        if (!name) throw new Error("Display name is required.");

        const user = await authService.signUp(email, password, name);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const user = await authService.loginWithGoogle();
      onLoginSuccess(user);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Aesthetic */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-600/10 blur-[180px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[180px] rounded-full" />

      <div className="max-w-md w-full glass-card p-10 rounded-[3.5rem] space-y-8 animate-in fade-in zoom-in-95 duration-1000 relative z-10 border-white/5">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-600 to-red-500 rounded-2xl shadow-2xl shadow-red-900/40 flex items-center justify-center mb-6 relative group">
            <div className="absolute inset-0 bg-red-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <ShieldCheck className="text-white w-10 h-10 relative z-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">GUARD<span className="text-red-500">IAN</span></h1>
          <p className="text-slate-400 text-xs font-medium">Verified Community Emergency Network</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isLogin ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <LogIn className="w-4 h-4" /> Log In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!isLogin ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <UserPlus className="w-4 h-4" /> Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="group relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
              <input
                type="text"
                placeholder="Full Name"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-white outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/30 transition-all text-sm font-medium"
              />
            </div>
          )}

          <div className="group relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-white outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/30 transition-all text-sm font-medium"
            />
          </div>

          <div className="group relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-white outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/30 transition-all text-sm font-medium"
            />
          </div>

          {!isLogin && (
            <div className="group relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
              <input
                type="password"
                placeholder="Confirm Password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-white outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/30 transition-all text-sm font-medium"
              />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 animate-bounce">
              <ShieldAlert className="w-4 h-4" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Authenticate Node' : 'Initialize Account'}
          </button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-slate-950 px-4 text-slate-600">Secure SSO</span></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-xs bouncy"
        >
          <Chrome className="w-4 h-4 text-blue-400" /> Continue with Google Identity
        </button>

        <div className="text-center">
          <p className="text-[9px] text-slate-600 font-bold tracking-widest uppercase leading-relaxed max-w-[280px] mx-auto">
            Authorized access only. All credentials are encrypted.
          </p>
        </div>
      </div>
    </div>
  );
};
