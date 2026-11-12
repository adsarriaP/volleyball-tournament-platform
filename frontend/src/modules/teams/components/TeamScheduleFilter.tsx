import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Edit,
  ExternalLink,
  MapPin,
  Radio,
  Shield,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react';
import { resolveTeamLogoUrl } from '../../../shared/api/httpClient';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { EditMatchScheduleModal } from '../../matches/components/EditMatchScheduleModal';
import {
  GroupStandingBlock,
  MatchSummary,
  StandingRow,
  Team,
} from '../../../shared/types/volleyball.types';

interface TeamScheduleFilterProps {
  tournamentId?: number;
  teams: Team[];
  selectedTeamId: number | null;
  onSelectTeam: (teamId: number | null) => void;
  liveMatches: MatchSummary[];
  upcomingMatches: MatchSummary[];
  finishedMatches: MatchSummary[];
  standings: StandingRow[];
  groupStandings?: GroupStandingBlock[];
  qualifiersPerGroup?: number;
}

type SofaFilterMode = 'ALL' | 'LIVE' | 'UPCOMING' | 'FINISHED';

const TeamBadge: React.FC<{ team: Team; size?: 'sm' | 'md' }> = ({
  team,
  size = 'md',
}) => {
  const logo = resolveTeamLogoUrl(team.logoUrl);
  const dim = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';
  return (
    <div
      className={`${dim} rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center overflow-hidden font-black text-yellow-400 shrink-0`}
    >
      {logo ? (
        <img src={logo} alt={team.name} className="w-full h-full object-cover" />
      ) : (
        team.name.slice(0, 2).toUpperCase()
      )}
    </div>
  );
};

export const TeamScheduleFilter: React.FC<TeamScheduleFilterProps> = ({
  tournamentId,
  teams,
  selectedTeamId,
  onSelectTeam,
  liveMatches,
  upcomingMatches,
  finishedMatches,
  standings,
  groupStandings,
  qualifiersPerGroup = 2,
}) => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';

  const [filterMode, setFilterMode] = useState<SofaFilterMode>('ALL');
  const [selectedDateKey, setSelectedDateKey] = useState<string>('ALL');
  const [editingMatch, setEditingMatch] = useState<MatchSummary | null>(null);

  const allMatches = useMemo(
    () => [...liveMatches, ...upcomingMatches, ...finishedMatches],
    [liveMatches, upcomingMatches, finishedMatches],
  );

  // Extraer fechas únicas para el carrusel de días estilo SofaScore
  const dateKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const m of allMatches) {
      if (m.scheduledAt) {
        keys.add(m.scheduledAt.slice(0, 10));
      }
    }
    return Array.from(keys).sort();
  }, [allMatches]);

  const displayedMatches = useMemo(() => {
    let base: MatchSummary[] = [];
    if (filterMode === 'LIVE') base = liveMatches;
    else if (filterMode === 'UPCOMING') base = upcomingMatches;
    else if (filterMode === 'FINISHED') base = finishedMatches;
    else base = allMatches;

    if (selectedDateKey !== 'ALL') {
      base = base.filter(
        (m) => m.scheduledAt && m.scheduledAt.slice(0, 10) === selectedDateKey,
      );
    }
    return base;
  }, [
    filterMode,
    liveMatches,
    upcomingMatches,
    finishedMatches,
    allMatches,
    selectedDateKey,
  ]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div className="space-y-6">
      {/* Barra Superior de Equipos con Escudo y Delegado */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-yellow-400" />
            <span className="text-xs md:text-sm font-black uppercase tracking-wider text-white">
              Equipos Participantes ({teams.length})
            </span>
          </div>
          {selectedTeam && (
            <div className="flex items-center gap-3 text-xs">
              {selectedTeam.delegateName && (
                <span className="inline-flex items-center gap-1 text-zinc-300">
                  <UserCheck className="w-3.5 h-3.5 text-yellow-400" />
                  Delegado: <strong>{selectedTeam.delegateName}</strong>
                </span>
              )}
              <button
                onClick={() => onSelectTeam(null)}
                className="font-bold text-yellow-400 hover:underline"
              >
                Mostrar todos los equipos ✕
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => onSelectTeam(null)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black border shrink-0 transition ${
              selectedTeamId === null
                ? 'bg-yellow-400 text-zinc-950 border-yellow-400'
                : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            TODOS ({teams.length})
          </button>

          {teams.map((team) => {
            const isSelected = selectedTeamId === team.id;
            return (
              <button
                key={team.id}
                type="button"
                onClick={() =>
                  onSelectTeam(isSelected ? null : team.id)
                }
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition ${
                  isSelected
                    ? 'bg-yellow-400 text-zinc-950 border-yellow-400 shadow-md'
                    : 'bg-zinc-950 text-white border-zinc-800 hover:border-yellow-400/60'
                }`}
              >
                <TeamBadge team={team} size="sm" />
                <div className="text-left">
                  <div className="leading-tight">{team.name}</div>
                  {team.delegateName && (
                    <div
                      className={`text-[10px] leading-tight ${
                        isSelected ? 'text-zinc-800' : 'text-zinc-400'
                      }`}
                    >
                      Del: {team.delegateName}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Layout Principal Estilo SofaScore (2 Columnas: Feed de Partidos a la Izquierda + Clasificación por Grupos a la Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA/CENTRAL (7 cols): Marcadores en Vivo y Próximos Estilo SofaScore */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barra de Filtros SofaScore: TODOS | EN VIVO | PRÓXIMOS | FINALIZADOS */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterMode('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                    filterMode === 'ALL'
                      ? 'bg-yellow-400 text-zinc-950'
                      : 'bg-zinc-950 text-zinc-300 hover:text-white border border-zinc-800'
                  }`}
                >
                  TODOS ({allMatches.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode('LIVE')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                    filterMode === 'LIVE'
                      ? 'bg-yellow-400 text-zinc-950'
                      : 'bg-zinc-950 text-yellow-400 border border-zinc-800 hover:border-yellow-400/50'
                  }`}
                >
                  <Radio
                    className={`w-3.5 h-3.5 ${
                      liveMatches.length > 0 ? 'animate-pulse' : ''
                    }`}
                  />
                  EN VIVO ({liveMatches.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode('UPCOMING')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                    filterMode === 'UPCOMING'
                      ? 'bg-yellow-400 text-zinc-950'
                      : 'bg-zinc-950 text-zinc-300 hover:text-white border border-zinc-800'
                  }`}
                >
                  PRÓXIMOS ({upcomingMatches.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode('FINISHED')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                    filterMode === 'FINISHED'
                      ? 'bg-yellow-400 text-zinc-950'
                      : 'bg-zinc-950 text-zinc-300 hover:text-white border border-zinc-800'
                  }`}
                >
                  FINALIZADOS ({finishedMatches.length})
                </button>
              </div>
            </div>

            {/* Carrusel de Fechas (8:00 AM - 6:00 PM) */}
            {dateKeys.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-zinc-800">
                <Calendar className="w-3.5 h-3.5 text-yellow-400 shrink-0 mr-1" />
                <button
                  type="button"
                  onClick={() => setSelectedDateKey('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ${
                    selectedDateKey === 'ALL'
                      ? 'bg-zinc-800 text-yellow-400 border border-yellow-400/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Todas las fechas
                </button>
                {dateKeys.map((dk) => (
                  <button
                    key={dk}
                    type="button"
                    onClick={() => setSelectedDateKey(dk)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ${
                      selectedDateKey === dk
                        ? 'bg-yellow-400 text-zinc-950'
                        : 'bg-zinc-950 text-zinc-300 border border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {dk}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lista de Partidos Estilo SofaScore */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden divide-y divide-zinc-800">
            {displayedMatches.length === 0 ? (
              <div className="p-10 text-center text-sm text-zinc-400">
                No hay encuentros para el filtro seleccionado.
              </div>
            ) : (
              displayedMatches.map((m) => {
                const isLive = m.status === 'IN_PROGRESS';
                const isFinished = m.status === 'FINISHED';
                const timeLabel = m.scheduledAt
                  ? new Date(m.scheduledAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '--:--';
                const dateLabel = m.scheduledAt
                  ? new Date(m.scheduledAt).toLocaleDateString([], {
                      day: '2-digit',
                      month: 'short',
                    })
                  : 'Sin fecha';

                return (
                  <div
                    key={m.id}
                    className={`p-3.5 md:p-4 transition hover:bg-zinc-800/60 ${
                      isLive ? 'bg-zinc-900/90 border-l-4 border-l-yellow-400' : ''
                    }`}
                  >
                    {/* Subcabecera de Fase + Cancha + Google Maps */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-300 uppercase tracking-wider">
                          {m.phase?.name ?? 'Fase de Grupos'}
                        </span>
                        {m.courtNumber && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-950 text-zinc-200 border border-zinc-800">
                            <MapPin className="w-3 h-3 text-yellow-400" />
                            {m.courtNumber}
                          </span>
                        )}
                        {m.courtMapUrl && (
                          <a
                            href={m.courtMapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 font-bold hover:bg-yellow-400 hover:text-zinc-950 transition"
                          >
                            📍 Ver en Google Maps
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {m.referee ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                            <Shield className="w-3 h-3" />
                            Juez: {m.referee.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 italic">
                            Sin juez asignado
                          </span>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setEditingMatch(m)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-yellow-400 hover:text-black text-zinc-300 font-bold text-[10px] transition"
                          >
                            <Edit className="w-3 h-3" />
                            Gestionar Partido / Juez
                          </button>
                        )}

                        <Link
                          to={`/matches/${m.id}/live`}
                          className="font-black text-yellow-400 hover:underline"
                        >
                          {isLive ? '● Seguir en Vivo →' : 'Detalles / Sala →'}
                        </Link>
                      </div>
                    </div>

                    {/* Fila Principal Estilo SofaScore */}
                    <div className="grid grid-cols-12 items-center gap-2">
                      {/* Columna Hora / Estado (2 cols) */}
                      <div className="col-span-2 flex flex-col items-center justify-center border-r border-zinc-800 pr-2 text-center">
                        {isLive ? (
                          <span className="px-2 py-0.5 rounded bg-yellow-400 text-zinc-950 font-black text-[10px] uppercase animate-pulse">
                            LIVE
                          </span>
                        ) : isFinished ? (
                          <span className="text-[11px] font-black text-zinc-400">
                            FIN
                          </span>
                        ) : (
                          <>
                            <span className="text-xs font-black text-white">
                              {timeLabel}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {dateLabel}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Columna Equipos (6 cols) */}
                      <div className="col-span-6 space-y-2 pl-1">
                        {/* Equipo Local */}
                        <div className="flex items-center gap-2.5">
                          <TeamBadge team={m.homeTeam} size="sm" />
                          <span
                            className={`text-xs md:text-sm font-bold truncate ${
                              m.winnerTeamId === m.homeTeamId
                                ? 'text-yellow-400 font-black'
                                : 'text-white'
                            }`}
                          >
                            {m.homeTeam.name}
                          </span>
                        </div>

                        {/* Equipo Visitante */}
                        <div className="flex items-center gap-2.5">
                          <TeamBadge team={m.awayTeam} size="sm" />
                          <span
                            className={`text-xs md:text-sm font-bold truncate ${
                              m.winnerTeamId === m.awayTeamId
                                ? 'text-yellow-400 font-black'
                                : 'text-white'
                            }`}
                          >
                            {m.awayTeam.name}
                          </span>
                        </div>
                      </div>

                      {/* Columna Parciales de Sets y Marcador Final (4 cols) */}
                      <div className="col-span-4 flex items-center justify-end gap-1.5">
                        {/* Parciales por set estilo SofaScore */}
                        <div className="hidden sm:flex items-center gap-1">
                          {(m.sets ?? []).map((s) => (
                            <div
                              key={s.id || s.setNumber}
                              className="flex flex-col items-center px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300"
                            >
                              <span>{s.homeScore}</span>
                              <span>{s.awayScore}</span>
                            </div>
                          ))}
                        </div>

                        {/* Sets Ganados Totales */}
                        <div className="flex flex-col items-center justify-center min-w-[34px] px-2 py-1 rounded-xl bg-zinc-950 border border-zinc-700 font-black text-xs md:text-sm">
                          <span
                            className={
                              isLive || m.winnerTeamId === m.homeTeamId
                                ? 'text-yellow-400'
                                : 'text-white'
                            }
                          >
                            {m.homeSetsWon}
                          </span>
                          <span
                            className={
                              isLive || m.winnerTeamId === m.awayTeamId
                                ? 'text-yellow-400'
                                : 'text-white'
                            }
                          >
                            {m.awaySetsWon}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA (5 cols): Tablas de Posiciones por Grupo (Ej. 2 Grupos de 10 Equipos) */}
        <div className="lg:col-span-5 space-y-5">
          {(groupStandings && groupStandings.length > 0
            ? groupStandings
            : [
                {
                  groupName: 'Clasificación General',
                  qualifiersPerGroup,
                  standings,
                },
              ]
          ).map((block) => (
            <div
              key={block.groupName}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xl"
            >
              <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-white">
                    {block.groupName} ({block.standings.length} Equipos)
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-yellow-400">
                  Clasifican Top {block.qualifiersPerGroup}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/50 text-zinc-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Equipo</th>
                      <th className="py-2.5 px-2 text-center">PJ</th>
                      <th className="py-2.5 px-2 text-center">G</th>
                      <th className="py-2.5 px-2 text-center">P</th>
                      <th className="py-2.5 px-2 text-center">Sets</th>
                      <th className="py-2.5 px-3 text-center text-yellow-400">
                        PTS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.standings.map((row, idx) => {
                      const isQualified = idx < block.qualifiersPerGroup;
                      const logo = resolveTeamLogoUrl(row.logoUrl);

                      return (
                        <tr
                          key={row.teamId}
                          onClick={() => onSelectTeam(row.teamId)}
                          className={`border-b border-zinc-800/70 cursor-pointer hover:bg-zinc-800/60 transition ${
                            selectedTeamId === row.teamId
                              ? 'bg-yellow-400/15'
                              : ''
                          } ${
                            isQualified
                              ? 'border-l-4 border-l-yellow-400'
                              : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-black">
                            <span
                              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                                isQualified
                                  ? 'bg-yellow-400 text-zinc-950'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center overflow-hidden text-[9px] font-black text-yellow-400 shrink-0">
                                {logo ? (
                                  <img
                                    src={logo}
                                    alt={row.teamName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Shield className="w-3 h-3" />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-white leading-tight">
                                  {row.teamName}
                                </div>
                                {row.delegateName && (
                                  <div className="text-[10px] text-zinc-400">
                                    Del: {row.delegateName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center text-zinc-300">
                            {row.played}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-white">
                            {row.won}
                          </td>
                          <td className="py-2.5 px-2 text-center text-zinc-400">
                            {row.lost}
                          </td>
                          <td className="py-2.5 px-2 text-center text-zinc-300">
                            {row.setsWon}:{row.setsLost}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black text-yellow-400">
                            {row.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-2 bg-zinc-950/60 text-[11px] text-zinc-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                Zona de clasificación a Fase Eliminatoria (Top{' '}
                {block.qualifiersPerGroup} del grupo)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para que el Administrador edite el Juez, Fecha y Cancha del Partido */}
      {editingMatch && tournamentId && (
        <EditMatchScheduleModal
          match={editingMatch}
          tournamentId={tournamentId}
          isOpen={Boolean(editingMatch)}
          onClose={() => setEditingMatch(null)}
        />
      )}
    </div>
  );
};
