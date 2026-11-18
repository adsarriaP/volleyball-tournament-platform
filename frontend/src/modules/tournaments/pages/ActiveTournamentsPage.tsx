import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  CircleDot as Volleyball,
  Clock,
  ExternalLink,
  MapPin,
  Radio,
  ShieldAlert,
  Trophy,
  Users,
} from 'lucide-react';
import {
  apiFetch,
  normalizeExternalUrl,
  resolveTeamLogoUrl,
} from '../../../shared/api/httpClient';
import { CardGridSkeleton } from '../../../shared/components/LoadingUI';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import {
  MatchSummary,
  Team,
  TournamentRules,
} from '../../../shared/types/volleyball.types';
import { TournamentEntrySplash } from '../components/TournamentEntrySplash';

const ENTRY_SPLASH_KEY = 'voleiscore_entry_seen';

interface TournamentListItem extends TournamentRules {
  teams: Team[];
  matches: MatchSummary[];
}

export const ActiveTournamentsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [mainTab, setMainTab] = useState<'TOURNAMENTS' | 'FRIENDLIES'>(
    'TOURNAMENTS',
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'FINISHED'>(
    'ALL',
  );
  const [categoryFilter, setCategoryFilter] = useState<
    'ALL' | 'STANDARD' | 'MINI' | 'BENJAMIN'
  >('ALL');
  const [friendlyFilter, setFriendlyFilter] = useState<
    'ALL' | 'LIVE' | 'UPCOMING' | 'FINISHED'
  >('ALL');

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ENTRY_SPLASH_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const handleEnterApp = () => {
    try {
      sessionStorage.setItem(ENTRY_SPLASH_KEY, 'true');
    } catch {
      // Ignorar si sessionStorage no está disponible
    }
    setShowSplash(false);
  };

  const { data: tournaments, isLoading } = useQuery<TournamentListItem[]>({
    queryKey: ['tournaments-list'],
    queryFn: () => apiFetch<TournamentListItem[]>('/tournaments'),
  });

  const { data: friendlyMatches, isLoading: isLoadingFriendlies } = useQuery<
    MatchSummary[]
  >({
    queryKey: ['friendly-matches'],
    queryFn: () => apiFetch<MatchSummary[]>('/matches/friendlies'),
  });

  const officialTournaments = useMemo(() => {
    return (tournaments ?? []).filter(
      (t) =>
        !t.name.toLowerCase().includes('amistoso') &&
        !t.name.toLowerCase().includes('fogueo'),
    );
  }, [tournaments]);

  const filteredTournaments = useMemo(() => {
    if (!officialTournaments) return [];
    let list = officialTournaments;
    if (statusFilter === 'ACTIVE') {
      list = list.filter((t) => t.status !== 'FINISHED');
    } else if (statusFilter === 'FINISHED') {
      list = list.filter((t) => t.status === 'FINISHED');
    }
    if (categoryFilter !== 'ALL') {
      list = list.filter((t) => (t.category ?? 'STANDARD') === categoryFilter);
    }
    return list;
  }, [officialTournaments, statusFilter, categoryFilter]);

  const activeCount = useMemo(
    () => officialTournaments.filter((t) => t.status !== 'FINISHED').length,
    [officialTournaments],
  );
  const finishedTournamentsCount = useMemo(
    () => officialTournaments.filter((t) => t.status === 'FINISHED').length,
    [officialTournaments],
  );

  const filteredFriendlies = useMemo(() => {
    if (!friendlyMatches) return [];
    if (friendlyFilter === 'LIVE') {
      return friendlyMatches.filter((m) => m.status === 'IN_PROGRESS');
    }
    if (friendlyFilter === 'UPCOMING') {
      return friendlyMatches.filter((m) => m.status === 'SCHEDULED');
    }
    if (friendlyFilter === 'FINISHED') {
      return friendlyMatches.filter((m) => m.status === 'FINISHED');
    }
    return friendlyMatches;
  }, [friendlyMatches, friendlyFilter]);

  return (
    <>
      {showSplash && <TournamentEntrySplash onEnter={handleEnterApp} />}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Banner Deportivo de Torneos de Voleibol */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 md:p-10 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
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
              Sigue cada partido punto a punto con rotaciones reglamentarias 1 a
              6, estadísticas en vivo, programación de canchas y marcadores de
              amistosos y campeonatos oficiales.
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

          <div className="relative w-full lg:w-96 flex justify-center z-10">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-3xl overflow-hidden border border-zinc-700/80 shadow-2xl bg-zinc-900 group">
              <img
                src="/assets/tournament-banner.jpg"
                alt="Torneos de Voleibol en Vivo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent flex flex-col justify-end p-5">
                <span className="text-yellow-400 text-xs font-black uppercase tracking-wider">
                  Temporada Activa 2026
                </span>
                <span className="text-white text-base font-black">
                  Circuito Departamental & Fogueos
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas Principales: Torneos Oficiales vs Partidos Amistosos */}
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 pb-3">
          <button
            type="button"
            onClick={() => setMainTab('TOURNAMENTS')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs md:text-sm font-black transition ${
              mainTab === 'TOURNAMENTS'
                ? 'bg-yellow-400 text-zinc-950 shadow-md shadow-yellow-400/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Torneos Oficiales ({officialTournaments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('FRIENDLIES')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs md:text-sm font-black transition ${
              mainTab === 'FRIENDLIES'
                ? 'bg-yellow-400 text-zinc-950 shadow-md shadow-yellow-400/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Volleyball className="w-4 h-4" />
            <span>
              Partidos Amistosos / Fogueo ({friendlyMatches?.length ?? 0})
            </span>
          </button>
        </div>

        {/* SECCIÓN 1: TORNEOS OFICIALES */}
        {mainTab === 'TOURNAMENTS' && (
          <div className="space-y-6">
            {isLoading && (
              <CardGridSkeleton
                count={6}
                columnsClass="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                label="Cargando torneos activos..."
              />
            )}

            {!isLoading && officialTournaments.length === 0 && (
              <div className="p-12 rounded-3xl border border-zinc-800 bg-zinc-900 text-center space-y-3">
                <Trophy className="w-10 h-10 text-yellow-400 mx-auto" />
                <h2 className="text-lg font-extrabold text-white">
                  Aún no hay torneos oficiales creados
                </h2>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Ingresa como Administrador para configurar campeonatos con
                  fases de grupos, clasificaciones y tablas automáticas.
                </p>
              </div>
            )}

            {officialTournaments.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition border ${
                      statusFilter === 'ALL'
                        ? 'bg-yellow-400 text-zinc-950 border-yellow-400'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    Todos ({officialTournaments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ACTIVE')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition border ${
                      statusFilter === 'ACTIVE'
                        ? 'bg-yellow-400 text-zinc-950 border-yellow-400'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    En Curso ({activeCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('FINISHED')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition border ${
                      statusFilter === 'FINISHED'
                        ? 'bg-emerald-400 text-zinc-950 border-emerald-400'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    Finalizados ({finishedTournamentsCount})
                  </button>
                </div>

                {/* Filtro por Categoría */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1">
                    Categoría:
                  </span>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                      categoryFilter === 'ALL'
                        ? 'bg-zinc-800 text-white border-zinc-600'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('STANDARD')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                      categoryFilter === 'STANDARD'
                        ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/50'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    🏆 Estándar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('MINI')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                      categoryFilter === 'MINI'
                        ? 'bg-sky-400/20 text-sky-300 border-sky-400/50'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    🏐 Mini
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('BENJAMIN')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                      categoryFilter === 'BENJAMIN'
                        ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/50'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    🧒 Benjamín
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredTournaments.map((t) => {
                const liveCount = t.matches.filter(
                  (m) => m.status === 'IN_PROGRESS',
                ).length;

                return (
                  <Link
                    key={t.id}
                    to={`/tournaments/${t.id}`}
                    className="group rounded-3xl border border-zinc-800 bg-zinc-900 hover:border-yellow-400 p-6 flex flex-col justify-between gap-5 transition shadow-xl"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-950 text-yellow-400 border border-zinc-800">
                            {t.formatType === 'LEAGUE_ONLY'
                              ? 'Liga Regular'
                              : t.formatType === 'KNOCKOUT_ONLY'
                                ? 'Eliminación Directa'
                                : `${t.groupsCount ?? 2} Grupos → Clasifican ${t.qualifiersPerGroup}/Grupo`}
                          </span>
                          <span
                            className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                              t.category === 'BENJAMIN'
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                : t.category === 'MINI'
                                  ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                                  : 'bg-yellow-400/15 border-yellow-400/30 text-yellow-300'
                            }`}
                          >
                            {t.category === 'BENJAMIN'
                              ? '🧒 Benjamín'
                              : t.category === 'MINI'
                                ? '🏐 Mini'
                                : '🏆 Estándar'}
                          </span>
                        </div>
                        {t.status === 'FINISHED' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            FINALIZADO
                          </span>
                        ) : liveCount > 0 ? (
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

                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-yellow-400" />
                          {t.teams.length} Equipos Inscritos
                        </span>
                        <span>•</span>
                        <span>{t.matches.length} Partidos Programados</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-black text-yellow-400">
                      <span>Ver Tabla de Posiciones y Cruces</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* SECCIÓN 2: TABLA EXCLUSIVA DE PARTIDOS AMISTOSOS / FOGUEO */}
        {mainTab === 'FRIENDLIES' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Volleyball className="w-4 h-4 text-yellow-400" />
                  Tabla de Partidos Amistosos y de Fogueo
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Encuentros independientes sin acumulación de fase de grupos ni
                  tabla de posiciones.
                </p>
              </div>

              {/* Filtros de Amistosos */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFriendlyFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                    friendlyFilter === 'ALL'
                      ? 'bg-yellow-400 text-zinc-950 border-yellow-400'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  Todos ({friendlyMatches?.length ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setFriendlyFilter('LIVE')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                    friendlyFilter === 'LIVE'
                      ? 'bg-yellow-400 text-zinc-950 border-yellow-400'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  En Vivo (
                  {
                    (friendlyMatches ?? []).filter(
                      (m) => m.status === 'IN_PROGRESS',
                    ).length
                  }
                  )
                </button>
                <button
                  type="button"
                  onClick={() => setFriendlyFilter('UPCOMING')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                    friendlyFilter === 'UPCOMING'
                      ? 'bg-yellow-400 text-zinc-950 border-yellow-400'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  Próximos (
                  {
                    (friendlyMatches ?? []).filter(
                      (m) => m.status === 'SCHEDULED',
                    ).length
                  }
                  )
                </button>
                <button
                  type="button"
                  onClick={() => setFriendlyFilter('FINISHED')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                    friendlyFilter === 'FINISHED'
                      ? 'bg-yellow-400 text-zinc-950 border-yellow-400'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  Finalizados (
                  {
                    (friendlyMatches ?? []).filter(
                      (m) => m.status === 'FINISHED',
                    ).length
                  }
                  )
                </button>
              </div>
            </div>

            {isLoadingFriendlies && (
              <CardGridSkeleton
                count={4}
                columnsClass="grid-cols-1 md:grid-cols-2"
                label="Cargando partidos amistosos..."
              />
            )}

            {!isLoadingFriendlies && filteredFriendlies.length === 0 && (
              <div className="p-12 rounded-3xl border border-zinc-800 bg-zinc-900 text-center space-y-3">
                <Volleyball className="w-10 h-10 text-yellow-400 mx-auto" />
                <h3 className="text-base font-black text-white">
                  No hay partidos amistosos registrados
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  El administrador puede registrar partidos de fogueo
                  directamente desde el Panel Admin usando el botón "Nuevo
                  Amistoso / Fogueo".
                </p>
              </div>
            )}

            {filteredFriendlies.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFriendlies.map((m) => {
                  const isLive = m.status === 'IN_PROGRESS';
                  const isFinished = m.status === 'FINISHED';
                  const homeLogo = resolveTeamLogoUrl(m.homeTeam.logoUrl);
                  const awayLogo = resolveTeamLogoUrl(m.awayTeam.logoUrl);

                  return (
                    <div
                      key={m.id}
                      className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4 shadow-xl hover:border-zinc-700 transition"
                    >
                      {/* Estado y ubicación */}
                      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                        <div className="flex items-center gap-2">
                          {isLive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-yellow-400 text-zinc-950 animate-pulse">
                              <Radio className="w-3.5 h-3.5" />
                              EN VIVO
                            </span>
                          ) : isFinished ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-zinc-800 text-zinc-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Finalizado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-800 text-zinc-400">
                              <Clock className="w-3 h-3 text-yellow-400" />
                              Programado
                            </span>
                          )}
                          <span className="text-xs text-zinc-400 font-bold truncate">
                            {m.courtNumber || 'Cancha por definir'}
                          </span>
                        </div>

                        {m.courtMapUrl && (
                          <a
                            href={
                              normalizeExternalUrl(m.courtMapUrl) ?? undefined
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-yellow-400 hover:underline shrink-0"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Mapa</span>
                          </a>
                        )}
                      </div>

                      {/* Enfrentamiento */}
                      <div className="grid grid-cols-12 items-center gap-3">
                        {/* Local */}
                        <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-xs text-yellow-400 overflow-hidden shrink-0">
                            {homeLogo ? (
                              <img
                                src={homeLogo}
                                alt={m.homeTeam.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              m.homeTeam.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <span
                            className={`text-sm font-black truncate ${
                              m.winnerTeamId === m.homeTeamId
                                ? 'text-yellow-400'
                                : 'text-white'
                            }`}
                          >
                            {m.homeTeam.name}
                          </span>
                        </div>

                        {/* Marcador Central */}
                        <div className="col-span-2 flex flex-col items-center justify-center">
                          <span className="text-lg md:text-xl font-black text-white font-mono">
                            {m.homeSetsWon} - {m.awaySetsWon}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-zinc-500">
                            Sets
                          </span>
                        </div>

                        {/* Visitante */}
                        <div className="col-span-5 flex items-center justify-end gap-2.5 min-w-0">
                          <span
                            className={`text-sm font-black truncate text-right ${
                              m.winnerTeamId === m.awayTeamId
                                ? 'text-yellow-400'
                                : 'text-white'
                            }`}
                          >
                            {m.awayTeam.name}
                          </span>
                          <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-xs text-yellow-400 overflow-hidden shrink-0">
                            {awayLogo ? (
                              <img
                                src={awayLogo}
                                alt={m.awayTeam.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              m.awayTeam.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Parciales por Set */}
                      {m.sets && m.sets.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-zinc-800/80">
                          {m.sets.map((s) => (
                            <span
                              key={s.id || s.setNumber}
                              className="px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300"
                            >
                              S{s.setNumber}: {s.homeScore}-{s.awayScore}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="flex items-center justify-between gap-2 pt-2">
                        <span className="text-[11px] text-zinc-400">
                          {m.scheduledAt
                            ? new Date(m.scheduledAt).toLocaleString([], {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : 'Sin hora fijada'}
                        </span>

                        <div className="flex items-center gap-2">
                          {(user?.role === 'ADMIN' ||
                            user?.role === 'REFEREE') && (
                            <Link
                              to={`/referee/matches/${m.id}/score`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-yellow-400 border border-zinc-700 transition"
                            >
                              <span>Planilla</span>
                            </Link>
                          )}
                          <Link
                            to={`/matches/${m.id}/live`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-zinc-950 transition"
                          >
                            <span>Ver en Vivo</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
