import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckSquare,
  Edit3,
  Flag,
  MinusCircle,
  PlusCircle,
  Settings2,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { MatchLivePayload } from '../../../shared/types/volleyball.types';

interface RefereeScoreboardControlProps {
  match: MatchLivePayload;
  isScoring: boolean;
  isMutatingState?: boolean;
  onScorePoint: (scoringTeamId: number) => void;
  onAdjustScore: (
    homeScore: number,
    awayScore: number,
    servingTeamId?: number,
  ) => void;
  onOpenLineupModal: () => void;
  onToggleSwapSides: () => void;
  onFinishSet: (winnerTeamId?: number | null) => void;
  onStartNextSet: (nextSetNumber: number) => void;
  onFinishMatch: (winnerTeamId?: number | null) => void;
}

export const RefereeScoreboardControl: React.FC<
  RefereeScoreboardControlProps
> = ({
  match,
  isScoring,
  isMutatingState = false,
  onScorePoint,
  onAdjustScore,
  onOpenLineupModal,
  onToggleSwapSides,
  onFinishSet,
  onStartNextSet,
  onFinishMatch,
}) => {
  const { homeTeam, awayTeam, currentSet, tournament, status } = match;

  const [isEditScoreModalOpen, setIsEditScoreModalOpen] = useState(false);
  const [manualHomeScore, setManualHomeScore] = useState(0);
  const [manualAwayScore, setManualAwayScore] = useState(0);
  const [manualServingTeamId, setManualServingTeamId] = useState<number | null>(
    null,
  );

  const [isFinishSetModalOpen, setIsFinishSetModalOpen] = useState(false);
  const [finishSetWinner, setFinishSetWinner] = useState<
    'AUTO' | 'HOME' | 'AWAY' | 'TIE'
  >('AUTO');

  const [isFinishMatchModalOpen, setIsFinishMatchModalOpen] = useState(false);
  const [finishMatchWinner, setFinishMatchWinner] = useState<
    'AUTO' | 'HOME' | 'AWAY' | 'TIE'
  >('AUTO');

  const maxExistingSet = Math.max(
    currentSet?.setNumber ?? 0,
    ...(match.setsHistory?.map((s) => s.setNumber) ?? [0]),
  );
  const nextSetNumber = maxExistingSet + 1;
  const targetPoints = tournament?.pointsRegularSet ?? 25;
  const minDiff = tournament?.pointsDifference ?? 2;

  const homeScore = currentSet?.homeScore ?? 0;
  const awayScore = currentSet?.awayScore ?? 0;
  const homeSetsWon = match.homeSetsWon ?? 0;
  const awaySetsWon = match.awaySetsWon ?? 0;

  // Cálculo de puntos acumulados de todos los sets para asistencia arbitral
  const totalHomePoints =
    (match.setsHistory ?? []).reduce((acc, s) => acc + s.homeScore, 0) +
    (currentSet && currentSet.status !== 'COMPLETED' ? currentSet.homeScore : 0);
  const totalAwayPoints =
    (match.setsHistory ?? []).reduce((acc, s) => acc + s.awayScore, 0) +
    (currentSet && currentSet.status !== 'COMPLETED' ? currentSet.awayScore : 0);
  const pointDifference = totalHomePoints - totalAwayPoints;

  // Detectar si estamos en Set Ball / Match Ball
  const isHomeAtSetPoint =
    homeScore >= targetPoints - 1 && homeScore - awayScore >= minDiff - 1;
  const isAwayAtSetPoint =
    awayScore >= targetPoints - 1 && awayScore - homeScore >= minDiff - 1;

  const hasLineupsConfigured = Boolean(
    currentSet?.homeLineup && currentSet?.awayLineup,
  );
  const canScore =
    status !== 'FINISHED' &&
    currentSet?.status === 'IN_PROGRESS' &&
    hasLineupsConfigured &&
    !isScoring &&
    !isMutatingState;

  const handleOpenEditScore = () => {
    setManualHomeScore(homeScore);
    setManualAwayScore(awayScore);
    setManualServingTeamId(currentSet?.servingTeamId ?? homeTeam.id);
    setIsEditScoreModalOpen(true);
  };

  const handleSaveAdjustScore = (e: React.FormEvent) => {
    e.preventDefault();
    onAdjustScore(
      Math.max(0, Number(manualHomeScore) || 0),
      Math.max(0, Number(manualAwayScore) || 0),
      manualServingTeamId ?? undefined,
    );
    setIsEditScoreModalOpen(false);
  };

  const handleOpenFinishMatch = () => {
    if (homeSetsWon === awaySetsWon) {
      setFinishMatchWinner('TIE');
    } else if (homeSetsWon > awaySetsWon) {
      setFinishMatchWinner('HOME');
    } else {
      setFinishMatchWinner('AWAY');
    }
    setIsFinishMatchModalOpen(true);
  };

  const handleConfirmFinishMatch = () => {
    let chosenWinner: number | null | undefined = undefined;
    if (finishMatchWinner === 'TIE') {
      chosenWinner = null;
    } else if (finishMatchWinner === 'HOME') {
      chosenWinner = homeTeam.id;
    } else if (finishMatchWinner === 'AWAY') {
      chosenWinner = awayTeam.id;
    }
    onFinishMatch(chosenWinner);
    setIsFinishMatchModalOpen(false);
  };

  const handleOpenFinishSet = () => {
    if (homeScore === awayScore) {
      setFinishSetWinner('TIE');
    } else if (homeScore > awayScore) {
      setFinishSetWinner('HOME');
    } else {
      setFinishSetWinner('AWAY');
    }
    setIsFinishSetModalOpen(true);
  };

  const handleConfirmFinishSet = () => {
    let chosenWinner: number | null | undefined = undefined;
    if (finishSetWinner === 'TIE') {
      chosenWinner = null;
    } else if (finishSetWinner === 'HOME') {
      chosenWinner = homeTeam.id;
    } else if (finishSetWinner === 'AWAY') {
      chosenWinner = awayTeam.id;
    }
    onFinishSet(chosenWinner);
    setIsFinishSetModalOpen(false);
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-4 md:p-6 shadow-xl space-y-4">
      {/* Barra superior de utilidades del Juez */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Consola Táctil • Meta: {targetPoints} pts (dif. {minDiff})
          </span>
          {(isHomeAtSetPoint || isAwayAtSetPoint) && status !== 'FINISHED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 border border-rose-500/40 text-rose-300 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              PUNTO DE SET / PARTIDO (
              {isHomeAtSetPoint ? homeTeam.name : awayTeam.name})
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {status !== 'FINISHED' && currentSet && (
            <button
              type="button"
              onClick={handleOpenEditScore}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-yellow-400 border border-zinc-700 transition"
              title="Corregir manualmente el marcador del set actual"
            >
              <Edit3 className="w-4 h-4" />
              <span>Corregir Marcador</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleSwapSides}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span className="hidden sm:inline">Cambiar Lado</span>
          </button>

          <button
            type="button"
            onClick={onOpenLineupModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
          >
            <Settings2 className="w-4 h-4" />
            {hasLineupsConfigured
              ? `Saque Set ${currentSet?.setNumber ?? 1}`
              : `Iniciar Set ${currentSet?.setNumber ?? 1}`}
          </button>
        </div>
      </div>

      {/* Botones Táctiles (+1 Punto y -1 Corrección por Equipo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lado Local */}
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            disabled={!canScore}
            onClick={() => onScorePoint(homeTeam.id)}
            className="flex-1 group relative flex items-center justify-between p-4 md:p-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black shadow-lg shadow-amber-500/20 active:scale-[0.98] transition"
          >
            <div className="text-left">
              <span className="block text-[11px] uppercase tracking-widest opacity-80">
                Anotar Rally Local
              </span>
              <span className="text-lg md:text-xl font-black truncate max-w-[200px] block">
                +1 PTO {homeTeam.name}
              </span>
            </div>
            <PlusCircle className="w-8 h-8 md:w-10 md:h-10 group-hover:scale-110 transition shrink-0" />
          </button>

          <button
            type="button"
            disabled={
              status === 'FINISHED' ||
              currentSet?.status !== 'IN_PROGRESS' ||
              homeScore <= 0 ||
              isMutatingState
            }
            onClick={() =>
              onAdjustScore(
                Math.max(0, homeScore - 1),
                awayScore,
                currentSet?.servingTeamId ?? undefined,
              )
            }
            title={`Restar 1 punto a ${homeTeam.name} por error`}
            className="px-3 md:px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed border border-amber-500/30 text-amber-300 font-black flex flex-col items-center justify-center gap-1 transition"
          >
            <MinusCircle className="w-5 h-5 shrink-0" />
            <span className="text-[10px] uppercase font-bold tracking-wider">
              -1
            </span>
          </button>
        </div>

        {/* Lado Visitante */}
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            disabled={!canScore}
            onClick={() => onScorePoint(awayTeam.id)}
            className="flex-1 group relative flex items-center justify-between p-4 md:p-5 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black shadow-lg shadow-sky-500/20 active:scale-[0.98] transition"
          >
            <div className="text-left">
              <span className="block text-[11px] uppercase tracking-widest opacity-80">
                Anotar Rally Visitante
              </span>
              <span className="text-lg md:text-xl font-black truncate max-w-[200px] block">
                +1 PTO {awayTeam.name}
              </span>
            </div>
            <PlusCircle className="w-8 h-8 md:w-10 md:h-10 group-hover:scale-110 transition shrink-0" />
          </button>

          <button
            type="button"
            disabled={
              status === 'FINISHED' ||
              currentSet?.status !== 'IN_PROGRESS' ||
              awayScore <= 0 ||
              isMutatingState
            }
            onClick={() =>
              onAdjustScore(
                homeScore,
                Math.max(0, awayScore - 1),
                currentSet?.servingTeamId ?? undefined,
              )
            }
            title={`Restar 1 punto a ${awayTeam.name} por error`}
            className="px-3 md:px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed border border-sky-500/30 text-sky-300 font-black flex flex-col items-center justify-center gap-1 transition"
          >
            <MinusCircle className="w-5 h-5 shrink-0" />
            <span className="text-[10px] uppercase font-bold tracking-wider">
              -1
            </span>
          </button>
        </div>
      </div>

      {!hasLineupsConfigured && status !== 'FINISHED' && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center font-medium">
          Para habilitar los botones de puntuación (+1), primero inicia el set
          eligiendo quién saca en{' '}
          <strong>"Iniciar Set {currentSet?.setNumber ?? 1}"</strong>.
        </div>
      )}

      {/* Botones táctiles de control de Set y Partido */}
      {status !== 'FINISHED' && (
        <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            disabled={
              isMutatingState || currentSet?.status !== 'IN_PROGRESS'
            }
            onClick={handleOpenFinishSet}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-black bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <CheckSquare className="w-4 h-4 shrink-0" />
            Finalizar Set {currentSet?.setNumber ?? 1}
          </button>

          <button
            type="button"
            disabled={isMutatingState || currentSet?.status === 'IN_PROGRESS'}
            onClick={() => onStartNextSet(nextSetNumber)}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-black bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Zap className="w-4 h-4 shrink-0" />
            Iniciar Set {nextSetNumber}
          </button>

          <button
            type="button"
            disabled={isMutatingState}
            onClick={handleOpenFinishMatch}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-black bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Flag className="w-4 h-4 shrink-0" />
            Dar por Terminado el Partido
          </button>
        </div>
      )}

      {/* Modal: Corrección Manual del Marcador */}
      {isEditScoreModalOpen && currentSet && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsEditScoreModalOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveAdjustScore}
            className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-yellow-400" />
                <h3 className="text-base font-black text-white">
                  Corregir Marcador • Set {currentSet.setNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditScoreModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Modifica los puntos exactos de cada equipo o corrige el saque en
              caso de una anotación errónea.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-900 border border-amber-500/30">
                <label className="block text-[11px] font-black uppercase tracking-wider text-amber-400 truncate">
                  {homeTeam.name}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  required
                  value={manualHomeScore}
                  onChange={(e) => setManualHomeScore(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-2xl font-black text-center text-white bg-zinc-950 border border-zinc-800 rounded-xl focus:border-yellow-400 outline-none"
                />
              </div>

              <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-900 border border-sky-500/30">
                <label className="block text-[11px] font-black uppercase tracking-wider text-sky-400 truncate">
                  {awayTeam.name}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  required
                  value={manualAwayScore}
                  onChange={(e) => setManualAwayScore(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-2xl font-black text-center text-white bg-zinc-950 border border-zinc-800 rounded-xl focus:border-yellow-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-400 mb-2">
                Equipo al Saque
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setManualServingTeamId(homeTeam.id)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                    manualServingTeamId === homeTeam.id
                      ? 'bg-yellow-400 text-zinc-950 border-yellow-400 shadow-sm'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  Saque: {homeTeam.name}
                </button>
                <button
                  type="button"
                  onClick={() => setManualServingTeamId(awayTeam.id)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                    manualServingTeamId === awayTeam.id
                      ? 'bg-yellow-400 text-zinc-950 border-yellow-400 shadow-sm'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  Saque: {awayTeam.name}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsEditScoreModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-zinc-950 transition"
              >
                Guardar Corrección
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Finalizar Set (Sin bloqueo por empate) */}
      {isFinishSetModalOpen && currentSet && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsFinishSetModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  Finalizar Set {currentSet.setNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFinishSetModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
              <span className="text-[11px] font-bold text-zinc-400 block uppercase">
                Marcador del Set
              </span>
              <span className="text-2xl font-black text-white mt-1 block">
                {homeTeam.name} ({homeScore}) - ({awayScore}) {awayTeam.name}
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-400">
                Resultado / Ganador del Set
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <input
                    type="radio"
                    name="finishSetWinner"
                    checked={finishSetWinner === 'HOME'}
                    onChange={() => setFinishSetWinner('HOME')}
                    className="accent-yellow-400"
                  />
                  <span className="text-xs font-bold text-white">
                    Ganador: {homeTeam.name}
                  </span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <input
                    type="radio"
                    name="finishSetWinner"
                    checked={finishSetWinner === 'AWAY'}
                    onChange={() => setFinishSetWinner('AWAY')}
                    className="accent-yellow-400"
                  />
                  <span className="text-xs font-bold text-white">
                    Ganador: {awayTeam.name}
                  </span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <input
                    type="radio"
                    name="finishSetWinner"
                    checked={finishSetWinner === 'TIE'}
                    onChange={() => setFinishSetWinner('TIE')}
                    className="accent-yellow-400"
                  />
                  <span className="text-xs font-bold text-zinc-300">
                    Set Empatado (Sin ganador asignado)
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsFinishSetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isMutatingState}
                onClick={handleConfirmFinishSet}
                className="px-4 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-zinc-950 transition"
              >
                {isMutatingState ? 'Cerrando...' : 'Confirmar y Finalizar Set'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dar por Terminado el Partido (Sin bloqueo por empate) */}
      {isFinishMatchModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsFinishMatchModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-black text-white">
                  Dar por Terminado el Partido
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFinishMatchModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
              <span className="text-[11px] font-bold text-zinc-400 block uppercase">
                Resultado Global en Sets
              </span>
              <span className="text-2xl font-black text-white mt-1 block">
                {homeTeam.name} ({homeSetsWon}) - ({awaySetsWon}){' '}
                {awayTeam.name}
              </span>
            </div>

            {homeSetsWon === awaySetsWon && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1 text-amber-300 font-bold border-b border-amber-500/20 pb-2">
                  <span>Puntos Acumulados:</span>
                  <span className="font-mono text-xs sm:text-sm bg-zinc-950 px-2 py-0.5 rounded-lg border border-amber-400/30">
                    {homeTeam.name}: {totalHomePoints} vs {awayTeam.name}: {totalAwayPoints}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Diferencia de puntos:{' '}
                  <strong className="text-yellow-400 font-black">
                    {pointDifference > 0
                      ? `+${pointDifference} a favor de ${homeTeam.name}`
                      : pointDifference < 0
                        ? `+${Math.abs(pointDifference)} a favor de ${awayTeam.name}`
                        : '0 (Empate exacto en puntos)'}
                  </strong>
                  . Si el torneo define desempate por puntos en partidos de 2 sets, puedes seleccionar al ganador con mayor puntuación, o registrar empate oficial.
                </p>
                <p className="text-[10px] text-zinc-400">
                  Tú como juez tienes la decisión final y absoluta. Si prefieren jugar set de desempate, cancela y presiona <strong className="text-white">"Iniciar Set {nextSetNumber}"</strong>.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-400">
                Resolución Final
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <input
                    type="radio"
                    name="finishMatchWinner"
                    checked={finishMatchWinner === 'TIE'}
                    onChange={() => setFinishMatchWinner('TIE')}
                    className="accent-yellow-400"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-white block">
                      Empate Oficial ({homeSetsWon} - {awaySetsWon})
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Sin equipo ganador asignado
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <input
                    type="radio"
                    name="finishMatchWinner"
                    checked={finishMatchWinner === 'HOME'}
                    onChange={() => setFinishMatchWinner('HOME')}
                    className="accent-yellow-400"
                  />
                  <span className="text-xs font-bold text-white">
                    Ganador: {homeTeam.name}
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <input
                    type="radio"
                    name="finishMatchWinner"
                    checked={finishMatchWinner === 'AWAY'}
                    onChange={() => setFinishMatchWinner('AWAY')}
                    className="accent-yellow-400"
                  />
                  <span className="text-xs font-bold text-white">
                    Ganador: {awayTeam.name}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsFinishMatchModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isMutatingState}
                onClick={handleConfirmFinishMatch}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-500 hover:bg-rose-400 text-white transition"
              >
                {isMutatingState ? 'Finalizando...' : 'Terminar Partido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
