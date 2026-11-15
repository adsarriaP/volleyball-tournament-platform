import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CircleDot as Volleyball,
  ClipboardCheck,
  LogIn,
  LogOut,
  Menu,
  ShieldAlert,
  Trophy,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ADMIN_NAV_ITEMS } from '../../modules/tournaments/components/AdminSidebarLayout';

const ROLE_META: Record<string, { label: string; badgeClass: string }> = {
  ADMIN: {
    label: 'Admin',
    badgeClass: 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30',
  },
  REFEREE: {
    label: 'Juez',
    badgeClass: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  },
  TEAM_REP: {
    label: 'Delegado',
    badgeClass: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
  },
};

function getInitials(name?: string): string {
  if (!name) return 'VS';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'VS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export const AppNavbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logout();
    navigate('/tournaments');
  };

  const navItems = [
    {
      to: '/tournaments',
      label: 'Torneos',
      description: 'Posiciones y partidos en vivo',
      icon: Trophy,
      activePrefix: '/tournaments',
    },
    ...(user?.role === 'REFEREE' || user?.role === 'ADMIN'
      ? [
          {
            to: '/referee/matches',
            label: 'Planilla Juez',
            description: 'Consola de arbitraje en vivo',
            icon: ClipboardCheck,
            activePrefix: '/referee',
          },
        ]
      : []),
    ...(user?.role === 'ADMIN'
      ? [
          {
            to: '/admin',
            label: 'Panel Admin',
            description: 'Centro de control general',
            icon: ShieldAlert,
            activePrefix: '/admin',
          },
        ]
      : []),
  ];

  const isAdminActivePath = (to: string, exact: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const roleMeta = user
    ? (ROLE_META[user.role] ?? {
        label: user.role,
        badgeClass: 'bg-zinc-800 text-zinc-200 border-zinc-700',
      })
    : null;
  const initials = getInitials(user?.name);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-3">
        {/* Marca */}
        <Link
          to="/tournaments"
          className="flex items-center gap-2.5 group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center text-zinc-950 shadow-lg shadow-yellow-400/20 group-hover:scale-105 transition-transform">
            <Volleyball className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="leading-none">
            <span className="font-black text-lg tracking-tight text-white">
              VOLEI<span className="text-yellow-400">SCORE</span>
            </span>
            <span className="hidden sm:block text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mt-0.5">
              Live Center & Planillero Oficial
            </span>
          </div>
        </Link>

        {/* Navegación Desktop */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-1 bg-zinc-900/90 border border-zinc-800/90 p-1 rounded-2xl"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.activePrefix);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                  active
                    ? 'bg-yellow-400 text-zinc-950 shadow-sm'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Acciones Desktop */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {user && roleMeta ? (
            <>
              <div className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <div className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-[11px] font-black text-yellow-400 shrink-0">
                  {initials}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-bold text-white max-w-[140px] truncate">
                    {user.name}
                  </span>
                  <span
                    className={`inline-flex w-fit items-center px-1.5 py-0.5 mt-0.5 rounded-md border text-[9px] uppercase tracking-wider font-extrabold ${roleMeta.badgeClass}`}
                  >
                    {roleMeta.label}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-red-500/15 text-zinc-300 hover:text-red-300 border border-zinc-800 hover:border-red-500/30 transition whitespace-nowrap"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Salir</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black bg-yellow-400 hover:bg-yellow-300 text-zinc-950 shadow-sm shadow-yellow-400/20 transition whitespace-nowrap"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span>Acceso Juez / Admin</span>
            </Link>
          )}
        </div>

        {/* Acciones Móvil */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          {user && roleMeta ? (
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-200 whitespace-nowrap"
              aria-label="Abrir perfil y menú"
            >
              <span className="w-5 h-5 rounded-lg bg-zinc-800 text-yellow-400 font-black text-[10px] flex items-center justify-center">
                {initials}
              </span>
              <span className="text-[11px] font-extrabold text-zinc-200">
                {roleMeta.label}
              </span>
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-zinc-950 transition whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>Ingresar</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 flex items-center justify-center transition"
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Menú Unificado Móvil */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 top-16 z-40 bg-black/75 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full inset-x-0 z-50 border-b border-zinc-800 bg-zinc-950 shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              {user && roleMeta && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-black text-yellow-400 shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">
                        Sesión activa
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-lg border text-[11px] uppercase tracking-wider font-extrabold ${roleMeta.badgeClass}`}
                  >
                    {roleMeta.label}
                  </span>
                </div>
              )}

              {/* Sección Principal */}
              <div className="space-y-1.5">
                <p className="px-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Navegación
                </p>
                <nav aria-label="Menú móvil principal" className="space-y-1.5">
                  {navItems
                    .filter((item) =>
                      user?.role === 'ADMIN' ? item.to !== '/admin' : true,
                    )
                    .map((item) => {
                      const Icon = item.icon;
                      const active = location.pathname.startsWith(
                        item.activePrefix,
                      );
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`w-full min-h-[50px] px-3.5 py-2.5 rounded-2xl flex items-center gap-3 border transition ${
                            active
                              ? 'bg-yellow-400 text-zinc-950 border-yellow-300 shadow-sm'
                              : 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              active
                                ? 'bg-zinc-950/15 text-zinc-950'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-extrabold leading-tight">
                              {item.label}
                            </p>
                            <p
                              className={`text-xs truncate mt-0.5 ${
                                active
                                  ? 'text-zinc-900/80 font-medium'
                                  : 'text-zinc-400'
                              }`}
                            >
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                </nav>
              </div>

              {/* Sección Unificada de Módulos Admin (solo ADMIN) */}
              {user?.role === 'ADMIN' && (
                <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
                  <div className="px-1 pt-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-yellow-400">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Panel de Administración</span>
                  </div>
                  <nav aria-label="Módulos Admin" className="space-y-1.5">
                    {ADMIN_NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active = isAdminActivePath(item.to, item.exact);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`w-full min-h-[48px] px-3.5 py-2 rounded-2xl flex items-center gap-3 border transition ${
                            active
                              ? 'bg-yellow-400 text-zinc-950 border-yellow-300 shadow-sm'
                              : 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              active
                                ? 'bg-zinc-950/15 text-zinc-950'
                                : 'bg-zinc-800 text-yellow-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black leading-tight">
                              {item.label}
                            </p>
                            <p
                              className={`text-[11px] truncate mt-0.5 ${
                                active
                                  ? 'text-zinc-900/80 font-semibold'
                                  : 'text-zinc-400'
                              }`}
                            >
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              )}

              <div className="pt-1">
                {user ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-bold text-sm transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar sesión</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black text-sm transition"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Acceso Juez / Admin</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
