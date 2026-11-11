import React from 'react';
import { CircleDot as Volleyball, RotateCw } from 'lucide-react';
import { LineupPositions, Player, Team } from '../../../shared/types/volleyball.types';

interface VolleyballCourtProps {
  homeTeam: Team;
  awayTeam: Team;
  homeLineup?: LineupPositions;
  awayLineup?: LineupPositions;
  servingTeamId?: number;
  lastRotatedTeamId?: number | null;
  isSidesSwapped?: boolean;
}

interface CourtSlotProps {
  posNumber: number;
  player?: Player;
  isServer: boolean;
  teamColor: 'amber' | 'sky';
  isRotating: boolean;
}

const CourtSlot: React.FC<CourtSlotProps> = ({
  posNumber,
  player,
  isServer,
  teamColor,
  isRotating,
}) => {
  const accentClasses =
    teamColor === 'amber'
      ? 'border-amber-500/40 bg-slate-900/90 text-amber-300'
      : 'border-sky-500/40 bg-slate-900/90 text-sky-300';

  const serverGlow = isServer
    ? 'ring-4 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.65)] scale-105 bg-amber-500/20 border-amber-300'
    : '';

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-2.5 md:p-3 rounded-2xl border transition-all duration-500 ${accentClasses} ${serverGlow} ${
        isRotating ? 'animate-pulse scale-105' : ''
      }`}
    >
      {/* Etiqueta de Posición Reglamentaria (1 a 6) */}
      <span className="absolute top-1.5 left-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        P{posNumber}
      </span>

      {/* Indicador de Sacador Activo en P1 */}
      {isServer && (
        <span className="absolute -top-2.5 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow">
          <Volleyball className="w-3 h-3 animate-spin" />
          SAQUE
        </span>
      )}

      {/* Dorsal del Jugador */}
      <div
        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black text-base md:text-lg border ${
          isServer
            ? 'bg-amber-400 text-slate-950 border-white'
            : teamColor === 'amber'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
        }`}
      >
        #{player?.jerseyNumber ?? posNumber}
      </div>

      {/* Nombre del Jugador */}
      <span className="mt-1.5 text-xs font-semibold text-white truncate max-w-[95px] text-center">
        {player ? `${player.firstName} ${player.lastName.charAt(0)}.` : `Posición ${posNumber}`}
      </span>
    </div>
  );
};

/**
 * Componente interactivo `VolleyballCourt.tsx`
 * Renderiza la cancha 2D dividida por la red central con las 6 posiciones reglamentarias
 * por equipo y las rotaciones en sentido horario:
 *   1 -> 6 -> 5 -> 4 -> 3 -> 2 -> 1
 */
export const VolleyballCourt: React.FC<VolleyballCourtProps> = ({
  homeTeam,
  awayTeam,
  homeLineup,
  awayLineup,
  servingTeamId,
  lastRotatedTeamId,
  isSidesSwapped = false,
}) => {
  const leftTeam = isSidesSwapped ? awayTeam : homeTeam;
  const rightTeam = isSidesSwapped ? homeTeam : awayTeam;
  const leftLineup = isSidesSwapped ? awayLineup : homeLineup;
  const rightLineup = isSidesSwapped ? homeLineup : awayLineup;
  const leftColor: 'amber' | 'sky' = isSidesSwapped ? 'sky' : 'amber';
  const rightColor: 'amber' | 'sky' = isSidesSwapped ? 'amber' : 'sky';

  const isLeftServing = servingTeamId === leftTeam.id;
  const isRightServing = servingTeamId === rightTeam.id;
  const isLeftRotating = lastRotatedTeamId === leftTeam.id;
  const isRightRotating = lastRotatedTeamId === rightTeam.id;

  return (
    <div className="rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-950/60 via-slate-900 to-emerald-950/60 p-4 md:p-6 shadow-2xl">
      {/* Leyenda Superior de Cancha y Regla de Rotación */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
            <RotateCw className="w-4 h-4" />
            Rotación Reglamentaria Horaria: P1 → P6 → P5 → P4 → P3 → P2 → P1
          </span>
        </div>

        {(isLeftRotating || isRightRotating) && (
          <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-bold animate-bounce">
            ¡Recuperación de saque y rotación aplicada a{' '}
            {isLeftRotating ? leftTeam.name : rightTeam.name}!
          </div>
        )}
      </div>

      {/* Superficie 2D de la Cancha */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-stretch bg-emerald-900/20 border-2 border-white/20 rounded-2xl p-3 md:p-5 relative">
        {/* MITAD IZQUIERDA (Columnas Fondo: P5, P6, P1 | Frente a Red: P4, P3, P2) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-extrabold text-sm md:text-base text-white">
              {leftTeam.name}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-slate-400">
              Fondo (P5-P6-P1) | Red (P4-P3-P2)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Columna Zaguera (Fondo): P5 arriba, P6 centro, P1 abajo (Sacador) */}
            <div className="space-y-2.5">
              <div className="text-[10px] text-center uppercase tracking-wider text-slate-400 font-semibold">
                Zona Defensa
              </div>
              <CourtSlot
                posNumber={5}
                player={leftLineup?.pos5}
                isServer={false}
                teamColor={leftColor}
                isRotating={isLeftRotating}
              />
              <CourtSlot
                posNumber={6}
                player={leftLineup?.pos6}
                isServer={false}
                teamColor={leftColor}
                isRotating={isLeftRotating}
              />
              <CourtSlot
                posNumber={1}
                player={leftLineup?.pos1}
                isServer={isLeftServing}
                teamColor={leftColor}
                isRotating={isLeftRotating}
              />
            </div>

            {/* Columna Delantera (Junto a la Red): P4 arriba, P3 centro, P2 abajo */}
            <div className="space-y-2.5 border-r-2 border-dashed border-white/20 pr-2">
              <div className="text-[10px] text-center uppercase tracking-wider text-amber-300/80 font-semibold">
                Zona Ataque (3m)
              </div>
              <CourtSlot
                posNumber={4}
                player={leftLineup?.pos4}
                isServer={false}
                teamColor={leftColor}
                isRotating={isLeftRotating}
              />
              <CourtSlot
                posNumber={3}
                player={leftLineup?.pos3}
                isServer={false}
                teamColor={leftColor}
                isRotating={isLeftRotating}
              />
              <CourtSlot
                posNumber={2}
                player={leftLineup?.pos2}
                isServer={false}
                teamColor={leftColor}
                isRotating={isLeftRotating}
              />
            </div>
          </div>
        </div>

        {/* RED CENTRAL DE VOLEIBOL */}
        <div className="lg:col-span-1 flex lg:flex-col items-center justify-center py-2 lg:py-0">
          <div className="w-full lg:w-1.5 h-1.5 lg:h-full bg-gradient-to-b from-white via-amber-400 to-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] flex items-center justify-center">
            <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-white/40 text-[10px] font-black tracking-widest uppercase text-white">
              RED
            </span>
          </div>
        </div>

        {/* MITAD DERECHA (Espejo frente a la red: Ataque P2, P3, P4 | Fondo P1, P6, P5) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">
              Red (P2-P3-P4) | Fondo (P1-P6-P5)
            </span>
            <span className="font-extrabold text-sm md:text-base text-white">
              {rightTeam.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Columna Delantera (Junto a la Red): P2 arriba, P3 centro, P4 abajo */}
            <div className="space-y-2.5 border-l-2 border-dashed border-white/20 pl-2">
              <div className="text-[10px] text-center uppercase tracking-wider text-sky-300/80 font-semibold">
                Zona Ataque (3m)
              </div>
              <CourtSlot
                posNumber={2}
                player={rightLineup?.pos2}
                isServer={false}
                teamColor={rightColor}
                isRotating={isRightRotating}
              />
              <CourtSlot
                posNumber={3}
                player={rightLineup?.pos3}
                isServer={false}
                teamColor={rightColor}
                isRotating={isRightRotating}
              />
              <CourtSlot
                posNumber={4}
                player={rightLineup?.pos4}
                isServer={false}
                teamColor={rightColor}
                isRotating={isRightRotating}
              />
            </div>

            {/* Columna Zaguera (Fondo): P1 arriba (Sacador), P6 centro, P5 abajo */}
            <div className="space-y-2.5">
              <div className="text-[10px] text-center uppercase tracking-wider text-slate-400 font-semibold">
                Zona Defensa
              </div>
              <CourtSlot
                posNumber={1}
                player={rightLineup?.pos1}
                isServer={isRightServing}
                teamColor={rightColor}
                isRotating={isRightRotating}
              />
              <CourtSlot
                posNumber={6}
                player={rightLineup?.pos6}
                isServer={false}
                teamColor={rightColor}
                isRotating={isRightRotating}
              />
              <CourtSlot
                posNumber={5}
                player={rightLineup?.pos5}
                isServer={false}
                teamColor={rightColor}
                isRotating={isRightRotating}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

