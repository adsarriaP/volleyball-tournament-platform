import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Edit3,
  ExternalLink,
  ImagePlus,
  MapPin,
  Pencil,
  Play,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { apiFetch, resolveTeamLogoUrl } from '../../../shared/api/httpClient';
import { CustomDatePicker } from '../../../shared/components/CustomDatePicker';
import {
  AuthUser,
  MatchSummary,
  Team,
  TournamentFormatType,
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

  // 1. Crear Torneo
  const [tName, setTName] = useState('');
  const [tFormat, setTFormat] =
    useState<TournamentFormatType>('GROUPS_THEN_KNOCKOUT');
  const [tMaxTeams, setTMaxTeams] = useState(20);
  const [tGroupsCount, setTGroupsCount] = useState(2);
  const [tQualifiers, setTQualifiers] = useState(2);
  const [tMaxSets, setTMaxSets] = useState(3);
  const [tRegularPts, setTRegularPts] = useState(25);
  const [tFinalPts, setTFinalPts] = useState(15);
  const [tStartDate, setTStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [tEndDate, setTEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );

  // 2. Registrar Equipo
  const [teamName, setTeamName] = useState('');
  const [delegateName, setDelegateName] = useState('');
  const [selectedTournamentForTeam, setSelectedTournamentForTeam] =
    useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // 3. Crear Juez
  const [refName, setRefName] = useState('');
  const [refEmail, setRefEmail] = useState('');
  const [refPassword, setRefPassword] = useState('');

  // 4. Edición de Cruces
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

  // 5. Modales de Edición (Equipos, Jueces y Resultado de Partido)
  const [editingTeam, setEditingTeam] = useState<{
    id: number;
    name: string;
    delegateName: string;
    logoFile: File | null;
  } | null>(null);

  const [editingReferee, setEditingReferee] = useState<{
    id: number;
    name: string;
    email: string;
    password: string;
  } | null>(null);

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

  // Equipos aislados estrictamente por el torneo seleccionado
  const numericSelectedTournamentId = selectedTournamentForTeam
    ? Number(selectedTournamentForTeam)
    : undefined;

  const { data: teamsInSelectedTournament = [] } = useQuery<Team[]>({
    queryKey: ['admin-teams-tournament', numericSelectedTournamentId],
    queryFn: () =>
      apiFetch<Team[]>(
        numericSelectedTournamentId
          ? `/teams?tournamentId=${numericSelectedTournamentId}`
          : '/teams',
      ),
    enabled: true,
  });

  const targetTournament = tournaments?.find(
    (t) => String(t.id) === selectedTournamentForTeam,
  );

  const maxAllowedTeams = targetTournament?.maxTeams ?? 20;
  const currentCount = selectedTournamentForTeam
    ? teamsInSelectedTournament.length
    : 0;
  const isQuotaReached = Boolean(
    targetTournament && currentCount >= maxAllowedTeams,
  );
  const remainingQuota = Math.max(0, maxAllowedTeams - currentCount);

  // Buscador de equipos dentro del torneo seleccionado
  const filteredTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return teamsInSelectedTournament;
    const q = teamSearchQuery.toLowerCase();
    return teamsInSelectedTournament.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.delegateName && t.delegateName.toLowerCase().includes(q)),
    );
  }, [teamsInSelectedTournament, teamSearchQuery]);

  const isCurrentSearchAlreadyRegistered = useMemo(() => {
    if (!teamName.trim()) return false;
    return teamsInSelectedTournament.some(
      (t) => t.name.trim().toLowerCase() === teamName.trim().toLowerCase(),
    );
  }, [teamsInSelectedTournament, teamName]);

  const createTournamentMutation = useMutation({
    mutationFn: () => {
      setErrorMsg(null);
      return apiFetch<{ id: number; name: string }>('/tournaments', {
        method: 'POST',
        body: JSON.stringify({
          name: tName,
          formatType: tFormat,
          maxTeams: tMaxTeams,
          groupsCount: tGroupsCount,
          qualifiersPerGroup: tQualifiers,
          maxSets: tMaxSets,
          pointsRegularSet: tRegularPts,
          pointsFinalSet: tFinalPts,
          pointsDifference: 2,
          startDate: tStartDate,
          endDate: tEndDate,
          dailyStartHour: 8,
          dailyEndHour: 18,
        }),
      });
    },
    onSuccess: (created) => {
      setTName('');
      setSelectedTournamentForTeam(String(created.id));
      setFeedback(
        `Torneo "${created.name}" creado. Se ha seleccionado automáticamente para registrar sus equipos (Cupo: 0 / ${tMaxTeams}).`,
      );
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const createTeamMutation = useMutation({
    mutationFn: () => {
      setErrorMsg(null);
      if (!selectedTournamentForTeam) {
        throw new Error(
          'Debes seleccionar el torneo al que vas a registrar el equipo.',
        );
      }
      const formData = new FormData();
      formData.append('name', teamName);
      if (delegateName.trim()) {
        formData.append('delegateName', delegateName.trim());
      }
      formData.append('tournamentId', selectedTournamentForTeam);
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      return apiFetch('/teams', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      setTeamName('');
      setDelegateName('');
      setLogoFile(null);
      setFeedback('Equipo registrado correctamente en el torneo.');
      void queryClient.invalidateQueries({
        queryKey: ['admin-teams-tournament', numericSelectedTournamentId],
      });
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const createRefereeMutation = useMutation({
    mutationFn: () => {
      setErrorMsg(null);
      return apiFetch('/auth/referees', {
        method: 'POST',
        body: JSON.stringify({
          name: refName,
          email: refEmail,
          password: refPassword,
        }),
      });
    },
    onSuccess: () => {
      setRefName('');
      setRefEmail('');
      setRefPassword('');
      setFeedback('Cuenta de Juez creada exitosamente.');
      void queryClient.invalidateQueries({ queryKey: ['admin-referees'] });
    },
    onError: (err: Error) => setErrorMsg(err.message),
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
    onSuccess: (res) => {
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

  const updateTeamMutation = useMutation({
    mutationFn: () => {
      if (!editingTeam) throw new Error('No hay equipo seleccionado.');
      setErrorMsg(null);
      const formData = new FormData();
      formData.append('name', editingTeam.name.trim());
      formData.append('delegateName', editingTeam.delegateName.trim());
      if (editingTeam.logoFile) {
        formData.append('logo', editingTeam.logoFile);
      }
      return apiFetch(`/teams/${editingTeam.id}`, {
        method: 'PATCH',
        body: formData,
      });
    },
    onSuccess: () => {
      setEditingTeam(null);
      setFeedback('Equipo actualizado correctamente.');
      void queryClient.invalidateQueries({
        queryKey: ['admin-teams-tournament', numericSelectedTournamentId],
      });
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: number) => {
      setErrorMsg(null);
      return apiFetch(`/teams/${teamId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      setFeedback('Equipo eliminado correctamente.');
      void queryClient.invalidateQueries({
        queryKey: ['admin-teams-tournament', numericSelectedTournamentId],
      });
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const updateRefereeMutation = useMutation({
    mutationFn: () => {
      if (!editingReferee) throw new Error('No hay juez seleccionado.');
      setErrorMsg(null);
      const payload: { name: string; email: string; password?: string } = {
        name: editingReferee.name.trim(),
        email: editingReferee.email.trim(),
      };
      if (editingReferee.password.trim()) {
        payload.password = editingReferee.password.trim();
      }
      return apiFetch(`/auth/referees/${editingReferee.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setEditingReferee(null);
      setFeedback('Juez actualizado correctamente.');
      void queryClient.invalidateQueries({ queryKey: ['admin-referees'] });
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const deleteRefereeMutation = useMutation({
    mutationFn: (refereeId: number) => {
      setErrorMsg(null);
      return apiFetch(`/auth/referees/${refereeId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      setFeedback('Juez eliminado correctamente.');
      void queryClient.invalidateQueries({ queryKey: ['admin-referees'] });
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

  return (
    <div className="relative min-h-screen px-4 py-8 space-y-8 overflow-hidden">
      {/* Fondo atmosférico estilo Spotify */}
      <div className="absolute top-12 left-1/3 w-[500px] h-[500px] bg-yellow-400/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-yellow-400" />
            Panel de Administración • VoleiScore
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Crea torneos (ej. 20 equipos en 2 grupos de 10 con 10 partidos garantizados),
            registra los equipos de cada torneo con su delegado y programa canchas con Google Maps.
          </p>
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

        {/* Fila Superior: 1. Crear Torneo | 2. Registrar Equipos (Aislado por Torneo) | 3. Crear Juez */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* 1. Crear Torneo */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center gap-2 text-yellow-400 font-black text-sm">
              <Trophy className="w-4 h-4" />
              1. Configurar Nuevo Torneo
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTournamentMutation.mutate();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-0.5">
                  Nombre del Torneo
                </label>
                <input
                  type="text"
                  required
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  placeholder="Ej. Torneo Nacional 20 Equipos"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-yellow-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-0.5">
                    Cupo Equipos
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={64}
                    value={tMaxTeams}
                    onChange={(e) => setTMaxTeams(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-yellow-400 font-black text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-0.5">
                    N° Grupos
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={tGroupsCount}
                    onChange={(e) => setTGroupsCount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-0.5">
                    Clasif./Grupo
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={tQualifiers}
                    onChange={(e) => setTQualifiers(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-yellow-400 font-black text-center"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300">
                Se dividirá en <strong>{tGroupsCount} grupos de {Math.ceil(tMaxTeams / Math.max(1, tGroupsCount))} equipos</strong>.
                Cada equipo tendrá <strong>10 partidos programados</strong> de 8:00 AM a 6:00 PM y clasificarán{' '}
                <strong className="text-yellow-400">{tQualifiers} por grupo</strong> a la fase final.
              </div>

              {/* Calendarios Desplegables Interactivos (CustomDatePicker) */}
              <div className="grid grid-cols-2 gap-2">
                <CustomDatePicker
                  label="Fecha Inicio"
                  value={tStartDate}
                  onChange={setTStartDate}
                />
                <CustomDatePicker
                  label="Fecha Fin"
                  value={tEndDate}
                  onChange={setTEndDate}
                />
              </div>

              <button
                type="submit"
                disabled={createTournamentMutation.isPending}
                className="w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black text-xs transition shadow-md shadow-yellow-400/20"
              >
                Crear Torneo Oficial
              </button>
            </form>
          </div>

          {/* 2. Registrar Equipos con Aislamiento Estricto por Torneo y Buscador */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-400 font-black text-sm">
                <Users className="w-4 h-4" />
                2. Equipos del Torneo
              </div>
              {targetTournament && (
                <span
                  className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                    isQuotaReached
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-zinc-950 text-yellow-400 border border-zinc-800'
                  }`}
                >
                  {currentCount} / {maxAllowedTeams} Equipos
                </span>
              )}
            </div>

            {/* Selector de Torneo Obligatorio para Aislar Equipos */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-0.5">
                Selecciona el Torneo a Gestionar
              </label>
              <select
                value={selectedTournamentForTeam}
                onChange={(e) => {
                  setSelectedTournamentForTeam(e.target.value);
                  setTeamSearchQuery('');
                }}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-yellow-400 outline-none"
              >
                <option value="">-- Elige un Torneo --</option>
                {tournaments?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Cupo: {t.teams.length}/{t.maxTeams ?? 20})
                  </option>
                ))}
              </select>
            </div>

            {/* Barra de Progreso de Cupo */}
            {targetTournament && (
              <div className="space-y-1">
                <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isQuotaReached ? 'bg-emerald-400' : 'bg-yellow-400'
                    }`}
                    style={{
                      width: `${Math.min(100, (currentCount / maxAllowedTeams) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-400 font-semibold">
                  <span>Inscritos: {currentCount}</span>
                  <span className={isQuotaReached ? 'text-emerald-400 font-bold' : 'text-yellow-400'}>
                    {isQuotaReached
                      ? '✅ Cupo Completo para Iniciar'
                      : `Faltan ${remainingQuota} equipos`}
                  </span>
                </div>
              </div>
            )}

            {/* Formulario de Alta de Equipo */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTeamMutation.mutate();
              }}
              className="space-y-2.5 pt-1 border-t border-zinc-800"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-0.5">
                    Nombre del Equipo
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!selectedTournamentForTeam || isQuotaReached}
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Ej. Titanes Voley"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white disabled:opacity-40"
                  />
                  {isCurrentSearchAlreadyRegistered && (
                    <span className="text-[10px] text-rose-400 font-bold">
                      Ya existe en este torneo
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-0.5">
                    Delegado del Equipo
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!selectedTournamentForTeam || isQuotaReached}
                    value={delegateName}
                    onChange={(e) => setDelegateName(e.target.value)}
                    placeholder="Ej. Juan Gómez"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white disabled:opacity-40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-0.5">
                  Escudo / Icono (Guardado en Backend)
                </label>
                <label
                  className={`flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-950 border border-dashed border-zinc-700 text-xs text-zinc-300 ${
                    !selectedTournamentForTeam || isQuotaReached
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:border-yellow-400 cursor-pointer'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <ImagePlus className="w-4 h-4 text-yellow-400 shrink-0" />
                    {logoFile ? logoFile.name : 'Subir imagen de escudo...'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!selectedTournamentForTeam || isQuotaReached}
                    onChange={(e) =>
                      setLogoFile(e.target.files?.[0] ? e.target.files[0] : null)
                    }
                    className="hidden"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={
                  !selectedTournamentForTeam ||
                  isQuotaReached ||
                  createTeamMutation.isPending ||
                  isCurrentSearchAlreadyRegistered
                }
                className="w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-zinc-950 font-black text-xs inline-flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                Inscribir Equipo en Torneo
              </button>
            </form>

            {/* Buscador de Equipos dentro del Torneo */}
            {selectedTournamentForTeam && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                    placeholder="Buscar equipo o delegado en este torneo..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:border-yellow-400 outline-none"
                  />
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {filteredTeams.length === 0 ? (
                    <div className="p-3 text-center text-xs text-zinc-500">
                      {teamsInSelectedTournament.length === 0
                        ? 'No hay equipos registrados en este torneo aún.'
                        : 'No coincide ningún equipo con la búsqueda.'}
                    </div>
                  ) : (
                    filteredTeams.map((t) => {
                      const logo = resolveTeamLogoUrl(t.logoUrl);
                      return (
                        <div
                          key={t.id}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center overflow-hidden text-[10px] font-black text-yellow-400 shrink-0">
                              {logo ? (
                                <img
                                  src={logo}
                                  alt={t.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                t.name.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <span className="font-bold text-white truncate">
                              {t.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-[10px] text-zinc-400">
                              Del: {t.delegateName || 'N/A'}
                            </span>
                            <button
                              type="button"
                              title="Editar equipo"
                              onClick={() =>
                                setEditingTeam({
                                  id: t.id,
                                  name: t.name,
                                  delegateName: t.delegateName ?? '',
                                  logoFile: null,
                                })
                              }
                              className="p-1 rounded-md bg-zinc-900 hover:bg-yellow-400 text-zinc-300 hover:text-zinc-950 transition"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              title="Eliminar equipo"
                              disabled={deleteTeamMutation.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `¿Eliminar al equipo "${t.name}"? Esta acción no se puede deshacer.`,
                                  )
                                ) {
                                  deleteTeamMutation.mutate(t.id);
                                }
                              }}
                              className="p-1 rounded-md bg-zinc-900 hover:bg-rose-500 text-zinc-300 hover:text-white transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. Crear Credenciales de Jueces */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-yellow-400 font-black text-sm">
              <UserPlus className="w-4 h-4" />
              3. Crear Usuario Juez ({referees?.length ?? 0})
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRefereeMutation.mutate();
              }}
              className="space-y-2.5"
            >
              <input
                type="text"
                required
                value={refName}
                onChange={(e) => setRefName(e.target.value)}
                placeholder="Nombre completo del Juez"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
              <input
                type="email"
                required
                value={refEmail}
                onChange={(e) => setRefEmail(e.target.value)}
                placeholder="juez@voleibol.com"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
              <input
                type="password"
                required
                value={refPassword}
                onChange={(e) => setRefPassword(e.target.value)}
                placeholder="Contraseña de acceso"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
              <button
                type="submit"
                disabled={createRefereeMutation.isPending}
                className="w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black text-xs transition shadow-md shadow-yellow-400/20"
              >
                Crear Cuenta de Juez
              </button>
            </form>

            <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs text-zinc-400">
              {referees?.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800"
                >
                  <div className="truncate">
                    <span className="text-white font-semibold block truncate">
                      {r.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 truncate block">
                      {r.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title="Editar juez"
                      onClick={() =>
                        setEditingReferee({
                          id: r.id,
                          name: r.name,
                          email: r.email,
                          password: '',
                        })
                      }
                      className="p-1 rounded-md bg-zinc-900 hover:bg-yellow-400 text-zinc-300 hover:text-zinc-950 transition"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      title="Eliminar juez"
                      disabled={deleteRefereeMutation.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Eliminar al juez "${r.name}"?`,
                          )
                        ) {
                          deleteRefereeMutation.mutate(r.id);
                        }
                      }}
                      className="p-1 rounded-md bg-zinc-900 hover:bg-rose-500 text-zinc-300 hover:text-white transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Torneos Creados: Iniciar y Programar Canchas */}
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
                      <Play className="w-4 h-4 fill-current" />
                      Iniciar Torneo (Generar 10 Partidos/Equipo de 8AM a 6PM)
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
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-zinc-950 transition"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        Generar Llaves Fase Final (Top {tournament.qualifiersPerGroup}/Grupo)
                      </button>
                    </>
                  )}
                </div>
              </div>

              {tournament.matches.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Edición de Cancha, Link Google Maps y Juez
                  </h3>

                  <div className="overflow-x-auto">
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
                                    onClick={() =>
                                      setEditingMatchResult({
                                        match: m,
                                        homeSetsWon: m.homeSetsWon,
                                        awaySetsWon: m.awaySetsWon,
                                        status: m.status,
                                        winnerTeamId: m.winnerTeamId
                                          ? String(m.winnerTeamId)
                                          : '',
                                        sets:
                                          m.sets && m.sets.length > 0
                                            ? m.sets.map((s) => ({
                                                setNumber: s.setNumber,
                                                homeScore: s.homeScore,
                                                awayScore: s.awayScore,
                                              }))
                                            : [
                                                {
                                                  setNumber: 1,
                                                  homeScore: 0,
                                                  awayScore: 0,
                                                },
                                              ],
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                                    title="Corregir Marcador / Resultado"
                                  >
                                    <Edit3 className="w-3 h-3 text-yellow-400" />
                                    Marcador
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => scheduleMatchMutation.mutate(m)}
                                    className="px-3 py-1.5 rounded-lg font-black bg-yellow-400 hover:bg-yellow-300 text-zinc-950 transition"
                                  >
                                    Guardar
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
          ))}
        </div>
      </div>

      {/* Modal: Editar Equipo */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateTeamMutation.mutate();
            }}
            className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-white">
                Editar Equipo
              </h3>
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Nombre del Equipo
                </label>
                <input
                  type="text"
                  required
                  value={editingTeam.name}
                  onChange={(e) =>
                    setEditingTeam({ ...editingTeam, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Delegado del Equipo
                </label>
                <input
                  type="text"
                  value={editingTeam.delegateName}
                  onChange={(e) =>
                    setEditingTeam({
                      ...editingTeam,
                      delegateName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Cambiar Escudo (Opcional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setEditingTeam({
                      ...editingTeam,
                      logoFile: e.target.files?.[0] ?? null,
                    })
                  }
                  className="w-full text-xs text-zinc-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updateTeamMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-zinc-950 transition"
              >
                {updateTeamMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Editar Juez */}
      {editingReferee && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateRefereeMutation.mutate();
            }}
            className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-white">
                Editar Juez
              </h3>
              <button
                type="button"
                onClick={() => setEditingReferee(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={editingReferee.name}
                  onChange={(e) =>
                    setEditingReferee({
                      ...editingReferee,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={editingReferee.email}
                  onChange={(e) =>
                    setEditingReferee({
                      ...editingReferee,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Nueva Contraseña (dejar vacío para mantener la actual)
                </label>
                <input
                  type="password"
                  minLength={4}
                  value={editingReferee.password}
                  onChange={(e) =>
                    setEditingReferee({
                      ...editingReferee,
                      password: e.target.value,
                    })
                  }
                  placeholder="Opcional"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingReferee(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updateRefereeMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-zinc-950 transition"
              >
                {updateRefereeMutation.isPending
                  ? 'Guardando...'
                  : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

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
                className="px-4 py-2 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-zinc-950 transition"
              >
                {updateMatchResultMutation.isPending
                  ? 'Guardando...'
                  : 'Guardar Resultado'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
