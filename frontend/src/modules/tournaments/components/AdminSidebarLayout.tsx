import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';

interface AdminSidebarLayoutProps {
  children: React.ReactNode;
}

export const ADMIN_NAV_ITEMS = [
  {
    to: '/admin',
    label: 'Dashboard Principal',
    description: 'Resumen, cruces y programación',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: '/admin/tournaments',
    label: 'Torneos y Configuración',
    description: 'Crear, editar y eliminar',
    icon: Trophy,
    exact: false,
  },
  {
    to: '/admin/teams',
    label: 'Equipos',
    description: 'Inscribir, editar y eliminar',
    icon: Users,
    exact: false,
  },
  {
    to: '/admin/referees',
    label: 'Jueces',
    description: 'Crear, editar y eliminar',
    icon: UserPlus,
    exact: false,
  },
  {
    to: '/admin/help',
    label: 'Guía / Ayuda',
    description: 'Manual paso a paso',
    icon: BookOpen,
    exact: false,
  },
];

const SIDEBAR_STORAGE_KEY = 'admin_sidebar_collapsed';

export const AdminSidebarLayout: React.FC<AdminSidebarLayoutProps> = ({
  children,
}) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleDesktopCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Ignorar si localStorage no está disponible
      }
      return next;
    });
  };

  const isActivePath = (to: string, exact: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const renderNavLinks = (collapsed: boolean) => (
    <nav className="space-y-1.5">
      {ADMIN_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(item.to, item.exact);
        return (
          <Link
            key={item.to}
            to={item.to}
            title={collapsed ? `${item.label} — ${item.description}` : undefined}
            className={`flex items-center rounded-2xl transition ${
              collapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-3'
            } ${
              active
                ? 'bg-yellow-400 text-zinc-950 shadow-lg shadow-yellow-400/20'
                : 'text-zinc-300 hover:bg-zinc-900 hover:text-white border border-transparent hover:border-zinc-800'
            }`}
          >
            <Icon
              className={`w-5 h-5 shrink-0 ${
                active ? 'text-zinc-950' : 'text-yellow-400'
              }`}
            />
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-xs font-black truncate">{item.label}</div>
                <div
                  className={`text-[10px] truncate ${
                    active ? 'text-zinc-800 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  {item.description}
                </div>
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-950">
      {/* Menú lateral fijo y colapsable en escritorio */}
      <aside
        className={`hidden md:flex md:flex-col md:shrink-0 border-r border-zinc-800 bg-zinc-950/90 p-3 space-y-4 transition-all duration-300 ${
          isCollapsed ? 'md:w-20' : 'md:w-64 p-4'
        }`}
      >
        <div
          className={`flex items-center pb-3 border-b border-zinc-800 ${
            isCollapsed ? 'justify-center' : 'justify-between gap-2 px-1'
          }`}
        >
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-yellow-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="truncate">Módulos Admin</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 truncate">
                Gestión centralizada
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={toggleDesktopCollapse}
            title={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-yellow-400 transition shrink-0"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {renderNavLinks(isCollapsed)}
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
};
