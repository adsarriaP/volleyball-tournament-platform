import React, { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Trophy, Users } from 'lucide-react';
import { apiFetch } from '../../../shared/api/httpClient';
import { TournamentDetailSkeleton } from '../../../shared/components/LoadingUI';
import { TournamentDetail } from '../../../shared/types/volleyball.types';
import { TeamScheduleFilter } from '../../teams/components/TeamScheduleFilter';

export const TournamentDetailPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTeamId = searchParams.get('teamId')
    ? Number(searchParams.get('teamId'))
    : null;
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(
    initialTeamId,
  );

  const numericId = Number(tournamentId);

  const { data: tournament, isLoading } = useQuery<TournamentDetail>({
    queryKey: ['tournament-detail', numericId, selectedTeamId],
    queryFn: () =>
      apiFetch<TournamentDetail>(
        `/tournaments/${numericId}${
          selectedTeamId ? `?teamId=${selectedTeamId}` : ''
        }`,
      ),
    enabled: Boolean(numericId),
    refetchInterval: 6000,
  });

  const handleSelectTeam = (teamId: number | null) => {
    setSelectedTeamId(teamId);
    if (teamId) {
      setSearchParams({ teamId: String(teamId) });
    } else {
      setSearchParams({});
    }
  };

  if (isLoading || !tournament) {
    return <TournamentDetailSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/tournaments"
          className="inline-flex items-center gap-1.5 text-xs font-black text-zinc-300 hover:text-yellow-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Torneos Activos
        </Link>
      </div>

      {/* Cabecera Estilo SofaScore en Negro, Gris, Amarillo y Blanco */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-yellow-400">
              <Trophy className="w-4 h-4" />
              Torneo #{tournament.id} • SofaScore Live
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                tournament.category === 'BENJAMIN'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : tournament.category === 'MINI'
                    ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                    : 'bg-yellow-400/15 border-yellow-400/30 text-yellow-300'
              }`}
            >
              {tournament.category === 'BENJAMIN'
                ? '🧒 Categoría Benjamín (3 vs 3)'
                : tournament.category === 'MINI'
                  ? '🏐 Categoría Mini Voleibol (4 vs 4)'
                  : '🏆 Categoría Estándar (6 vs 6)'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            {tournament.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-yellow-400" />
              Cupo: {tournament.teams.length} / {tournament.maxTeams ?? 20}{' '}
              equipos ({tournament.groupsCount ?? 2} grupos)
            </span>
            <span>• Clasifican {tournament.qualifiersPerGroup} por grupo</span>
            <span>• Mejor de {tournament.maxSets} sets</span>
            {tournament.startDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                {new Date(tournament.startDate).toLocaleDateString()} al{' '}
                {tournament.endDate
                  ? new Date(tournament.endDate).toLocaleDateString()
                  : 'En curso'}{' '}
                ({tournament.dailyStartHour ?? 8}:00 -{' '}
                {tournament.dailyEndHour ?? 18}:00)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Vista SofaScore con Filtro de Equipos, En Vivo, Próximos y Tablas por Grupo */}
      <TeamScheduleFilter
        tournamentId={tournament.id}
        teams={tournament.teams}
        selectedTeamId={selectedTeamId}
        onSelectTeam={handleSelectTeam}
        liveMatches={tournament.liveMatches}
        upcomingMatches={tournament.upcomingMatches}
        finishedMatches={tournament.finishedMatches}
        standings={tournament.standings}
        groupStandings={tournament.groupStandings}
        qualifiersPerGroup={tournament.qualifiersPerGroup}
      />
    </div>
  );
};
