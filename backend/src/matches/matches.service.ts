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

export interface ScheduleMatchInput {
  scheduledAt?: string | null;
  courtNumber?: string | null;
  courtMapUrl?: string | null;
  refereeId?: number | null;
}

export interface CreateFriendlyMatchInput {
  tournamentId?: number;
  homeTeamId: number;
  awayTeamId: number;
  scheduledAt?: string | null;
  courtNumber?: string | null;
  courtMapUrl?: string | null;
  refereeId?: number | null;
  phaseName?: string | null;
}

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Permite al Administrador crear manualmente un partido amistoso o de fogueo
   * sin depender del generador automático de fixture.
   */
  public async createFriendlyMatch(input: CreateFriendlyMatchInput) {
    if (input.homeTeamId === input.awayTeamId) {
      throw new BadRequestException(
        'El equipo local y el equipo visitante deben ser diferentes.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const [homeTeam, awayTeam] = await Promise.all([
        tx.team.findUnique({ where: { id: input.homeTeamId } }),
        tx.team.findUnique({ where: { id: input.awayTeamId } }),
      ]);

      if (!homeTeam) {
        throw new NotFoundException(
          `El equipo local #${input.homeTeamId} no existe.`,
        );
      }
      if (!awayTeam) {
        throw new NotFoundException(
          `El equipo visitante #${input.awayTeamId} no existe.`,
        );
      }

      let tournament = input.tournamentId
        ? await tx.tournament.findUnique({ where: { id: input.tournamentId } })
        : await tx.tournament.findFirst({
            where: {
              name: 'Partidos Amistosos / Fogueo',
              status: TournamentStatus.ACTIVE,
            },
            orderBy: { id: 'desc' },
          });

      if (input.tournamentId && !tournament) {
        throw new NotFoundException(
          `El torneo #${input.tournamentId} no existe.`,
        );
      }

      if (!tournament) {
        tournament = await tx.tournament.create({
          data: {
            name: 'Partidos Amistosos / Fogueo',
            formatType: TournamentFormatType.LEAGUE_ONLY,
            status: TournamentStatus.ACTIVE,
            maxTeams: 100,
            groupsCount: 1,
            maxSets: 3,
            pointsRegularSet: 25,
            pointsFinalSet: 15,
            pointsDifference: 2,
            qualifiersPerGroup: 1,
          },
        });
      }

      let phase = await tx.tournamentPhase.findFirst({
        where: { tournamentId: tournament.id },
        orderBy: { phaseOrder: 'asc' },
      });

      if (!phase) {
        phase = await tx.tournamentPhase.create({
          data: {
            tournamentId: tournament.id,
            name: input.phaseName?.trim() || 'Amistosos / Fogueo',
            phaseOrder: 1,
            phaseType: PhaseType.ROUND_ROBIN,
          },
        });
      }

      return tx.match.create({
        data: {
          tournamentId: tournament.id,
          phaseId: phase.id,
          homeTeamId: input.homeTeamId,
          awayTeamId: input.awayTeamId,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          courtNumber: input.courtNumber?.trim() || null,
          courtMapUrl: input.courtMapUrl?.trim() || null,
          refereeId: input.refereeId ?? null,
          status: MatchStatus.SCHEDULED,
        },
        include: {
          tournament: true,
          phase: true,
          homeTeam: true,
          awayTeam: true,
          referee: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    });
  }

  /**
   * Exclusivo para el Administrador: registra o actualiza la fecha/hora (`scheduledAt`),
   * cancha (`courtNumber`), link de Google Maps (`courtMapUrl`) y el árbitro (`refereeId`).
   */
  public async scheduleMatch(matchId: number, input: ScheduleMatchInput) {
    const existing = await this.prisma.match.findUnique({
      where: { id: matchId },
    });
    if (!existing) {
      throw new NotFoundException(`El partido #${matchId} no existe.`);
    }

    return this.prisma.match.update({
      where: { id: matchId },
      data: {
        scheduledAt:
          input.scheduledAt !== undefined
            ? input.scheduledAt
              ? new Date(input.scheduledAt)
              : null
            : undefined,
        courtNumber:
          input.courtNumber !== undefined ? input.courtNumber : undefined,
        courtMapUrl:
          input.courtMapUrl !== undefined ? input.courtMapUrl : undefined,
        refereeId:
          input.refereeId !== undefined ? input.refereeId : undefined,
      },
      include: {
        tournament: true,
        phase: true,
        homeTeam: true,
        awayTeam: true,
        referee: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Permite al Administrador corregir manualmente el resultado de un partido:
   * Sets ganados por cada equipo, ganador y estado final (FINISHED / SCHEDULED / IN_PROGRESS).
   */
  public async updateMatchResult(
    matchId: number,
    input: {
      homeSetsWon?: number;
      awaySetsWon?: number;
      winnerTeamId?: number | null;
      status?: MatchStatus;
      sets?: { setNumber: number; homeScore: number; awayScore: number }[];
    },
  ) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { sets: true },
    });

    if (!match) {
      throw new NotFoundException(`El partido #${matchId} no existe.`);
    }

    if (input.sets && input.sets.length > 0) {
      for (const s of input.sets) {
        await this.prisma.matchSet.upsert({
          where: {
            matchId_setNumber: {
              matchId,
              setNumber: s.setNumber,
            },
          },
          update: {
            homeScore: s.homeScore,
            awayScore: s.awayScore,
            status: 'COMPLETED',
          },
          create: {
            matchId,
            setNumber: s.setNumber,
            homeScore: s.homeScore,
            awayScore: s.awayScore,
            status: 'COMPLETED',
          },
        });
      }
    }

    return this.prisma.match.update({
      where: { id: matchId },
      data: {
        homeSetsWon: input.homeSetsWon !== undefined ? input.homeSetsWon : undefined,
        awaySetsWon: input.awaySetsWon !== undefined ? input.awaySetsWon : undefined,
        winnerTeamId: input.winnerTeamId !== undefined ? input.winnerTeamId : undefined,
        status: input.status !== undefined ? input.status : undefined,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        sets: { orderBy: { setNumber: 'asc' } },
        referee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Devuelve los partidos donde `refereeId == currentUser.id`
   * y `status IN ('SCHEDULED', 'IN_PROGRESS')`.
   */
  public async findMyAssignedMatches(refereeId: number, isAdmin = false) {
    return this.prisma.match.findMany({
      where: {
        ...(isAdmin ? {} : { refereeId }),
        status: {
          in: [MatchStatus.SCHEDULED, MatchStatus.IN_PROGRESS],
        },
      },
      include: {
        tournament: true,
        phase: true,
        homeTeam: {
          include: { players: { orderBy: { jerseyNumber: 'asc' } } },
        },
        awayTeam: {
          include: { players: { orderBy: { jerseyNumber: 'asc' } } },
        },
        referee: {
          select: { id: true, name: true, email: true },
        },
        sets: {
          orderBy: { setNumber: 'asc' },
          include: {
            lineups: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  }

  /**
   * Construye el payload completo (`MatchLivePayload`) de un partido con las
   * posiciones 1..6 hidratadas con los objetos `Player` de ambos equipos.
   */
  public async getMatchLivePayload(matchId: number) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true,
        phase: true,
        homeTeam: {
          include: { players: { orderBy: { jerseyNumber: 'asc' } } },
        },
        awayTeam: {
          include: { players: { orderBy: { jerseyNumber: 'asc' } } },
        },
        referee: {
          select: { id: true, name: true, email: true },
        },
        sets: {
          orderBy: { setNumber: 'asc' },
          include: {
            lineups: {
              include: {
                pos1Player: true,
                pos2Player: true,
                pos3Player: true,
                pos4Player: true,
                pos5Player: true,
                pos6Player: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException(`El partido #${matchId} no existe.`);
    }

    const setsHistory = match.sets.map((s) => {
      const homeLineupRow = s.lineups.find(
        (l) => l.teamId === match.homeTeamId,
      );
      const awayLineupRow = s.lineups.find(
        (l) => l.teamId === match.awayTeamId,
      );

      return {
        id: s.id,
        setNumber: s.setNumber,
        homeScore: s.homeScore,
        awayScore: s.awayScore,
        servingTeamId: s.servingTeamId ?? match.homeTeamId,
        status: s.status,
        winnerTeamId: s.winnerTeamId ?? undefined,
        homeLineup: homeLineupRow
          ? {
              pos1: homeLineupRow.pos1Player,
              pos2: homeLineupRow.pos2Player,
              pos3: homeLineupRow.pos3Player,
              pos4: homeLineupRow.pos4Player,
              pos5: homeLineupRow.pos5Player,
              pos6: homeLineupRow.pos6Player,
            }
          : undefined,
        awayLineup: awayLineupRow
          ? {
              pos1: awayLineupRow.pos1Player,
              pos2: awayLineupRow.pos2Player,
              pos3: awayLineupRow.pos3Player,
              pos4: awayLineupRow.pos4Player,
              pos5: awayLineupRow.pos5Player,
              pos6: awayLineupRow.pos6Player,
            }
          : undefined,
      };
    });

    const activeSet =
      setsHistory.find((s) => s.status === 'IN_PROGRESS') ??
      setsHistory[setsHistory.length - 1] ?? {
        id: 0,
        setNumber: 1,
        homeScore: 0,
        awayScore: 0,
        servingTeamId: match.homeTeamId,
        status: 'NOT_STARTED' as const,
      };

    return {
      matchId: match.id,
      tournament: match.tournament,
      phase: match.phase,
      scheduledAt: match.scheduledAt,
      courtNumber: match.courtNumber,
      courtMapUrl: match.courtMapUrl,
      referee: match.referee,
      status: match.status,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeSetsWon: match.homeSetsWon,
      awaySetsWon: match.awaySetsWon,
      winnerTeamId: match.winnerTeamId,
      currentSet: activeSet,
      setsHistory,
    };
  }

  /**
   * Devuelve el fixture, historial de resultados y estado en vivo
   * de los encuentros de un equipo específico.
   */
  public async findTeamMatches(teamId: number, tournamentId?: number) {
    const matches = await this.prisma.match.findMany({
      where: {
        ...(tournamentId ? { tournamentId } : {}),
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
      include: {
        tournament: true,
        phase: true,
        homeTeam: true,
        awayTeam: true,
        winnerTeam: true,
        referee: {
          select: { id: true, name: true },
        },
        sets: {
          orderBy: { setNumber: 'asc' },
          include: {
            lineups: true,
          },
        },
      },
      orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
    });

    return {
      teamId,
      liveMatches: matches.filter((m) => m.status === MatchStatus.IN_PROGRESS),
      upcomingFixture: matches.filter(
        (m) => m.status === MatchStatus.SCHEDULED,
      ),
      resultsHistory: matches.filter((m) => m.status === MatchStatus.FINISHED),
    };
  }
}
