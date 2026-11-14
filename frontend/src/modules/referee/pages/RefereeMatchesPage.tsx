import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  ClipboardCheck,
  ExternalLink,
  MapPin,
  Play,
} from 'lucide-react';
import {
  apiFetch,
  normalizeExternalUrl,
} from '../../../shared/api/httpClient';
import { MatchSummary } from '../../../shared/types/volleyball.types';

export const RefereeMatchesPage: React.FC = () => {
  const {
    data: matches,
    isLoading,
    error,
  } = useQuery<MatchSummary[]>({
    queryKey: ['referee-assigned-matches'],
    queryFn: () => apiFetch<MatchSummary[]>('/matches/my-assigned'),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5">
            <ClipboardCheck className="w-7 h-7 text-emerald-400" />
            Mis Partidos Asignados (Consola de Juez)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Selecciona el partido programado o en juego para abrir la planilla
            táctil y controlar las rotaciones en vivo.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/50 text-center text-slate-400">
          Cargando tus partidos asignados...
        </div>
      )}

      {error && (
        <div className="p-6 rounded-2xl border border-rose-500/40 bg-rose-950/30 text-rose-300 text-sm">
          {(error as Error).message}
        </div>
      )}

      {!isLoading && matches && matches.length === 0 && (
        <div className="p-10 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-2">
          <p className="text-base font-bold text-white">
            No tienes partidos pendientes ni en curso asignados en este momento.
          </p>
          <p className="text-xs text-slate-400">
            El Administrador debe asignarte como juez en la programación de
            cruces del torneo.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches?.map((match) => (
          <div
            key={match.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between gap-4 hover:border-emerald-500/40 transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300">
                  {match.tournament?.name ?? 'Torneo'} •{' '}
                  {match.phase?.name ?? 'Fase'}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    match.status === 'IN_PROGRESS'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {match.status === 'IN_PROGRESS' ? 'EN JUEGO' : 'PROGRAMADO'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-lg font-extrabold text-white">
                  {match.homeTeam.name}
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-sm font-black text-amber-400">
                  {match.homeSetsWon} - {match.awaySetsWon}
                </span>
                <span className="text-lg font-extrabold text-white">
                  {match.awayTeam.name}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  {match.scheduledAt
                    ? new Date(match.scheduledAt).toLocaleString()
                    : 'Fecha por definir'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  {match.courtNumber
                    ? `Cancha ${match.courtNumber}`
                    : 'Cancha por asignar'}
                </span>
                {normalizeExternalUrl(match.courtMapUrl) && (
                  <a
                    href={normalizeExternalUrl(match.courtMapUrl)!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 font-bold hover:bg-amber-400 hover:text-slate-950 transition"
                  >
                    📍 Ver en Google Maps
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <Link
              to={`/referee/matches/${match.id}/score`}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/15"
            >
              <Play className="w-4 h-4 fill-current" />
              Abrir Planilla Digital del Partido
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

