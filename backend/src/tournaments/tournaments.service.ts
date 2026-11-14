import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MatchStatus,
  PhaseType,
  TournamentFormatType,
  TournamentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateTournamentInput {
  name: string;
  formatType: TournamentFormatType;
  maxTeams?: number;
  groupsCount?: number;
  maxSets?: number;
  pointsRegularSet?: number;
  pointsFinalSet?: number;
  pointsDifference?: number;
  qualifiersPerGroup?: number;
  startDate?: string;
  endDate?: string;
  dailyStartHour?: number;
  dailyEndHour?: number;
}

export interface StartTournamentInput {
  teamIds?: number[];
  groupsCount?: number;
}

export interface StandingEntry {
  teamId: number;
  teamName: string;
  delegateName?: string | null;
  logoUrl?: string | null;
  groupName?: string;
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  points: number;
  scheduledMatchesCount?: number;
  isQualified?: boolean;
}

@Injectable()
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTournament(input: CreateTournamentInput) {
    const startDate = input.startDate ? new Date(input.startDate) : null;
    const endDate = input.endDate ? new Date(input.endDate) : null;

    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException(
        'La fecha de fin del torneo no puede ser anterior a la fecha de inicio.',
      );
    }

    return this.prisma.tournament.create({
      data: {
        name: input.name.trim(),
        formatType: input.formatType,
        maxTeams: input.maxTeams ?? 20,
        groupsCount: input.groupsCount ?? 2,
        maxSets: input.maxSets ?? 3,
        pointsRegularSet: input.pointsRegularSet ?? 25,
        pointsFinalSet: input.pointsFinalSet ?? 15,
        pointsDifference: input.pointsDifference ?? 2,
        qualifiersPerGroup: input.qualifiersPerGroup ?? 2,
        startDate,
        endDate,
        dailyStartHour: input.dailyStartHour ?? 8,
        dailyEndHour: input.dailyEndHour ?? 18,
      },
    });
  }

  async findAllTournaments() {
    const tournaments = await this.prisma.tournament.findMany({
      include: {
        teams: true,
        phases: {
          include: {
            groups: {
              include: {
                members: {
                  include: { team: true },
                },
              },
            },
          },
          orderBy: { phaseOrder: 'asc' },
        },
        matches: {
          include: {
            homeTeam: true,
            awayTeam: true,
            referee: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tournaments.map((t) => {
      const teamMap = new Map<
        number,
        {
          id: number;
          name: string;
          delegateName?: string | null;
          logoUrl?: string | null;
        }
      >();
      for (const directTeam of t.teams) {
        teamMap.set(directTeam.id, directTeam);
      }
      for (const m of t.matches) {
        teamMap.set(m.homeTeam.id, m.homeTeam);
        teamMap.set(m.awayTeam.id, m.awayTeam);
      }
      for (const p of t.phases) {
        for (const g of p.groups) {
          for (const gm of g.members) {
            teamMap.set(gm.team.id, gm.team);
          }
        }
      }
      return {
        ...t,
        teams: Array.from(teamMap.values()),
      };
    });
  }

  private sortStandings(rows: StandingEntry[]): StandingEntry[] {
    return rows.sort(
      (a, b) =>
        b.points - a.points ||
        b.won - a.won ||
        b.setsWon - b.setsLost - (a.setsWon - a.setsLost),
    );
  }

  async findTournamentDetail(tournamentId: number, teamIdFilter?: number) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        teams: {
          include: { players: true },
        },
        phases: {
          include: {
            groups: {
              include: {
                members: {
                  include: {
                    team: {
                      include: { players: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { phaseOrder: 'asc' },
        },
        matches: {
          include: {
            phase: true,
            homeTeam: { include: { players: true } },
            awayTeam: { include: { players: true } },
            winnerTeam: true,
            referee: {
              select: { id: true, name: true, email: true },
            },
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
          orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException(`El torneo #${tournamentId} no existe.`);
    }

    const teamsMap = new Map<
      number,
      {
        id: number;
        name: string;
        delegateName?: string | null;
        logoUrl?: string | null;
        players: {
          id: number;
          teamId: number;
          firstName: string;
          lastName: string;
          jerseyNumber: number;
        }[];
      }
    >();

    for (const directTeam of tournament.teams) {
      teamsMap.set(directTeam.id, directTeam);
    }
    for (const phase of tournament.phases) {
      for (const group of phase.groups) {
        for (const member of group.members) {
          teamsMap.set(member.team.id, member.team);
        }
      }
    }
    for (const match of tournament.matches) {
      teamsMap.set(match.homeTeam.id, match.homeTeam);
      teamsMap.set(match.awayTeam.id, match.awayTeam);
    }

    const participatingTeams = Array.from(teamsMap.values());

    // Conteo de partidos programados por equipo
    const matchesCountByTeam = new Map<number, number>();
    for (const m of tournament.matches) {
      matchesCountByTeam.set(
        m.homeTeamId,
        (matchesCountByTeam.get(m.homeTeamId) ?? 0) + 1,
      );
      matchesCountByTeam.set(
        m.awayTeamId,
        (matchesCountByTeam.get(m.awayTeamId) ?? 0) + 1,
      );
    }

    // Mapa de equipo -> nombre de grupo
    const teamGroupNameMap = new Map<number, string>();
    for (const phase of tournament.phases) {
      for (const group of phase.groups) {
        for (const member of group.members) {
          teamGroupNameMap.set(member.teamId, group.name);
        }
      }
    }

    const standingsMap = new Map<number, StandingEntry>();

    for (const team of participatingTeams) {
      standingsMap.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        delegateName: team.delegateName ?? null,
        logoUrl: team.logoUrl ?? null,
        groupName: teamGroupNameMap.get(team.id) ?? 'General',
        played: 0,
        won: 0,
        lost: 0,
        setsWon: 0,
        setsLost: 0,
        points: 0,
        scheduledMatchesCount: matchesCountByTeam.get(team.id) ?? 0,
      });
    }

    for (const m of tournament.matches) {
      if (m.status === MatchStatus.FINISHED) {
        const homeRow = standingsMap.get(m.homeTeamId);
        const awayRow = standingsMap.get(m.awayTeamId);
        if (homeRow && awayRow) {
          homeRow.played += 1;
          awayRow.played += 1;
          homeRow.setsWon += m.homeSetsWon;
          homeRow.setsLost += m.awaySetsWon;
          awayRow.setsWon += m.awaySetsWon;
          awayRow.setsLost += m.homeSetsWon;

          const isFullDistance =
            m.homeSetsWon + m.awaySetsWon === tournament.maxSets;

          if (m.winnerTeamId === m.homeTeamId) {
            homeRow.won += 1;
            awayRow.lost += 1;
            homeRow.points += isFullDistance ? 2 : 3;
            awayRow.points += isFullDistance ? 1 : 0;
          } else if (m.winnerTeamId === m.awayTeamId) {
            awayRow.won += 1;
            homeRow.lost += 1;
            awayRow.points += isFullDistance ? 2 : 3;
            homeRow.points += isFullDistance ? 1 : 0;
          }
        }
      }
    }

    // Construir Tablas de Posiciones separadas por Grupo
    const groupsBuckets = new Map<string, StandingEntry[]>();
    for (const entry of standingsMap.values()) {
      const gName = entry.groupName ?? 'General';
      if (!groupsBuckets.has(gName)) {
        groupsBuckets.set(gName, []);
      }
      groupsBuckets.get(gName)!.push({ ...entry });
    }

    const groupStandings = Array.from(groupsBuckets.entries()).map(
      ([groupName, rows]) => {
        const sorted = this.sortStandings(rows).map((r, idx) => ({
          ...r,
          isQualified: idx < tournament.qualifiersPerGroup,
        }));
        return {
          groupName,
          qualifiersPerGroup: tournament.qualifiersPerGroup,
          standings: sorted,
        };
      },
    );

    const standings = this.sortStandings(
      Array.from(standingsMap.values()),
    ).map((r, idx) => ({
      ...r,
      isQualified:
        idx < tournament.qualifiersPerGroup * tournament.groupsCount,
    }));

    const filteredMatches = teamIdFilter
      ? tournament.matches.filter(
          (m) => m.homeTeamId === teamIdFilter || m.awayTeamId === teamIdFilter,
        )
      : tournament.matches;

    return {
      ...tournament,
      teams: participatingTeams.map((tm) => ({
        ...tm,
        scheduledMatchesCount: matchesCountByTeam.get(tm.id) ?? 0,
      })),
      standings,
      groupStandings,
      filteredMatches,
      liveMatches: filteredMatches.filter(
        (m) => m.status === MatchStatus.IN_PROGRESS,
      ),
      upcomingMatches: filteredMatches.filter(
        (m) => m.status === MatchStatus.SCHEDULED,
      ),
      finishedMatches: filteredMatches.filter(
        (m) => m.status === MatchStatus.FINISHED,
      ),
    };
  }

  private assignAutomaticSchedule(
    pairings: { homeTeamId: number; awayTeamId: number; phaseId: number }[],
    startDate: Date | null,
    endDate: Date | null,
    dailyStartHour: number,
    dailyEndHour: number,
  ): {
    homeTeamId: number;
    awayTeamId: number;
    phaseId: number;
    scheduledAt: Date;
  }[] {
    const baseStart = startDate ? new Date(startDate) : new Date();
    baseStart.setHours(0, 0, 0, 0);

    const baseEnd =
      endDate && endDate >= baseStart
        ? new Date(endDate)
        : new Date(baseStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    baseEnd.setHours(0, 0, 0, 0);

    const startH = Math.max(6, Math.min(20, dailyStartHour || 8));
    const endH = Math.max(startH + 1, Math.min(22, dailyEndHour || 18));

    const candidateSlots: Date[] = [];
    const cursor = new Date(baseStart);
    while (cursor <= baseEnd) {
      for (let hour = startH; hour < endH; hour++) {
        const slot = new Date(cursor);
        slot.setHours(hour, 0, 0, 0);
        candidateSlots.push(slot);
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    if (candidateSlots.length === 0) {
      const fallback = new Date();
      fallback.setHours(8, 0, 0, 0);
      candidateSlots.push(fallback);
    }

    const busyTeamsBySlot = new Map<number, Set<number>>();
    let slotCursor = 0;

    return pairings.map((pair) => {
      let chosenSlot: Date | null = null;

      for (let attempt = 0; attempt < candidateSlots.length * 4; attempt++) {
        const idx = (slotCursor + attempt) % candidateSlots.length;
        const slotDate = candidateSlots[idx];
        const key = slotDate.getTime();
        const busySet = busyTeamsBySlot.get(key) ?? new Set<number>();

        if (
          !busySet.has(pair.homeTeamId) &&
          !busySet.has(pair.awayTeamId)
        ) {
          busySet.add(pair.homeTeamId);
          busySet.add(pair.awayTeamId);
          busyTeamsBySlot.set(key, busySet);
          chosenSlot = slotDate;
          slotCursor = (idx + 1) % candidateSlots.length;
          break;
        }
      }

      if (!chosenSlot) {
        chosenSlot =
          candidateSlots[slotCursor % candidateSlots.length] ?? new Date();
        slotCursor++;
      }

      return {
        ...pair,
        scheduledAt: chosenSlot,
      };
    });
  }

  /**
   * Inicia el torneo:
   * 1. Toma EXCLUSIVAMENTE los equipos inscritos a este torneo específico (`tournamentId: tournament.id`).
   * 2. Si son 20 equipos y 2 grupos de 10:
   *    - Genera 9 partidos intragrupo por cada equipo (Todos contra Todos en Grupo A y B = 90 partidos).
   *    - Genera 1 partido intergrupal cruzado (A[k] vs B[k] = 10 partidos).
   *    - TOTAL GARANTIZADO: 10 partidos programados por equipo (100 partidos en total).
   * 3. Asigna horarios de 8:00 AM a 6:00 PM sin cruces simultáneos.
   */
  async startTournamentAndGenerateMatchups(
    tournamentId: number,
    input: StartTournamentInput,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const tournament = await tx.tournament.findUnique({
          where: { id: tournamentId },
          include: { matches: true },
        });

        if (!tournament) {
          throw new NotFoundException(`El torneo #${tournamentId} no existe.`);
        }

        if (tournament.matches.length > 0) {
          throw new BadRequestException(
            'Este torneo ya fue iniciado y cuenta con cruces generados.',
          );
        }

      // Buscar EXCLUSIVAMENTE equipos asociados a este torneo específico
      const teams = await tx.team.findMany({
        where:
          input.teamIds && input.teamIds.length > 0
            ? { id: { in: input.teamIds }, tournamentId: tournament.id }
            : { tournamentId: tournament.id },
        orderBy: { id: 'asc' },
      });

      if (teams.length < 2) {
        throw new BadRequestException(
          `Se requieren al menos 2 equipos registrados en este torneo para iniciar. Actualmente tiene ${teams.length} equipos inscritos.`,
        );
      }

      const rawPairings: {
        homeTeamId: number;
        awayTeamId: number;
        phaseId: number;
      }[] = [];

      if (tournament.formatType === TournamentFormatType.KNOCKOUT_ONLY) {
        const phaseName =
          teams.length >= 16
            ? 'Octavos de Final'
            : teams.length >= 8
              ? 'Cuartos de Final'
              : teams.length >= 4
                ? 'Semifinales'
                : 'Gran Final';

        const phase = await tx.tournamentPhase.create({
          data: {
            tournamentId: tournament.id,
            name: phaseName,
            phaseOrder: 1,
            phaseType: PhaseType.SINGLE_ELIMINATION,
          },
        });

        for (let i = 0; i + 1 < teams.length; i += 2) {
          rawPairings.push({
            phaseId: phase.id,
            homeTeamId: teams[i].id,
            awayTeamId: teams[i + 1].id,
          });
        }
      } else {
        const requestedGroups =
          tournament.formatType === TournamentFormatType.LEAGUE_ONLY
            ? 1
            : Math.max(1, input.groupsCount ?? tournament.groupsCount ?? 2);

        // Garantizar al menos 2 equipos por grupo para evitar grupos con 0 partidos
        const groupsCount =
          tournament.formatType === TournamentFormatType.LEAGUE_ONLY
            ? 1
            : Math.min(requestedGroups, Math.max(1, Math.floor(teams.length / 2)));

        const phase = await tx.tournamentPhase.create({
          data: {
            tournamentId: tournament.id,
            name:
              tournament.formatType === TournamentFormatType.LEAGUE_ONLY
                ? 'Liga Regular (Todos contra Todos)'
                : `Fase Regular (${groupsCount} Grupos)`,
            phaseOrder: 1,
            phaseType: PhaseType.ROUND_ROBIN,
          },
        });

        const groupBuckets: (typeof teams)[] = Array.from(
          { length: groupsCount },
          () => [],
        );

        teams.forEach((team, idx) => {
          groupBuckets[idx % groupsCount].push(team);
        });

        for (let gIdx = 0; gIdx < groupsCount; gIdx++) {
          const groupLetter = String.fromCharCode(65 + gIdx);
          const group = await tx.phaseGroup.create({
            data: {
              phaseId: phase.id,
              name:
                groupsCount === 1 ? 'Grupo Único' : `Grupo ${groupLetter}`,
            },
          });

          const bucket = groupBuckets[gIdx];
          if (bucket.length > 0) {
            await tx.teamGroupMember.createMany({
              data: bucket.map((t) => ({
                groupId: group.id,
                teamId: t.id,
              })),
              skipDuplicates: true,
            });
          }

          // Partidos Todos contra Todos dentro del grupo
          for (let i = 0; i < bucket.length; i++) {
            for (let j = i + 1; j < bucket.length; j++) {
              rawPairings.push({
                phaseId: phase.id,
                homeTeamId: bucket[i].id,
                awayTeamId: bucket[j].id,
              });
            }
          }
        }

        // Si son 2 grupos (ej. 2 grupos de 10 equipos donde cada uno tiene 9 partidos intragrupo):
        // Se añade 1 partido intergrupal cruzado (A[k] vs B[k]) para garantizar EXACTAMENTE 10 partidos por equipo.
        if (groupsCount === 2 && groupBuckets[0].length === groupBuckets[1].length) {
          const bucketA = groupBuckets[0];
          const bucketB = groupBuckets[1];
          for (let k = 0; k < bucketA.length; k++) {
            rawPairings.push({
              phaseId: phase.id,
              homeTeamId: bucketA[k].id,
              awayTeamId: bucketB[k].id,
            });
          }
        }
      }

      if (rawPairings.length === 0) {
        throw new BadRequestException(
          'No se pudieron generar cruces con la configuración actual de grupos y equipos. Verifica los equipos inscritos.',
        );
      }

      // Asignar fechas y horarios automáticos entre 8:00 AM y 6:00 PM
      const scheduledPairings = this.assignAutomaticSchedule(
        rawPairings,
        tournament.startDate,
        tournament.endDate,
        tournament.dailyStartHour,
        tournament.dailyEndHour,
      );

      if (scheduledPairings.length > 0) {
        await tx.match.createMany({
          data: scheduledPairings.map((item) => ({
            tournamentId: tournament.id,
            phaseId: item.phaseId,
            homeTeamId: item.homeTeamId,
            awayTeamId: item.awayTeamId,
            status: MatchStatus.SCHEDULED,
            scheduledAt: item.scheduledAt,
            courtNumber: null,
            courtMapUrl: null,
            refereeId: null,
          })),
        });
      }

      const generatedMatches = await tx.match.findMany({
        where: { tournamentId: tournament.id },
        include: {
          homeTeam: true,
          awayTeam: true,
          phase: true,
        },
        orderBy: { id: 'asc' },
      });

      return {
        tournamentId: tournament.id,
        totalMatchesGenerated: generatedMatches.length,
        matches: generatedMatches,
      };
    },
    {
      maxWait: 20000,
      timeout: 90000,
    });
  }

  async advanceGroupQualifiersToKnockout(tournamentId: number) {
    const detail = await this.findTournamentDetail(tournamentId);

    if (
      !detail.groupStandings ||
      detail.groupStandings.length === 0
    ) {
      throw new BadRequestException(
        'No existen grupos configurados en este torneo para avanzar a la fase eliminatoria.',
      );
    }

    const qualifiedByGroup = detail.groupStandings.map((g) =>
      g.standings.filter((s) => s.isQualified),
    );

    const allQualified = qualifiedByGroup.flat();
    if (allQualified.length < 2) {
      throw new BadRequestException(
        'Se requieren al menos 2 equipos clasificados para generar la fase final.',
      );
    }

    const phaseName =
      allQualified.length >= 8
        ? 'Cuartos de Final (Fase Eliminatoria)'
        : allQualified.length === 4
          ? 'Fase Final - Cuartos / Semifinales (Top 4)'
          : 'Gran Final';

    return this.prisma.$transaction(async (tx) => {
      const phase = await tx.tournamentPhase.create({
        data: {
          tournamentId: detail.id,
          name: phaseName,
          phaseOrder: detail.phases.length + 1,
          phaseType: PhaseType.SINGLE_ELIMINATION,
        },
      });

      const pairings: {
        homeTeamId: number;
        awayTeamId: number;
        phaseId: number;
      }[] = [];

      if (qualifiedByGroup.length === 2) {
        const groupA = qualifiedByGroup[0];
        const groupB = qualifiedByGroup[1];
        const maxLen = Math.min(groupA.length, groupB.length);
        for (let i = 0; i < maxLen; i++) {
          const home = groupA[i];
          const away = groupB[maxLen - 1 - i];
          if (home && away && home.teamId !== away.teamId) {
            pairings.push({
              phaseId: phase.id,
              homeTeamId: home.teamId,
              awayTeamId: away.teamId,
            });
          }
        }
      } else {
        for (let i = 0; i + 1 < allQualified.length; i += 2) {
          pairings.push({
            phaseId: phase.id,
            homeTeamId: allQualified[i].teamId,
            awayTeamId: allQualified[i + 1].teamId,
          });
        }
      }

      const scheduled = this.assignAutomaticSchedule(
        pairings,
        detail.endDate ?? detail.startDate,
        detail.endDate ?? detail.startDate,
        detail.dailyStartHour,
        detail.dailyEndHour,
      );

      const createdMatches = [];
      for (const p of scheduled) {
        const m = await tx.match.create({
          data: {
            tournamentId: detail.id,
            phaseId: p.phaseId,
            homeTeamId: p.homeTeamId,
            awayTeamId: p.awayTeamId,
            scheduledAt: p.scheduledAt,
            status: MatchStatus.SCHEDULED,
          },
          include: {
            homeTeam: true,
            awayTeam: true,
            phase: true,
          },
        });
        createdMatches.push(m);
      }

      return {
        phaseName,
        totalKnockoutMatches: createdMatches.length,
        matches: createdMatches,
      };
    });
  }

  async updateTournament(
    id: number,
    input: Partial<CreateTournamentInput>,
  ) {
    const existing = await this.prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { teams: true } } },
    });

    if (!existing) {
      throw new NotFoundException(`El torneo #${id} no existe.`);
    }

    if (
      input.maxTeams !== undefined &&
      input.maxTeams < existing._count.teams
    ) {
      throw new BadRequestException(
        `No puedes reducir el cupo a ${input.maxTeams} porque ya hay ${existing._count.teams} equipos inscritos.`,
      );
    }

    const startDate =
      input.startDate !== undefined
        ? input.startDate
          ? new Date(input.startDate)
          : null
        : existing.startDate;
    const endDate =
      input.endDate !== undefined
        ? input.endDate
          ? new Date(input.endDate)
          : null
        : existing.endDate;

    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException(
        'La fecha de fin del torneo no puede ser anterior a la fecha de inicio.',
      );
    }

    const startHour = input.dailyStartHour ?? existing.dailyStartHour;
    const endHour = input.dailyEndHour ?? existing.dailyEndHour;
    if (endHour <= startHour) {
      throw new BadRequestException(
        'La hora de cierre diaria debe ser posterior a la hora de inicio.',
      );
    }

    return this.prisma.tournament.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name.trim() : undefined,
        formatType: input.formatType,
        maxTeams: input.maxTeams,
        groupsCount: input.groupsCount,
        maxSets: input.maxSets,
        pointsRegularSet: input.pointsRegularSet,
        pointsFinalSet: input.pointsFinalSet,
        pointsDifference: input.pointsDifference,
        qualifiersPerGroup: input.qualifiersPerGroup,
        startDate: input.startDate !== undefined ? startDate : undefined,
        endDate: input.endDate !== undefined ? endDate : undefined,
        dailyStartHour: input.dailyStartHour,
        dailyEndHour: input.dailyEndHour,
      },
    });
  }

  async finishTournament(id: number) {
    const existing = await this.prisma.tournament.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`El torneo #${id} no existe.`);
    }
    if (existing.status === TournamentStatus.FINISHED) {
      throw new BadRequestException('Este torneo ya se encuentra finalizado.');
    }

    return this.prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.FINISHED },
    });
  }

  async deleteTournament(id: number) {
    const existing = await this.prisma.tournament.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`El torneo #${id} no existe.`);
    }

    return this.prisma.tournament.delete({
      where: { id },
    });
  }
}
