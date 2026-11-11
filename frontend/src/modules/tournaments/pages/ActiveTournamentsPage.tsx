import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  ChevronRight,
  CircleDot as Volleyball,
  Radio,
  ShieldAlert,
  Trophy,
  Users,
} from 'lucide-react';
import { apiFetch, resolveTeamLogoUrl } from '../../../shared/api/httpClient';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import {
  MatchSummary,
  Team,
  TournamentRules,
} from '../../../shared/types/volleyball.types';

interface TournamentListItem extends TournamentRules {
  teams: Team[];
  matches: MatchSummary[];
}

export const ActiveTournamentsPage: React.FC = () => {
  const { user } = useAuthStore();

  const { data: tournaments, isLoading } = useQuery<TournamentListItem[]>({
    queryKey: ['tournaments-list'],
    queryFn: () => apiFetch<TournamentListItem[]>('/tournaments'),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Banner Deportivo con Ilustración de Remate de Voleibol */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 md:p-10 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Glow decorativo de fondo */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-4 max-w-xl z-10 text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-yellow-400 text-zinc-950 uppercase tracking-wider shadow-md">
            <Volleyball className="w-3.5 h-3.5" />
            VoleiScore Live Center
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Gestión y Seguimiento de Torneos{' '}
            <span className="text-yellow-400">en Tiempo Real</span>
          </h1>
          <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
            Sigue cada partido punto a punto con rotaciones reglamentarias 1 a 6,
            estadísticas en vivo, programación automática de 8:00 AM a 6:00 PM
            y ubicación de canchas en Google Maps.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
            {user?.role === 'ADMIN' ? (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-black bg-yellow-400 hover:bg-yellow-300 text-zinc-950 transition shadow-lg shadow-yellow-400/25"
              >
                <ShieldAlert className="w-4 h-4" />
                Panel de Control de Torneo
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-black bg-yellow-400 hover:bg-yellow-300 text-zinc-950 transition shadow-lg shadow-yellow-400/25"
              >
                Acceso Jueces / Planilleros
              </Link>
            )}
          </div>
        </div>

        {/* Ilustración de Voleibol en Vivo */}
        <div className="w-full max-w-md lg:max-w-lg shrink-0 z-10 flex justify-center">
          <img
            src="/assets/volleyball-hero.svg"
            alt="Voleibol Remate en Vivo"
            className="w-full h-auto max-h-72 object-contain drop-shadow-[0_15px_35px_rgba(250,204,21,0.25)] rounded-2xl"
          />
        </div>
      </div>

      {isLoading && (
        <div className="p-10 rounded-3xl border border-zinc-800 bg-zinc-900 text-center text-zinc-400">
          Cargando torneos activos...
        </div>
      )}

      {!isLoading && tournaments && tournaments.length === 0 && (
        <div className="p-12 rounded-3xl border border-zinc-800 bg-zinc-900 text-center space-y-3">
          <Trophy className="w-10 h-10 text-yellow-400 mx-auto" />
          <h2 className="text-lg font-extrabold text-white">
            Aún no hay torneos creados
          </h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Ingresa como Administrador (<code className="text-white">admin@voleibol.com</code> /{' '}
            <code className="text-white">admin123</code>) para configurar tu
            torneo de 20 equipos, registrar delegados y escudos, y generar los
            horarios automáticos.
          </p>
        </div>
      )}

      {/* Tarjetas de Torneos Activos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {tournaments?.map((t) => {
          const liveCount = t.matches.filter(
            (m) => m.status === 'IN_PROGRESS',
          ).length;
          const scheduledCount = t.matches.filter(
            (m) => m.status === 'SCHEDULED',
          ).length;
          const finishedCount = t.matches.filter(
            (m) => m.status === 'FINISHED',
          ).length;

          return (
            <Link
              key={t.id}
              to={`/tournaments/${t.id}`}
              className="group rounded-3xl border border-zinc-800 bg-zinc-900 hover:border-yellow-400 p-6 flex flex-col justify-between gap-5 transition shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-950 text-yellow-400 border border-zinc-800">
                    {t.formatType === 'LEAGUE_ONLY'
                      ? 'Liga Regular'
                      : t.formatType === 'KNOCKOUT_ONLY'
                        ? 'Eliminación Directa'
                        : `${t.groupsCount ?? 2} Grupos → Clasifican ${t.qualifiersPerGroup}/Grupo`}
                  </span>
                  {liveCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-yellow-400 text-zinc-950 animate-pulse">
                      <Radio className="w-3.5 h-3.5" />
                      {liveCount} EN VIVO
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300">
                      Cupo: {t.teams.length} / {t.maxTeams ?? 20} Equipos
                    </span>
                  )}
                </div>

                <h2 className="text-xl md:text-2xl font-black text-white group-hover:text-yellow-400 transition">
                  {t.name}
                </h2>

                <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
                  <span className="inline-flex items-center gap-1 text-zinc-200 font-semibold">
                    <Users className="w-3.5 h-3.5 text-yellow-400" />
                    {t.teams.length}/{t.maxTeams ?? 20} Equipos ({t.groupsCount ?? 2} grupos)
                  </span>
                  <span>• Mejor de {t.maxSets} sets</span>
                  {t.startDate && (
                    <span className="inline-flex items-center gap-1 text-zinc-300">
                      <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                      {new Date(t.startDate).toLocaleDateString()} —{' '}
                      {t.endDate
                        ? new Date(t.endDate).toLocaleDateString()
                        : 'En curso'}{' '}
                      (08:00 - 18:00)
                    </span>
                  )}
                </div>

                {t.teams.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1 overflow-hidden">
                    {t.teams.slice(0, 8).map((team) => {
                      const logo = resolveTeamLogoUrl(team.logoUrl);
                      return (
                        <div
                          key={team.id}
                          title={team.name}
                          className="w-7 h-7 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center overflow-hidden text-[10px] font-black text-yellow-400 shrink-0"
                        >
                          {logo ? (
                            <img
                              src={logo}
                              alt={team.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            team.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                      );
                    })}
                    {t.teams.length > 8 && (
                      <span className="text-[11px] font-bold text-zinc-400 pl-1">
                        +{t.teams.length - 8} más
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex gap-4 text-zinc-300">
                  <span>
                    En vivo: <strong className="text-yellow-400">{liveCount}</strong>
                  </span>
                  <span>
                    Próximos: <strong className="text-white">{scheduledCount}</strong>
                  </span>
                  <span>
                    Finalizados: <strong className="text-zinc-400">{finishedCount}</strong>
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 font-black text-yellow-400 group-hover:translate-x-1 transition">
                  Abrir Vista SofaScore
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
