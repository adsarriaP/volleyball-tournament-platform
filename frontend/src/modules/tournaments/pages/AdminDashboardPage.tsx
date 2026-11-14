import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  ExternalLink,
  Loader2,
  MapPin,
  Play,
  ShieldAlert,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { apiFetch } from '../../../shared/api/httpClient';
import { AdminSidebarLayout } from '../components/AdminSidebarLayout';
import {
  AuthUser,
  MatchSummary,
  Team,
  TournamentRules,
} from '../../../shared/types/volleyball.types';

interface TournamentWithMatches extends TournamentRules {
  teams: Team[];
  matches: MatchSummary[];
}

export const AdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Edición de Cruces
  const [scheduleEdits, setScheduleEdits] = useState<
    Record<
      number,
      {
        scheduledAt: string;
        courtNumber: string;
        courtMapUrl: string;
        refereeId: string;
      }
    >
  >({});

  // 2. Modal de Resultado de Partido y Collapse de Partidos por Torneo
  const [expandedTournamentIds, setExpandedTournamentIds] = useState<
    Record<number, boolean>
  >({});

  const toggleTournamentMatches = (tournamentId: number) => {
    setExpandedTournamentIds((prev) => ({
      ...prev,
      [tournamentId]: !prev[tournamentId],
    }));
  };

  const [editingMatchResult, setEditingMatchResult] = useState<{
    match: MatchSummary;
    homeSetsWon: number;
    awaySetsWon: number;
    status: MatchSummary['status'];
    winnerTeamId: string;
    sets: { setNumber: number; homeScore: number; awayScore: number }[];
  } | null>(null);

  const { data: tournaments } = useQuery<TournamentWithMatches[]>({
    queryKey: ['tournaments-list'],
    queryFn: () => apiFetch<TournamentWithMatches[]>('/tournaments'),
  });

  const { data: referees } = useQuery<AuthUser[]>({
    queryKey: ['admin-referees'],
    queryFn: () => apiFetch<AuthUser[]>('/auth/referees'),
  });

  const startTournamentMutation = useMutation({
    mutationFn: (tournamentId: number) => {
      setErrorMsg(null);
      return apiFetch<{ totalMatchesGenerated: number }>(
        `/tournaments/${tournamentId}/start`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        },
      );
    },
    onSuccess: (res, tournamentId) => {
      setExpandedTournamentIds((prev) => ({ ...prev, [tournamentId]: true }));
      setFeedback(
        `¡Torneo iniciado! Se generaron ${res.totalMatchesGenerated} cruces con horarios entre 8:00 AM y 6:00 PM (10 partidos garantizados por equipo).`,
      );
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const advanceKnockoutMutation = useMutation({
    mutationFn: (tournamentId: number) => {
      setErrorMsg(null);
      return apiFetch<{ phaseName: string; totalKnockoutMatches: number }>(
        `/tournaments/${tournamentId}/advance-knockout`,
        {
          method: 'POST',
        },
      );
    },
    onSuccess: (res) => {
      setFeedback(
        `Fase eliminatoria generada con ${res.totalKnockoutMatches} partidos con los mejores de cada grupo.`,
      );
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const scheduleMatchMutation = useMutation({
    mutationFn: async (match: MatchSummary) => {
      setErrorMsg(null);
      const edit = scheduleEdits[match.id];
      const scheduledAt =
        edit?.scheduledAt !== undefined
          ? edit.scheduledAt
          : match.scheduledAt
            ? match.scheduledAt.slice(0, 16)
            : '';
      const courtNumber =
        edit?.courtNumber !== undefined
          ? edit.courtNumber
          : (match.courtNumber ?? '');
      const courtMapUrl =
        edit?.courtMapUrl !== undefined
          ? edit.courtMapUrl
          : (match.courtMapUrl ?? '');
      const refereeIdStr =
        edit?.refereeId !== undefined
          ? edit.refereeId
          : match.refereeId
            ? String(match.refereeId)
            : '';

      return apiFetch(`/matches/${match.id}/schedule`, {
        method: 'PATCH',
        body: JSON.stringify({
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          courtNumber: courtNumber || null,
          courtMapUrl: courtMapUrl || null,
          refereeId: refereeIdStr ? Number(refereeIdStr) : null,
        }),
      });
    },
    onSuccess: () => {
      setFeedback('Partido actualizado (Cancha, Mapa y Juez guardados).');
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const updateMatchResultMutation = useMutation({
    mutationFn: () => {
      if (!editingMatchResult) {
        throw new Error('No hay partido seleccionado.');
      }
      setErrorMsg(null);
      return apiFetch(`/matches/${editingMatchResult.match.id}/result`, {
        method: 'PATCH',
        body: JSON.stringify({
          homeSetsWon: editingMatchResult.homeSetsWon,
          awaySetsWon: editingMatchResult.awaySetsWon,
          status: editingMatchResult.status,
          winnerTeamId: editingMatchResult.winnerTeamId
            ? Number(editingMatchResult.winnerTeamId)
            : null,
          sets: editingMatchResult.sets,
        }),
      });
    },
    onSuccess: () => {
      setEditingMatchResult(null);
      setFeedback('Resultado / Marcador del partido corregido exitosamente.');
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const updateEditField = (
    match: MatchSummary,
    field: 'scheduledAt' | 'courtNumber' | 'courtMapUrl' | 'refereeId',
    value: string,
  ) => {
    setScheduleEdits((prev) => ({
      ...prev,
      [match.id]: {
        scheduledAt:
          prev[match.id]?.scheduledAt ??
          (match.scheduledAt ? match.scheduledAt.slice(0, 16) : ''),
        courtNumber: prev[match.id]?.courtNumber ?? (match.courtNumber ?? ''),
        courtMapUrl: prev[match.id]?.courtMapUrl ?? (match.courtMapUrl ?? ''),
        refereeId:
          prev[match.id]?.refereeId ??
          (match.refereeId ? String(match.refereeId) : ''),
        [field]: value,
      },
    }));
  };

  const openMatchResultEditor = (m: MatchSummary) => {
    setEditingMatchResult({
      match: m,
      homeSetsWon: m.homeSetsWon,
      awaySetsWon: m.awaySetsWon,
      status: m.status,
      winnerTeamId: m.winnerTeamId ? String(m.winnerTeamId) : '',
      sets:
        m.sets && m.sets.length > 0
          ? m.sets.map((s) => ({
              setNumber: s.setNumber,
              homeScore: s.homeScore,
              awayScore: s.awayScore,
            }))
          : [{ setNumber: 1, homeScore: 0, awayScore: 0 }],
    });
  };

  const totalTournaments = tournaments?.length ?? 0;
  const totalTeams =
    tournaments?.reduce((acc, t) => acc + t.teams.length, 0) ?? 0;
  const totalReferees = referees?.length ?? 0;
  const totalMatches =
    tournaments?.reduce((acc, t) => acc + t.matches.length, 0) ?? 0;

  return (
    <AdminSidebarLayout>
      <div className="relative min-h-screen px-4 py-5 md:px-8 md:py-8 space-y-6 overflow-x-hidden">
        {/* Fondo atmosférico estilo Spotify */}
        <div className="absolute top-12 left-1/3 w-[500px] h-[500px] bg-yellow-400/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          {/* Cabecera limpia */}
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5">
              <ShieldAlert className="w-7 h-7 text-yellow-400 shrink-0" />
              <span>Panel de Administración • VoleiScore</span>
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 mt-1">
              Centro de control para administrar torneos, equipos, jueces y
              programar canchas en tiempo real.
            </p>
          </div>

          {/* KPIs de Resumen Rápido */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Torneos
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {totalTournaments}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Equipos Inscritos
              </div>
              <div className="text-2xl font-black text-yellow-400 mt-1">
                {totalTeams}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Jueces Activos
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {totalReferees}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Partidos Totales
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {totalMatches}
              </div>
            </div>
          </div>

          {/* Accesos Directos a Módulos (Diseño uniforme estilo Sidebar) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/admin/tournaments"
              className="group flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-zinc-950 shadow-lg shadow-yellow-400/20 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Trophy className="w-5 h-5 shrink-0 text-zinc-950" />
                <div className="min-w-0">
                  <div className="text-xs font-black truncate">
                    Torneos y Configuración
                  </div>
                  <div className="text-[10px] text-zinc-800 font-semibold truncate">
                    Crear, editar y eliminar ({totalTournaments})
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition" />
            </Link>

            <Link
              to="/admin/teams"
              className="group flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-zinc-950 shadow-lg shadow-yellow-400/20 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Users className="w-5 h-5 shrink-0 text-zinc-950" />
                <div className="min-w-0">
                  <div className="text-xs font-black truncate">Equipos</div>
                  <div className="text-[10px] text-zinc-800 font-semibold truncate">
                    Inscribir, editar y eliminar ({totalTeams})
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition" />
            </Link>

            <Link
              to="/admin/referees"
              className="group flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-zinc-950 shadow-lg shadow-yellow-400/20 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <UserPlus className="w-5 h-5 shrink-0 text-zinc-950" />
                <div className="min-w-0">
                  <div className="text-xs font-black truncate">Jueces</div>
                  <div className="text-[10px] text-zinc-800 font-semibold truncate">
                    Crear, editar y eliminar ({totalReferees})
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          {feedback && (
            <div className="p-4 rounded-2xl border border-yellow-400/50 bg-zinc-900/90 backdrop-blur text-yellow-400 text-xs font-bold flex items-center justify-between shadow-xl">
              <span>{feedback}</span>
              <button onClick={() => setFeedback(null)} className="text-white">
                ✕
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl border border-rose-500/50 bg-rose-950/50 backdrop-blur text-rose-300 text-xs font-bold flex items-center justify-between shadow-xl">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)}>✕</button>
            </div>
          )}

        {/* Torneos Creados: Iniciar y Programar Canchas */}
        <div className="space-y-6">
          {tournaments?.map((tournament) => (
            <div
              key={tournament.id}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-xl p-6 space-y-5 shadow-2xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                    {tournament.name}
                    <Link
                      to={`/tournaments/${tournament.id}`}
                      className="text-xs font-black text-yellow-400 hover:underline"
                    >
                      (Abrir Vista SofaScore ↗)
                    </Link>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Cupo: {tournament.teams.length} / {tournament.maxTeams ?? 20} equipos •{' '}
                    {tournament.groupsCount ?? 2} Grupos • Clasifican {tournament.qualifiersPerGroup} por grupo •{' '}
                    Horarios automáticos: 8:00 AM a 6:00 PM
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {tournament.matches.length === 0 ? (
                    <button
                      type="button"
                      disabled={
                        startTournamentMutation.isPending ||
                        tournament.teams.length < 2
                      }
                      onClick={() =>
                        startTournamentMutation.mutate(tournament.id)
                      }
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs md:text-sm font-black bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-zinc-950 shadow-lg shadow-yellow-400/25 transition"
                    >
                      {startTournamentMutation.isPending &&
                      startTournamentMutation.variables === tournament.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Iniciando Torneo...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          Iniciar Torneo (Generar 10 Partidos/Equipo de 8AM a 6PM)
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-zinc-950 text-yellow-400 border border-zinc-800">
                        <CheckCircle2 className="w-4 h-4" />
                        {tournament.matches.length} Cruces Programados (10 por equipo)
                      </span>
                      <button
                        type="button"
                        disabled={advanceKnockoutMutation.isPending}
                        onClick={() =>
                          advanceKnockoutMutation.mutate(tournament.id)
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-zinc-950 transition"
                      >
                        {advanceKnockoutMutation.isPending &&
                        advanceKnockoutMutation.variables === tournament.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Generando Llaves...
                          </>
                        ) : (
                          <>
                            <Trophy className="w-3.5 h-3.5" />
                            Generar Llaves Fase Final (Top {tournament.qualifiersPerGroup}/Grupo)
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {tournament.matches.length > 0 && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => toggleTournamentMatches(tournament.id)}
                    aria-expanded={Boolean(expandedTournamentIds[tournament.id])}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-zinc-950/90 hover:bg-zinc-800/80 border border-zinc-800 transition text-left"
                  >
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-yellow-400">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>
                        Edición de Cancha, Link Google Maps y Juez (
                        {tournament.matches.length} partidos)
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 shrink-0">
                      <span>
                        {expandedTournamentIds[tournament.id]
                          ? 'Ocultar partidos'
                          : 'Programar partidos'}
                      </span>
                      {expandedTournamentIds[tournament.id] ? (
                        <ChevronUp className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  </button>

                  {expandedTournamentIds[tournament.id] && (
                    <div className="space-y-4">
                      {/* Vista Tarjetas en Móvil (sin scroll horizontal) */}
                      <div className="lg:hidden space-y-3">
                        {tournament.matches.map((m) => {
                          const edit = scheduleEdits[m.id];
                          const dateVal =
                            edit?.scheduledAt !== undefined
                              ? edit.scheduledAt
                              : m.scheduledAt
                                ? m.scheduledAt.slice(0, 16)
                                : '';
                          const courtVal =
                            edit?.courtNumber !== undefined
                              ? edit.courtNumber
                              : (m.courtNumber ?? '');
                          const mapVal =
                            edit?.courtMapUrl !== undefined
                              ? edit.courtMapUrl
                              : (m.courtMapUrl ?? '');
                          const refVal =
                            edit?.refereeId !== undefined
                              ? edit.refereeId
                              : m.refereeId
                                ? String(m.refereeId)
                                : '';

                          const isSavingThis =
                            scheduleMatchMutation.isPending &&
                            scheduleMatchMutation.variables?.id === m.id;

                          return (
                            <div
                              key={m.id}
                              className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4 space-y-3 text-xs"
                            >
                              <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2.5">
                                <div>
                                  <div className="font-black text-white text-sm">
                                    {m.homeTeam.name}{' '}
                                    <span className="text-yellow-400">vs</span>{' '}
                                    {m.awayTeam.name}
                                  </div>
                                  <div className="text-[11px] text-zinc-400 mt-0.5">
                                    {m.phase?.name ?? 'Fase'} • {m.status} (
                                    {m.homeSetsWon}-{m.awaySetsWon})
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                                    Fecha y Hora
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={dateVal}
                                    onChange={(e) =>
                                      updateEditField(
                                        m,
                                        'scheduledAt',
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                                    Cancha
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Ej. Cancha Principal"
                                    value={courtVal}
                                    onChange={(e) =>
                                      updateEditField(
                                        m,
                                        'courtNumber',
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                                    Link Google Maps
                                  </label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="url"
                                      placeholder="https://maps.google.com/..."
                                      value={mapVal}
                                      onChange={(e) =>
                                        updateEditField(
                                          m,
                                          'courtMapUrl',
                                          e.target.value,
                                        )
                                      }
                                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs"
                                    />
                                    {mapVal && (
                                      <a
                                        href={mapVal}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Abrir en Google Maps"
                                        className="p-2 rounded-xl bg-zinc-800 text-yellow-400 hover:bg-yellow-400 hover:text-zinc-950 shrink-0"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                                    Juez Asignado
                                  </label>
                                  <select
                                    value={refVal}
                                    onChange={(e) =>
                                      updateEditField(
                                        m,
                                        'refereeId',
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs"
                                  >
                                    <option value="">-- Sin Juez --</option>
                                    {referees?.map((r) => (
                                      <option key={r.id} value={r.id}>
                                        {r.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => openMatchResultEditor(m)}
                                  className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-yellow-400" />
                                  Marcador
                                </button>
                                <button
                                  type="button"
                                  disabled={isSavingThis}
                                  onClick={() =>
                                    scheduleMatchMutation.mutate(m)
                                  }
                                  className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-zinc-950 transition"
                                >
                                  {isSavingThis ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Guardando...
                                    </>
                                  ) : (
                                    'Guardar'
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Vista Tabla en Escritorio */}
                      <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                          <th className="py-2.5 px-2">Partido / Fase</th>
                          <th className="py-2.5 px-2">Fecha y Hora</th>
                          <th className="py-2.5 px-2">Nombre Cancha (String)</th>
                          <th className="py-2.5 px-2">Link Google Maps</th>
                          <th className="py-2.5 px-2">Juez Asignado</th>
                          <th className="py-2.5 px-2 text-right">Guardar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tournament.matches.map((m) => {
                          const edit = scheduleEdits[m.id];
                          const dateVal =
                            edit?.scheduledAt !== undefined
                              ? edit.scheduledAt
                              : m.scheduledAt
                                ? m.scheduledAt.slice(0, 16)
                                : '';
                          const courtVal =
                            edit?.courtNumber !== undefined
                              ? edit.courtNumber
                              : (m.courtNumber ?? '');
                          const mapVal =
                            edit?.courtMapUrl !== undefined
                              ? edit.courtMapUrl
                              : (m.courtMapUrl ?? '');
                          const refVal =
                            edit?.refereeId !== undefined
                              ? edit.refereeId
                              : m.refereeId
                                ? String(m.refereeId)
                                : '';

                          return (
                            <tr
                              key={m.id}
                              className="border-b border-zinc-800/70 hover:bg-zinc-800/40"
                            >
                              <td className="py-2.5 px-2">
                                <div className="font-extrabold text-white">
                                  {m.homeTeam.name}{' '}
                                  <span className="text-yellow-400">vs</span>{' '}
                                  {m.awayTeam.name}
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                  {m.phase?.name ?? 'Fase'} • {m.status} (
                                  {m.homeSetsWon}-{m.awaySetsWon})
                                </div>
                              </td>
                              <td className="py-2.5 px-2">
                                <input
                                  type="datetime-local"
                                  value={dateVal}
                                  onChange={(e) =>
                                    updateEditField(
                                      m,
                                      'scheduledAt',
                                      e.target.value,
                                    )
                                  }
                                  className="px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs"
                                />
                              </td>
                              <td className="py-2.5 px-2">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                                  <input
                                    type="text"
                                    placeholder="Ej. Cancha Principal"
                                    value={courtVal}
                                    onChange={(e) =>
                                      updateEditField(
                                        m,
                                        'courtNumber',
                                        e.target.value,
                                      )
                                    }
                                    className="w-36 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs"
                                  />
                                </div>
                              </td>
                              <td className="py-2.5 px-2">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="url"
                                    placeholder="https://maps.google.com/..."
                                    value={mapVal}
                                    onChange={(e) =>
                                      updateEditField(
                                        m,
                                        'courtMapUrl',
                                        e.target.value,
                                      )
                                    }
                                    className="w-44 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs"
                                  />
                                  {mapVal && (
                                    <a
                                      href={mapVal}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="Abrir en Google Maps"
                                      className="p-1.5 rounded-lg bg-zinc-800 text-yellow-400 hover:bg-yellow-400 hover:text-zinc-950"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-2">
                                <select
                                  value={refVal}
                                  onChange={(e) =>
                                    updateEditField(
                                      m,
                                      'refereeId',
                                      e.target.value,
                                    )
                                  }
                                  className="px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs"
                                >
                                  <option value="">-- Sin Juez --</option>
                                  {referees?.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2.5 px-2 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openMatchResultEditor(m)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                                    title="Corregir Marcador / Resultado"
                                  >
                                    <Edit3 className="w-3 h-3 text-yellow-400" />
                                    Marcador
                                  </button>
                                  <button
                                    type="button"
                                    disabled={
                                      scheduleMatchMutation.isPending &&
                                      scheduleMatchMutation.variables?.id ===
                                        m.id
                                    }
                                    onClick={() =>
                                      scheduleMatchMutation.mutate(m)
                                    }
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-black bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-zinc-950 transition"
                                  >
                                    {scheduleMatchMutation.isPending &&
                                    scheduleMatchMutation.variables?.id ===
                                      m.id ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Guardando...
                                      </>
                                    ) : (
                                      'Guardar'
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Corregir Marcador / Resultado del Partido */}
      {editingMatchResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMatchResultMutation.mutate();
            }}
            className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400">
                  Corrección Oficial de Marcador
                </span>
                <h3 className="text-base font-black text-white">
                  {editingMatchResult.match.homeTeam.name} vs{' '}
                  {editingMatchResult.match.awayTeam.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingMatchResult(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Sets Ganados ({editingMatchResult.match.homeTeam.name})
                </label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={editingMatchResult.homeSetsWon}
                  onChange={(e) =>
                    setEditingMatchResult({
                      ...editingMatchResult,
                      homeSetsWon: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-black text-center text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Sets Ganados ({editingMatchResult.match.awayTeam.name})
                </label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={editingMatchResult.awaySetsWon}
                  onChange={(e) =>
                    setEditingMatchResult({
                      ...editingMatchResult,
                      awaySetsWon: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-black text-center text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Estado del Partido
                </label>
                <select
                  value={editingMatchResult.status}
                  onChange={(e) =>
                    setEditingMatchResult({
                      ...editingMatchResult,
                      status: e.target.value as MatchSummary['status'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                >
                  <option value="SCHEDULED">SCHEDULED (Programado)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (En Curso)</option>
                  <option value="FINISHED">FINISHED (Finalizado)</option>
                  <option value="CANCELLED">CANCELLED (Cancelado)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Equipo Ganador
                </label>
                <select
                  value={editingMatchResult.winnerTeamId}
                  onChange={(e) =>
                    setEditingMatchResult({
                      ...editingMatchResult,
                      winnerTeamId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                >
                  <option value="">-- Sin Ganador --</option>
                  <option value={editingMatchResult.match.homeTeam.id}>
                    {editingMatchResult.match.homeTeam.name} (Local)
                  </option>
                  <option value={editingMatchResult.match.awayTeam.id}>
                    {editingMatchResult.match.awayTeam.name} (Visitante)
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-zinc-400">
                  Parciales por Set
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setEditingMatchResult({
                      ...editingMatchResult,
                      sets: [
                        ...editingMatchResult.sets,
                        {
                          setNumber: editingMatchResult.sets.length + 1,
                          homeScore: 0,
                          awayScore: 0,
                        },
                      ],
                    })
                  }
                  className="text-[11px] font-bold text-yellow-400 hover:underline"
                >
                  + Agregar Set
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {editingMatchResult.sets.map((s, idx) => (
                  <div
                    key={s.setNumber}
                    className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800"
                  >
                    <span className="text-xs font-bold text-zinc-400 w-14">
                      Set {s.setNumber}:
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={s.homeScore}
                      onChange={(e) => {
                        const updatedSets = [...editingMatchResult.sets];
                        updatedSets[idx] = {
                          ...s,
                          homeScore: Number(e.target.value),
                        };
                        setEditingMatchResult({
                          ...editingMatchResult,
                          sets: updatedSets,
                        });
                      }}
                      className="w-20 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-bold text-center text-white"
                    />
                    <span className="text-xs text-zinc-500">-</span>
                    <input
                      type="number"
                      min={0}
                      value={s.awayScore}
                      onChange={(e) => {
                        const updatedSets = [...editingMatchResult.sets];
                        updatedSets[idx] = {
                          ...s,
                          awayScore: Number(e.target.value),
                        };
                        setEditingMatchResult({
                          ...editingMatchResult,
                          sets: updatedSets,
                        });
                      }}
                      className="w-20 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-bold text-center text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMatchResult(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updateMatchResultMutation.isPending}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-zinc-950 transition"
              >
                {updateMatchResultMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Resultado'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      </div>
    </AdminSidebarLayout>
  );
};
