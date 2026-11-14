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
  onSlotClick?: (teamId: number, posNumber: number, currentPlayer?: Player) => void;
}

interface CourtSlotProps {
  posNumber: number;
  player?: Player;
  isServer: boolean;
  teamColor: 'amber' | 'sky';
  isRotating: boolean;
  className?: string;
  onClick?: () => void;
}

const CourtSlot: React.FC<CourtSlotProps> = ({
  posNumber,
  player,
  isServer,
  teamColor,
  isRotating,
  className = '',
  onClick,
}) => {
  const accentClasses =
    teamColor === 'amber'
      ? 'border-amber-500/40 bg-slate-900/90 text-amber-300'
      : 'border-sky-500/40 bg-slate-900/90 text-sky-300';

  const serverGlow = isServer
    ? 'ring-2 sm:ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.55)] lg:scale-105 bg-amber-500/20 border-amber-300'
    : '';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={`relative flex flex-col items-center justify-center p-2 pt-3 sm:p-2.5 md:p-3 rounded-2xl border transition-all duration-300 ${accentClasses} ${serverGlow} ${
        isRotating ? 'animate-pulse lg:scale-105' : ''
      } ${onClick ? 'cursor-pointer hover:border-yellow-400 hover:shadow-lg' : ''} ${className}`}
    >
      {/* Indicador de Sacador Activo centrado arriba para no tapar P1 ni Editar */}
      {isServer && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-amber-400 text-slate-950 shadow whitespace-nowrap">
          <Volleyball className="w-3 h-3 animate-spin" />
          SAQUE
        </span>
      )}

      {/* Cabecera de celda: Posición y botón Editar */}
      <div className="flex items-center justify-between w-full gap-1 mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          P{posNumber}
        </span>

        {onClick && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-1 sm:px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 whitespace-nowrap">
            ✎ <span className="hidden sm:inline">Editar</span>
          </span>
        )}
      </div>

      {/* Dorsal del Jugador */}
      <div
        className={`w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black text-sm sm:text-base md:text-lg border ${
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
      <span className="mt-1.5 text-[11px] sm:text-xs font-semibold text-white truncate max-w-full text-center px-0.5">
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
  onSlotClick,
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
        {/* MITAD IZQUIERDA / SUPERIOR EN MÓVIL */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-1 px-1">
            <span className="font-extrabold text-sm md:text-base text-white">
              {leftTeam.name}
            </span>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400">
              Fondo (P1-P6-P5) | Red (P2-P3-P4)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Zaguera (Fondo): Fila superior en móvil (P1-P6-P5), Columna izquierda en web (P5-P6-P1) */}
            <div className="space-y-2">
              <div className="text-[10px] text-center uppercase tracking-wider text-slate-400 font-semibold">
                Zona Defensa
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 lg:gap-2.5">
                <CourtSlot
                  posNumber={5}
                  player={leftLineup?.pos5}
                  isServer={false}
                  teamColor={leftColor}
                  isRotating={isLeftRotating}
                  className="order-3 lg:order-1"
                  onClick={onSlotClick ? () => onSlotClick(leftTeam.id, 5, leftLineup?.pos5) : undefined}
                />
                <CourtSlot
                  posNumber={6}
                  player={leftLineup?.pos6}
                  isServer={false}
                  teamColor={leftColor}
                  isRotating={isLeftRotating}
                  className="order-2"
                  onClick={onSlotClick ? () => onSlotClick(leftTeam.id, 6, leftLineup?.pos6) : undefined}
                />
                <CourtSlot
                  posNumber={1}
                  player={leftLineup?.pos1}
                  isServer={isLeftServing}
                  teamColor={leftColor}
                  isRotating={isLeftRotating}
                  className="order-1 lg:order-3"
                  onClick={onSlotClick ? () => onSlotClick(leftTeam.id, 1, leftLineup?.pos1) : undefined}
                />
              </div>
            </div>

            {/* Delantera (Junto a la Red): Fila inferior en móvil (P2-P3-P4), Columna derecha en web (P4-P3-P2) */}
            <div className="space-y-2 border-t-2 lg:border-t-0 lg:border-r-2 border-dashed border-white/20 pt-2.5 lg:pt-0 lg:pr-2">
              <div className="text-[10px] text-center uppercase tracking-wider text-amber-300/80 font-semibold">
                Zona Ataque (3m)
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 lg:gap-2.5">
                <CourtSlot
                  posNumber={4}
                  player={leftLineup?.pos4}
                  isServer={false}
                  teamColor={leftColor}
                  isRotating={isLeftRotating}
                  className="order-3 lg:order-1"
                  onClick={onSlotClick ? () => onSlotClick(leftTeam.id, 4, leftLineup?.pos4) : undefined}
                />
                <CourtSlot
                  posNumber={3}
                  player={leftLineup?.pos3}
                  isServer={false}
                  teamColor={leftColor}
                  isRotating={isLeftRotating}
                  className="order-2"
                  onClick={onSlotClick ? () => onSlotClick(leftTeam.id, 3, leftLineup?.pos3) : undefined}
                />
                <CourtSlot
                  posNumber={2}
                  player={leftLineup?.pos2}
                  isServer={false}
                  teamColor={leftColor}
                  isRotating={isLeftRotating}
                  className="order-1 lg:order-3"
                  onClick={onSlotClick ? () => onSlotClick(leftTeam.id, 2, leftLineup?.pos2) : undefined}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RED CENTRAL DE VOLEIBOL */}
        <div className="lg:col-span-1 flex lg:flex-col items-center justify-center py-2 lg:py-0">
          <div className="w-full lg:w-1.5 h-1.5 lg:h-full bg-gradient-to-r lg:bg-gradient-to-b from-white via-amber-400 to-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] flex items-center justify-center">
            <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-white/40 text-[10px] font-black tracking-widest uppercase text-white">
              RED
            </span>
          </div>
        </div>

        {/* MITAD DERECHA / INFERIOR EN MÓVIL */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-1 px-1">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 order-2 lg:order-1">
              Red (P4-P3-P2) | Fondo (P5-P6-P1)
            </span>
            <span className="font-extrabold text-sm md:text-base text-white order-1 lg:order-2">
              {rightTeam.name}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Delantera (Junto a la Red): Fila superior en móvil (P4-P3-P2), Columna izquierda en web (P2-P3-P4) */}
            <div className="space-y-2 border-b-2 lg:border-b-0 lg:border-l-2 border-dashed border-white/20 pb-2.5 lg:pb-0 lg:pl-2">
              <div className="text-[10px] text-center uppercase tracking-wider text-sky-300/80 font-semibold">
                Zona Ataque (3m)
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 lg:gap-2.5">
                <CourtSlot
                  posNumber={2}
                  player={rightLineup?.pos2}
                  isServer={false}
                  teamColor={rightColor}
                  isRotating={isRightRotating}
                  className="order-3 lg:order-1"
                  onClick={onSlotClick ? () => onSlotClick(rightTeam.id, 2, rightLineup?.pos2) : undefined}
                />
                <CourtSlot
                  posNumber={3}
                  player={rightLineup?.pos3}
                  isServer={false}
                  teamColor={rightColor}
                  isRotating={isRightRotating}
                  className="order-2"
                  onClick={onSlotClick ? () => onSlotClick(rightTeam.id, 3, rightLineup?.pos3) : undefined}
                />
                <CourtSlot
                  posNumber={4}
                  player={rightLineup?.pos4}
                  isServer={false}
                  teamColor={rightColor}
                  isRotating={isRightRotating}
                  className="order-1 lg:order-3"
                  onClick={onSlotClick ? () => onSlotClick(rightTeam.id, 4, rightLineup?.pos4) : undefined}
                />
              </div>
            </div>

            {/* Zaguera (Fondo): Fila inferior en móvil (P5-P6-P1), Columna derecha en web (P1-P6-P5) */}
            <div className="space-y-2">
              <div className="text-[10px] text-center uppercase tracking-wider text-slate-400 font-semibold">
                Zona Defensa
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 lg:gap-2.5">
                <CourtSlot
                  posNumber={1}
                  player={rightLineup?.pos1}
                  isServer={isRightServing}
                  teamColor={rightColor}
                  isRotating={isRightRotating}
                  className="order-3 lg:order-1"
                  onClick={onSlotClick ? () => onSlotClick(rightTeam.id, 1, rightLineup?.pos1) : undefined}
                />
                <CourtSlot
                  posNumber={6}
                  player={rightLineup?.pos6}
                  isServer={false}
                  teamColor={rightColor}
                  isRotating={isRightRotating}
                  className="order-2"
                  onClick={onSlotClick ? () => onSlotClick(rightTeam.id, 6, rightLineup?.pos6) : undefined}
                />
                <CourtSlot
                  posNumber={5}
                  player={rightLineup?.pos5}
                  isServer={false}
                  teamColor={rightColor}
                  isRotating={isRightRotating}
                  className="order-1 lg:order-3"
                  onClick={onSlotClick ? () => onSlotClick(rightTeam.id, 5, rightLineup?.pos5) : undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

