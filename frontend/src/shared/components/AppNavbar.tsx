import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CircleDot as Volleyball,
  ClipboardCheck,
  LogIn,
  LogOut,
  ShieldAlert,
  Trophy,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const AppNavbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/tournaments');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/tournaments" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center text-zinc-950 shadow-lg shadow-yellow-400/20">
            <Volleyball className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-white">
              VOLEI<span className="text-yellow-400">SCORE</span>
            </span>
            <span className="hidden sm:block text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
              Live Center & Planillero Oficial
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 md:gap-3">
          <Link
            to="/tournaments"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold transition ${
              location.pathname.startsWith('/tournaments')
                ? 'bg-yellow-400 text-zinc-950 shadow-sm'
                : 'bg-zinc-900 text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Torneos</span>
          </Link>

          {(user?.role === 'REFEREE' || user?.role === 'ADMIN') && (
            <Link
              to="/referee/matches"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold transition ${
                location.pathname.startsWith('/referee')
                  ? 'bg-yellow-400 text-zinc-950 shadow-sm'
                  : 'bg-zinc-900 text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Planilla Juez</span>
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold transition ${
                location.pathname.startsWith('/admin')
                  ? 'bg-yellow-400 text-zinc-950 shadow-sm'
                  : 'bg-zinc-900 text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Panel Admin</span>
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-white">
                  {user.name}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-yellow-400 font-bold">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-black bg-yellow-400 hover:bg-yellow-300 text-zinc-950 transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Acceso Juez / Admin</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
