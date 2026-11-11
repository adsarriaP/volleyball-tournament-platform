import React from 'react';
import {
  CircleDot as Volleyball,
  ExternalLink,
  MapPin,
  Radio,
  Trophy,
} from 'lucide-react';
import { resolveTeamLogoUrl } from '../api/httpClient';
import { MatchLivePayload } from '../types/volleyball.types';

interface LiveScoreBannerProps {
  match: MatchLivePayload;
  isConnected?: boolean;
}

export const LiveScoreBanner: React.FC<LiveScoreBannerProps> = ({
  match,
  isConnected = false,
}) => {
  const { homeTeam, awayTeam, homeSetsWon, awaySetsWon, currentSet, status } =
    match;
  const isHomeServing = currentSet?.servingTeamId === homeTeam.id;
  const isAwayServing = currentSet?.servingTeamId === awayTeam.id;

  const homeLogo = resolveTeamLogoUrl(homeTeam.logoUrl);
  const awayLogo = resolveTeamLogoUrl(awayTeam.logoUrl);

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 md:p-6 shadow-2xl">
      {/* Cabecera de Estado, Cancha y Google Maps */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-950 text-yellow-400 border border-zinc-800">
            {match.tournament?.name ?? 'Torneo Oficial'} •{' '}
            {match.phase?.name ?? 'Partido'}
          </span>
          {match.courtNumber && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-950 text-white border border-zinc-800">
              <MapPin className="w-3.5 h-3.5 text-yellow-400" />
              {match.courtNumber}
            </span>
          )}
          {match.courtMapUrl && (
            <a
              href={match.courtMapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-yellow-400 text-zinc-950 hover:bg-yellow-300 transition"
            >
              📍 Ver en Google Maps
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === 'IN_PROGRESS' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-yellow-400 text-zinc-950 animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              EN VIVO • SET {currentSet?.setNumber ?? 1}
            </span>
          )}
          {status === 'FINISHED' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-zinc-950 text-yellow-400 border border-yellow-400/50">
              <Trophy className="w-3.5 h-3.5" />
              FINALIZADO
            </span>
          )}
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              isConnected
                ? 'bg-zinc-950 text-yellow-400 border border-zinc-700'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {isConnected ? '● Socket Live' : 'Sincronizado'}
          </span>
        </div>
      </div>

      {/* Marcador Principal Estilo SofaScore */}
      <div className="grid grid-cols-3 items-center gap-3 py-5">
        {/* Equipo Local */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center overflow-hidden text-xs font-black text-yellow-400 shrink-0">
              {homeLogo ? (
                <img
                  src={homeLogo}
                  alt={homeTeam.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                homeTeam.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg md:text-2xl font-black text-white tracking-tight">
                  {homeTeam.name}
                </span>
                {isHomeServing && status === 'IN_PROGRESS' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-yellow-400 text-zinc-950 animate-bounce">
                    <Volleyball className="w-3.5 h-3.5" />
                    SAQUE
                  </span>
                )}
              </div>
              {homeTeam.delegateName && (
                <span className="block text-[11px] text-zinc-400">
                  Delegado: {homeTeam.delegateName}
                </span>
              )}
              <span className="text-xs text-zinc-400">
                Sets ganados:{' '}
                <strong className="text-yellow-400 text-sm">
                  {homeSetsWon}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Puntos del Set Actual */}
        <div className="flex items-center justify-center gap-3 md:gap-6">
          <div className="min-w-[68px] md:min-w-[88px] text-center py-2 px-3 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-inner">
            <span className="text-3xl md:text-5xl font-black text-yellow-400 tabular-nums">
              {currentSet?.homeScore ?? 0}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] uppercase tracking-widest text-zinc-400 font-black">
              SET {currentSet?.setNumber ?? 1}
            </span>
            <span className="text-lg font-bold text-zinc-600">:</span>
            <span className="text-xs font-black text-white">
              ({homeSetsWon} - {awaySetsWon})
            </span>
          </div>

          <div className="min-w-[68px] md:min-w-[88px] text-center py-2 px-3 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-inner">
            <span className="text-3xl md:text-5xl font-black text-white tabular-nums">
              {currentSet?.awayScore ?? 0}
            </span>
          </div>
        </div>

        {/* Equipo Visitante */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center justify-end gap-2">
                {isAwayServing && status === 'IN_PROGRESS' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-yellow-400 text-zinc-950 animate-bounce">
                    <Volleyball className="w-3.5 h-3.5" />
                    SAQUE
                  </span>
                )}
                <span className="text-lg md:text-2xl font-black text-white tracking-tight">
                  {awayTeam.name}
                </span>
              </div>
              {awayTeam.delegateName && (
                <span className="block text-[11px] text-zinc-400">
                  Delegado: {awayTeam.delegateName}
                </span>
              )}
              <span className="text-xs text-zinc-400">
                Sets ganados:{' '}
                <strong className="text-yellow-400 text-sm">
                  {awaySetsWon}
                </strong>
              </span>
            </div>
            <div className="w-11 h-11 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center overflow-hidden text-xs font-black text-yellow-400 shrink-0">
              {awayLogo ? (
                <img
                  src={awayLogo}
                  alt={awayTeam.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                awayTeam.name.slice(0, 2).toUpperCase()
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Parciales por Set */}
      {match.setsHistory && match.setsHistory.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-zinc-800">
          {match.setsHistory.map((s) => (
            <div
              key={s.id || s.setNumber}
              className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                s.status === 'IN_PROGRESS'
                  ? 'bg-yellow-400 text-zinc-950 border-yellow-400'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300'
              }`}
            >
              Set {s.setNumber}: {s.homeScore} - {s.awayScore}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
