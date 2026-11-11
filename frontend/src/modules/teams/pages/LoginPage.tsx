import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, Sparkles } from 'lucide-react';
import { apiFetch } from '../../../shared/api/httpClient';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { AuthUser } from '../../../shared/types/volleyball.types';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@voleibol.com');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ accessToken: string; user: AuthUser }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
      );
      setSession(res.accessToken, res.user);
      if (res.user.role === 'ADMIN') {
        navigate('/admin');
      } else if (res.user.role === 'REFEREE') {
        navigate('/referee/matches');
      } else {
        navigate('/tournaments');
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 overflow-hidden">
      {/* Fondos degradados estilo Spotify */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-yellow-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/85 backdrop-blur-2xl p-6 md:p-8 shadow-2xl space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-14 h-14 rounded-2xl bg-yellow-400 text-zinc-950 flex items-center justify-center mx-auto shadow-lg shadow-yellow-400/25">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            VoleiScore Login
          </h1>
          <p className="text-xs text-zinc-400">
            Acceso exclusivo para Jueces/Planilleros y Administradores del
            torneo.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1 uppercase tracking-wider">
              Correo / Usuario
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950/90 border border-zinc-800 text-sm text-white focus:border-yellow-400 outline-none transition"
              placeholder="admin@voleibol.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1 uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950/90 border border-zinc-800 text-sm text-white focus:border-yellow-400 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-black text-sm bg-yellow-400 hover:bg-yellow-300 text-zinc-950 transition shadow-lg shadow-yellow-400/25 active:scale-[0.99]"
          >
            {loading ? 'Verificando credenciales...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-400 space-y-1.5">
          <div className="flex items-center gap-1.5 font-black text-yellow-400">
            <ShieldCheck className="w-4 h-4" />
            Acceso Rápido Administrador:
          </div>
          <div className="text-[11px] text-zinc-300">
            Usuario: <strong className="text-white">admin@voleibol.com</strong>{' '}
            | Clave: <strong className="text-white">admin123</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
