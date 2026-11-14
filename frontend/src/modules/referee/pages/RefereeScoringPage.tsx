import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Trophy, Users } from 'lucide-react';
import { apiFetch } from '../../../shared/api/httpClient';
import { useToastStore } from '../../../shared/store/useToastStore';
import { LiveScoreBanner } from '../../../shared/components/LiveScoreBanner';
import { useMatchLiveSocket } from '../../../shared/hooks/useMatchLiveSocket';
import { MatchLivePayload, Player } from '../../../shared/types/volleyball.types';
import { RefereeScoreboardControl } from '../components/RefereeScoreboardControl';
import { VolleyballCourt } from '../components/VolleyballCourt';

export const RefereeScoringPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const numericMatchId = Number(matchId);

  const [isSidesSwapped, setIsSidesSwapped] = useState(false);
  const [isLineupModalOpen, setIsLineupModalOpen] = useState(false);
  const [setNumberToStart, setSetNumberToStart] = useState(1);
  const [servingTeamId, setServingTeamId] = useState<number>(0);
  const [homePositions, setHomePositions] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [awayPositions, setAwayPositions] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Estado para edición individual de posición en cancha al hacer clic
  const [editingPosition, setEditingPosition] = useState<{
    teamId: number;
    teamName: string;
    posNumber: number;
    currentPlayer?: Player;
  } | null>(null);
  const [directJerseyInput, setDirectJerseyInput] = useState<string>('');

  const {
    liveData,
    isConnected,
    lastRotatedTeamId,
    setInitialData,
  } = useMatchLiveSocket(numericMatchId);

  const { data: fetchedMatch, isLoading, refetch } = useQuery<MatchLivePayload>({
    queryKey: ['match-live', numericMatchId],
    queryFn: () => apiFetch<MatchLivePayload>(`/matches/${numericMatchId}/live`),
    enabled: Boolean(numericMatchId),
  });

  useEffect(() => {
    if (fetchedMatch) {
      setInitialData(fetchedMatch);
      const nextSetNum =
        fetchedMatch.currentSet?.status === 'COMPLETED'
          ? fetchedMatch.currentSet.setNumber + 1
          : (fetchedMatch.currentSet?.setNumber ?? 1);
      setSetNumberToStart(nextSetNum);
      setServingTeamId(
        fetchedMatch.currentSet?.servingTeamId || fetchedMatch.homeTeam.id,
      );

      const hPlayers = fetchedMatch.homeTeam.players ?? [];
      const aPlayers = fetchedMatch.awayTeam.players ?? [];
      if (hPlayers.length >= 6) {
        setHomePositions(hPlayers.slice(0, 6).map((p) => p.id));
      }
      if (aPlayers.length >= 6) {
        setAwayPositions(aPlayers.slice(0, 6).map((p) => p.id));
      }
    }
  }, [fetchedMatch, setInitialData]);

  const updatePositionMutation = useMutation({
    mutationFn: async ({
      positionNumber,
      playerId,
      teamId,
    }: {
      positionNumber: number;
      playerId: number;
      teamId: number;
    }) => {
      setErrorBanner(null);
      if (!activeMatch?.currentSet?.id) {
        throw new Error('No hay un set en curso para modificar la posición.');
      }
      return apiFetch<MatchLivePayload>('/live-scoring/position', {
        method: 'POST',
        body: JSON.stringify({
          matchId: numericMatchId,
          setId: activeMatch.currentSet.id,
          teamId,
          positionNumber,
          playerId,
        }),
      });
    },
    onSuccess: (updated) => {
      setInitialData(updated);
      setEditingPosition(null);
      setDirectJerseyInput('');
      useToastStore.getState().success('Posición en cancha actualizada.');
      void refetch();
    },
    onError: (err: Error) => {
      setErrorBanner(err.message);
      useToastStore.getState().error(err.message);
    },
  });

  const updatePositionByJerseyMutation = useMutation({
    mutationFn: async ({
      positionNumber,
      jerseyNumber,
      teamId,
    }: {
      positionNumber: number;
      jerseyNumber: number;
      teamId: number;
    }) => {
      setErrorBanner(null);
      if (!activeMatch?.currentSet?.id) {
        throw new Error('No hay un set en curso para modificar la posición.');
      }
      return apiFetch<MatchLivePayload>('/live-scoring/position-by-jersey', {
        method: 'POST',
        body: JSON.stringify({
          matchId: numericMatchId,
          setId: activeMatch.currentSet.id,
          teamId,
          positionNumber,
          jerseyNumber,
        }),
      });
    },
    onSuccess: (updated) => {
      setInitialData(updated);
      setEditingPosition(null);
      setDirectJerseyInput('');
      useToastStore.getState().success('Dorsal asignado en cancha.');
      void refetch();
    },
    onError: (err: Error) => {
      setErrorBanner(err.message);
      useToastStore.getState().error(err.message);
    },
  });

  const finishSetMutation = useMutation({
    mutationFn: async () => {
      setErrorBanner(null);
      if (!activeMatch?.currentSet?.id) {
        throw new Error('No hay un set activo para finalizar.');
      }
      return apiFetch<MatchLivePayload>('/live-scoring/finish-set', {
        method: 'POST',
        body: JSON.stringify({
          matchId: numericMatchId,
          setId: activeMatch.currentSet.id,
        }),
      });
    },
    onSuccess: (updated) => {
      if (updated) setInitialData(updated);
      useToastStore.getState().success('Set finalizado correctamente.');
      void refetch();
    },
    onError: (err: Error) => {
      setErrorBanner(err.message);
      useToastStore.getState().error(err.message);
    },
  });

  const finishMatchMutation = useMutation({
    mutationFn: async () => {
      setErrorBanner(null);
      return apiFetch<MatchLivePayload>('/live-scoring/finish-match', {
        method: 'POST',
        body: JSON.stringify({
          matchId: numericMatchId,
        }),
      });
    },
    onSuccess: (updated) => {
      if (updated) setInitialData(updated);
      useToastStore.getState().success('Partido finalizado oficialmente.');
      void refetch();
    },
    onError: (err: Error) => {
      setErrorBanner(err.message);
      useToastStore.getState().error(err.message);
    },
  });

  const activeMatch = liveData ?? fetchedMatch;

  const startSetMutation = useMutation({
    mutationFn: async () => {
      setErrorBanner(null);
      return apiFetch<MatchLivePayload>('/live-scoring/start-set', {
        method: 'POST',
        body: JSON.stringify({
          matchId: numericMatchId,
          setNumber: setNumberToStart,
          servingTeamId: servingTeamId || activeMatch?.homeTeam.id,
          homeLineupPlayerIds: homePositions,
          awayLineupPlayerIds: awayPositions,
        }),
      });
    },
    onSuccess: (updated) => {
      setInitialData(updated);
      setIsLineupModalOpen(false);
      useToastStore.getState().success(`Set #${setNumberToStart} iniciado.`);
      void refetch();
    },
    onError: (err: Error) => {
      setErrorBanner(err.message);
      useToastStore.getState().error(err.message);
    },
  });

  const scorePointMutation = useMutation({
    mutationFn: async (scoringTeamId: number) => {
      setErrorBanner(null);
      if (!activeMatch?.currentSet?.id) {
        throw new Error('Primero debes iniciar el set con la alineación de 6 jugadores.');
      }
      return apiFetch<{ liveState: MatchLivePayload }>(
        '/live-scoring/score-point',
        {
          method: 'POST',
          body: JSON.stringify({
            matchId: numericMatchId,
            setId: activeMatch.currentSet.id,
            scoringTeamId,
          }),
        },
      );
    },
    onSuccess: (res) => {
      if (res?.liveState) {
        setInitialData(res.liveState);
      } else {
        void refetch();
      }
    },
    onError: (err: Error) => {
      setErrorBanner(err.message);
      useToastStore.getState().error(err.message);
    },
  });

  if (isLoading || !activeMatch) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-center text-slate-400">
        Cargando consola táctil del partido...
      </div>
    );
  }

  const isSetCompleted =
    activeMatch.currentSet?.status === 'COMPLETED' &&
    activeMatch.status !== 'FINISHED';

  const handlePositionChange = (
    side: 'home' | 'away',
    posIndex: number,
    playerId: number,
  ) => {
    if (side === 'home') {
      const copy = [...homePositions];
      copy[posIndex] = playerId;
      setHomePositions(copy);
    } else {
      const copy = [...awayPositions];
      copy[posIndex] = playerId;
      setAwayPositions(copy);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      {/* Navegación superior */}
      <div className="flex items-center justify-between">
        <Link
          to="/referee/matches"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-amber-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Mis Partidos Asignados
        </Link>

        <Link
          to={`/matches/${numericMatchId}/live`}
          target="_blank"
          className="text-xs font-semibold text-sky-400 hover:underline"
        >
          Abrir Vista Espectador en Vivo ↗
        </Link>
      </div>

      {errorBanner && (
        <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-950/50 text-rose-200 text-xs font-semibold">
          {errorBanner}
        </div>
      )}

      {/* Alerta cuando se cierra un Set y falta iniciar el siguiente */}
      {isSetCompleted && (
        <div className="p-5 rounded-2xl border border-emerald-500/50 bg-emerald-950/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-base font-black text-white">
                ¡Set {activeMatch.currentSet.setNumber} Finalizado (
                {activeMatch.currentSet.homeScore} -{' '}
                {activeMatch.currentSet.awayScore})!
              </h3>
              <p className="text-xs text-slate-300">
                Registra la alineación inicial para dar comienzo al Set{' '}
                {activeMatch.currentSet.setNumber + 1}.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSetNumberToStart(activeMatch.currentSet.setNumber + 1);
              setIsLineupModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl font-black text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
          >
            Iniciar Set {activeMatch.currentSet.setNumber + 1}
          </button>
        </div>
      )}

      {/* Alerta cuando el Partido ha Finalizado */}
      {activeMatch.status === 'FINISHED' && (
        <div className="p-6 rounded-2xl border border-amber-500/50 bg-amber-500/10 text-center space-y-2">
          <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-xl font-black text-white">
            ¡Partido Finalizado! Ganador:{' '}
            {activeMatch.winnerTeamId === activeMatch.homeTeam.id
              ? activeMatch.homeTeam.name
              : activeMatch.awayTeam.name}
          </h2>
          <p className="text-xs text-slate-300">
            Resultado global en sets: {activeMatch.homeSetsWon} -{' '}
            {activeMatch.awaySetsWon}
          </p>
        </div>
      )}

      {/* Marcador Global y Set en Vivo */}
      <LiveScoreBanner match={activeMatch} isConnected={isConnected} />

      {/* Controles Táctiles de Puntuación (+1 Local / +1 Visitante) */}
      <RefereeScoreboardControl
        match={activeMatch}
        isScoring={scorePointMutation.isPending}
        isMutatingState={
          finishSetMutation.isPending || finishMatchMutation.isPending
        }
        onScorePoint={(teamId) => scorePointMutation.mutate(teamId)}
        onOpenLineupModal={() => setIsLineupModalOpen(true)}
        onToggleSwapSides={() => setIsSidesSwapped((prev) => !prev)}
        onFinishSet={() => finishSetMutation.mutate()}
        onEnableThirdSet={() => {
          setSetNumberToStart(activeMatch.tournament?.maxSets ?? 3);
          setIsLineupModalOpen(true);
        }}
        onFinishMatch={() => finishMatchMutation.mutate()}
      />

      {/* Cancha Interactiva 2D con Rotación Horaria (1 -> 6 -> 5 -> 4 -> 3 -> 2 -> 1) */}
      <VolleyballCourt
        homeTeam={activeMatch.homeTeam}
        awayTeam={activeMatch.awayTeam}
        homeLineup={activeMatch.currentSet?.homeLineup}
        awayLineup={activeMatch.currentSet?.awayLineup}
        servingTeamId={activeMatch.currentSet?.servingTeamId}
        lastRotatedTeamId={lastRotatedTeamId}
        isSidesSwapped={isSidesSwapped}
        onSlotClick={(teamId, posNumber, currentPlayer) => {
          const teamName =
            teamId === activeMatch.homeTeam.id
              ? activeMatch.homeTeam.name
              : activeMatch.awayTeam.name;
          setDirectJerseyInput(
            currentPlayer ? String(currentPlayer.jerseyNumber) : '',
          );
          setEditingPosition({
            teamId,
            teamName,
            posNumber,
            currentPlayer,
          });
        }}
      />

      {/* Modal de Registro de Sexteto Inicial (Posiciones 1 a 6) */}
      {isLineupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-black text-white">
                  Configurar Sexteto Inicial (Posiciones 1 a 6) • Set{' '}
                  {setNumberToStart}
                </h3>
              </div>
              <button
                onClick={() => setIsLineupModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cerrar ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Número de Set a Iniciar
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={setNumberToStart}
                  onChange={(e) => setSetNumberToStart(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Equipo con el Saque Inicial
                </label>
                <select
                  value={servingTeamId}
                  onChange={(e) => setServingTeamId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                >
                  <option value={activeMatch.homeTeam.id}>
                    {activeMatch.homeTeam.name} (Local)
                  </option>
                  <option value={activeMatch.awayTeam.id}>
                    {activeMatch.awayTeam.name} (Visitante)
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Posiciones Equipo Local */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-sm font-extrabold text-amber-400">
                  {activeMatch.homeTeam.name} (Posiciones 1 a 6)
                </h4>
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-16 text-xs font-bold text-slate-400">
                      Pos {idx + 1} {idx === 0 ? '(Saque)' : ''}:
                    </span>
                    <select
                      value={homePositions[idx] ?? 0}
                      onChange={(e) =>
                        handlePositionChange('home', idx, Number(e.target.value))
                      }
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    >
                      {(activeMatch.homeTeam.players ?? []).map((p: Player) => (
                        <option key={p.id} value={p.id}>
                          #{p.jerseyNumber} - {p.firstName} {p.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Posiciones Equipo Visitante */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-sm font-extrabold text-sky-400">
                  {activeMatch.awayTeam.name} (Posiciones 1 a 6)
                </h4>
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-16 text-xs font-bold text-slate-400">
                      Pos {idx + 1} {idx === 0 ? '(Saque)' : ''}:
                    </span>
                    <select
                      value={awayPositions[idx] ?? 0}
                      onChange={(e) =>
                        handlePositionChange('away', idx, Number(e.target.value))
                      }
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    >
                      {(activeMatch.awayTeam.players ?? []).map((p: Player) => (
                        <option key={p.id} value={p.id}>
                          #{p.jerseyNumber} - {p.firstName} {p.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLineupModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={startSetMutation.isPending}
                onClick={() => startSetMutation.mutate()}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
              >
                {startSetMutation.isPending
                  ? 'Guardando Sextetos...'
                  : `Confirmar Alineaciones e Iniciar Set ${setNumberToStart}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rápido para que el Juez modifique el número de jugador en la Posición de Cancha */}
      {editingPosition && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400">
                  {editingPosition.teamName}
                </span>
                <h3 className="text-base font-black text-white">
                  Ajustar Jugador en Posición P{editingPosition.posNumber}
                </h3>
              </div>
              <button
                onClick={() => setEditingPosition(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const parsedJersey = Number(directJerseyInput);
                if (!Number.isInteger(parsedJersey) || parsedJersey <= 0) {
                  setErrorBanner('Ingresa un número de dorsal válido (mayor a 0).');
                  return;
                }
                updatePositionByJerseyMutation.mutate({
                  positionNumber: editingPosition.posNumber,
                  jerseyNumber: parsedJersey,
                  teamId: editingPosition.teamId,
                });
              }}
              className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2"
            >
              <label className="block text-[11px] font-black uppercase tracking-wider text-yellow-400">
                Digitar Dorsal Directo (Sustitución en Vivo)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={99}
                  required
                  value={directJerseyInput}
                  onChange={(e) => setDirectJerseyInput(e.target.value)}
                  placeholder="Ej. 8"
                  className="w-28 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-lg font-black text-center text-white focus:border-yellow-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={updatePositionByJerseyMutation.isPending}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-zinc-950 transition"
                >
                  {updatePositionByJerseyMutation.isPending
                    ? 'Aplicando...'
                    : `Asignar #${directJerseyInput || '?'} a P${editingPosition.posNumber}`}
                </button>
              </div>
            </form>

            <p className="text-xs text-zinc-400">
              O selecciona un jugador de la plantilla para la posición P
              {editingPosition.posNumber}:
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {(editingPosition.teamId === activeMatch.homeTeam.id
                ? activeMatch.homeTeam.players ?? []
                : activeMatch.awayTeam.players ?? []
              ).map((p: Player) => {
                const isCurrent = editingPosition.currentPlayer?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      updatePositionMutation.mutate({
                        positionNumber: editingPosition.posNumber,
                        playerId: p.id,
                        teamId: editingPosition.teamId,
                      })
                    }
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                      isCurrent
                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                        : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-xs text-yellow-400">
                        #{p.jerseyNumber}
                      </span>
                      <span className="text-xs font-bold">
                        {p.firstName} {p.lastName}
                      </span>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-black text-yellow-400 uppercase">
                        En Cancha
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setEditingPosition(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

