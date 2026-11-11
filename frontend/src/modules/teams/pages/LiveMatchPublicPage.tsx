import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { apiFetch } from '../../../shared/api/httpClient';
import { LiveScoreBanner } from '../../../shared/components/LiveScoreBanner';
import { useMatchLiveSocket } from '../../../shared/hooks/useMatchLiveSocket';
import { MatchLivePayload } from '../../../shared/types/volleyball.types';
import { VolleyballCourt } from '../../referee/components/VolleyballCourt';

export const LiveMatchPublicPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const numericMatchId = Number(matchId);

  const {
    liveData,
    isConnected,
    lastRotatedTeamId,
    setInitialData,
  } = useMatchLiveSocket(numericMatchId);

  const { data: initialMatch, isLoading } = useQuery<MatchLivePayload>({
    queryKey: ['public-match-live', numericMatchId],
    queryFn: () => apiFetch<MatchLivePayload>(`/matches/${numericMatchId}/live`),
    enabled: Boolean(numericMatchId),
  });

  useEffect(() => {
    if (initialMatch) {
      setInitialData(initialMatch);
    }
  }, [initialMatch, setInitialData]);

  const activeMatch = liveData ?? initialMatch;

  if (isLoading || !activeMatch) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-center text-slate-400">
        Conectando al marcador en tiempo real...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to={
            activeMatch.tournament?.id
              ? `/tournaments/${activeMatch.tournament.id}`
              : '/tournaments'
          }
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-amber-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Torneo
        </Link>
      </div>

      {/* Marcador en Vivo Reactivo vía WebSocket */}
      <LiveScoreBanner match={activeMatch} isConnected={isConnected} />

      {/* Cancha 2D con Rotación y Jugador en Servicio en Tiempo Real */}
      <VolleyballCourt
        homeTeam={activeMatch.homeTeam}
        awayTeam={activeMatch.awayTeam}
        homeLineup={activeMatch.currentSet?.homeLineup}
        awayLineup={activeMatch.currentSet?.awayLineup}
        servingTeamId={activeMatch.currentSet?.servingTeamId}
        lastRotatedTeamId={lastRotatedTeamId}
      />
    </div>
  );
};

