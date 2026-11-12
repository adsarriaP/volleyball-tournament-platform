import React from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckSquare,
  Flag,
  PlusCircle,
  Settings2,
  Zap,
} from 'lucide-react';
import { MatchLivePayload } from '../../../shared/types/volleyball.types';

interface RefereeScoreboardControlProps {
  match: MatchLivePayload;
  isScoring: boolean;
  isMutatingState?: boolean;
  onScorePoint: (scoringTeamId: number) => void;
  onOpenLineupModal: () => void;
  onToggleSwapSides: () => void;
  onFinishSet: () => void;
  onEnableThirdSet: () => void;
  onFinishMatch: () => void;
}

export const RefereeScoreboardControl: React.FC<
  RefereeScoreboardControlProps
> = ({
  match,
  isScoring,
  isMutatingState = false,
  onScorePoint,
  onOpenLineupModal,
  onToggleSwapSides,
  onFinishSet,
  onEnableThirdSet,
  onFinishMatch,
}) => {
  const { homeTeam, awayTeam, currentSet, tournament, status } = match;
  const maxSets = tournament?.maxSets ?? 3;
  const isTieBreak = currentSet?.setNumber === maxSets;
  const targetPoints = isTieBreak
    ? (tournament?.pointsFinalSet ?? 15)
    : (tournament?.pointsRegularSet ?? 25);
  const minDiff = tournament?.pointsDifference ?? 2;

  const homeScore = currentSet?.homeScore ?? 0;
  const awayScore = currentSet?.awayScore ?? 0;

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
    !isScoring;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-4 md:p-6 shadow-xl space-y-4">
      {/* Barra superior de utilidades del Juez */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Consola Táctil del Juez • Meta del Set: {targetPoints} pts (dif.{' '}
            {minDiff})
          </span>
          {(isHomeAtSetPoint || isAwayAtSetPoint) && status !== 'FINISHED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 border border-rose-500/40 text-rose-300 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              PUNTO DE SET / PARTIDO ({isHomeAtSetPoint ? homeTeam.name : awayTeam.name})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSwapSides}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Cambiar Lado de Cancha
          </button>

          <button
            type="button"
            onClick={onOpenLineupModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
          >
            <Settings2 className="w-4 h-4" />
            {hasLineupsConfigured
              ? `Configurar / Iniciar Set`
              : `Registrar Sexteto Inicial (Set ${currentSet?.setNumber ?? 1})`}
          </button>
        </div>
      </div>

      {/* Botones Táctiles de Gran Tamaño (+1 Punto por Equipo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          disabled={!canScore}
          onClick={() => onScorePoint(homeTeam.id)}
          className="group relative flex items-center justify-between p-5 md:p-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black shadow-lg shadow-amber-500/20 active:scale-[0.98] transition"
        >
          <div className="text-left">
            <span className="block text-xs uppercase tracking-widest opacity-80">
              Anotar Rally Local
            </span>
            <span className="text-xl md:text-2xl font-black">
              +1 PTO {homeTeam.name}
            </span>
          </div>
          <PlusCircle className="w-10 h-10 md:w-12 md:h-12 group-hover:scale-110 transition" />
        </button>

        <button
          type="button"
          disabled={!canScore}
          onClick={() => onScorePoint(awayTeam.id)}
          className="group relative flex items-center justify-between p-5 md:p-6 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black shadow-lg shadow-sky-500/20 active:scale-[0.98] transition"
        >
          <div className="text-left">
            <span className="block text-xs uppercase tracking-widest opacity-80">
              Anotar Rally Visitante
            </span>
            <span className="text-xl md:text-2xl font-black">
              +1 PTO {awayTeam.name}
            </span>
          </div>
          <PlusCircle className="w-10 h-10 md:w-12 md:h-12 group-hover:scale-110 transition" />
        </button>
      </div>

      {!hasLineupsConfigured && status !== 'FINISHED' && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center font-medium">
          Para habilitar los botones de puntuación (+1), primero confirma las 6
          posiciones iniciales en cancha pulsando{' '}
          <strong>"Registrar Sexteto Inicial"</strong>.
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
            onClick={() => {
              if (
                window.confirm(
                  `¿Confirmas finalizar manualmente el Set ${currentSet?.setNumber ?? 1}?`,
                )
              ) {
                onFinishSet();
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-black bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <CheckSquare className="w-4 h-4 shrink-0" />
            Finalizar Set Actual
          </button>

          <button
            type="button"
            disabled={isMutatingState || (currentSet?.setNumber ?? 1) >= maxSets}
            onClick={onEnableThirdSet}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-black bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Zap className="w-4 h-4 shrink-0" />
            Habilitar {maxSets}er Set (Desempate)
          </button>

          <button
            type="button"
            disabled={isMutatingState}
            onClick={() => {
              if (
                window.confirm(
                  '¿Confirmas dar por terminado el partido oficialmente ahora?',
                )
              ) {
                onFinishMatch();
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-black bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Flag className="w-4 h-4 shrink-0" />
            Dar por Terminado el Partido
          </button>
        </div>
      )}
    </div>
  );
};

