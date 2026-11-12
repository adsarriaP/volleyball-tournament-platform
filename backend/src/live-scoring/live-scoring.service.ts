import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MatchStatus, Role, SetStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { MatchesService } from '../matches/matches.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CourtLineupPositions,
  VolleyballEngineService,
} from '../volleyball-engine/volleyball-engine.service';
import { ScorePointDto } from './dto/score-point.dto';
import { StartSetDto } from './dto/start-set.dto';
import { UpdateCourtPositionDto } from './dto/update-court-position.dto';
import {
  LiveScoringGateway,
  MatchScoreUpdatedPayload,
} from './live-scoring.gateway';

@Injectable()
export class LiveScoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly volleyballEngine: VolleyballEngineService,
    private readonly liveScoringGateway: LiveScoringGateway,
    private readonly matchesService: MatchesService,
  ) {}

  /**
   * Inicia o configura un set registrando la alineación inicial de 6 jugadores
   * (posiciones 1 a 6) de ambos equipos y el equipo con el primer saque.
   */
  public async startSet(dto: StartSetDto, currentUser: AuthenticatedUser) {
    await this.prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: dto.matchId },
      });

      if (!match) {
        throw new NotFoundException(`El partido #${dto.matchId} no existe.`);
      }

      const isAdmin = currentUser.role === Role.ADMIN;
      const isAssignedReferee =
        currentUser.role === Role.REFEREE && match.refereeId === currentUser.id;

      if (!isAdmin && !isAssignedReferee) {
        throw new ForbiddenException(
          'Solo el juez asignado al partido o el administrador puede iniciar un set.',
        );
      }

      let matchSet = await tx.matchSet.findUnique({
        where: {
          matchId_setNumber: {
            matchId: match.id,
            setNumber: dto.setNumber,
          },
        },
      });

      if (!matchSet) {
        matchSet = await tx.matchSet.create({
          data: {
            matchId: match.id,
            setNumber: dto.setNumber,
            homeScore: 0,
            awayScore: 0,
            servingTeamId: dto.servingTeamId,
            status: SetStatus.IN_PROGRESS,
          },
        });
      } else {
        matchSet = await tx.matchSet.update({
          where: { id: matchSet.id },
          data: {
            servingTeamId: dto.servingTeamId,
            status: SetStatus.IN_PROGRESS,
          },
        });
      }

      const [h1, h2, h3, h4, h5, h6] = dto.homeLineupPlayerIds;
      const [a1, a2, a3, a4, a5, a6] = dto.awayLineupPlayerIds;

      await tx.setLineup.upsert({
        where: {
          setId_teamId: {
            setId: matchSet.id,
            teamId: match.homeTeamId,
          },
        },
        update: {
          pos1PlayerId: h1,
          pos2PlayerId: h2,
          pos3PlayerId: h3,
          pos4PlayerId: h4,
          pos5PlayerId: h5,
          pos6PlayerId: h6,
        },
        create: {
          setId: matchSet.id,
          teamId: match.homeTeamId,
          pos1PlayerId: h1,
          pos2PlayerId: h2,
          pos3PlayerId: h3,
          pos4PlayerId: h4,
          pos5PlayerId: h5,
          pos6PlayerId: h6,
        },
      });

      await tx.setLineup.upsert({
        where: {
          setId_teamId: {
            setId: matchSet.id,
            teamId: match.awayTeamId,
          },
        },
        update: {
          pos1PlayerId: a1,
          pos2PlayerId: a2,
          pos3PlayerId: a3,
          pos4PlayerId: a4,
          pos5PlayerId: a5,
          pos6PlayerId: a6,
        },
        create: {
          setId: matchSet.id,
          teamId: match.awayTeamId,
          pos1PlayerId: a1,
          pos2PlayerId: a2,
          pos3PlayerId: a3,
          pos4PlayerId: a4,
          pos5PlayerId: a5,
          pos6PlayerId: a6,
        },
      });

      if (match.status === MatchStatus.SCHEDULED) {
        await tx.match.update({
          where: { id: match.id },
          data: { status: MatchStatus.IN_PROGRESS },
        });
      }
    });

    const livePayload = await this.matchesService.getMatchLivePayload(
      dto.matchId,
    );
    this.liveScoringGateway.server
      .to(this.liveScoringGateway.getRoomName(dto.matchId))
      .emit('matchScoreUpdated', livePayload);

    return livePayload;
  }

  /**
   * Registra un punto en vivo dentro de una transacción ACID de Prisma
   * y emite el estado actualizado a la sala WebSocket del partido.
   */
  public async scorePoint(
    dto: ScorePointDto,
    currentUser: AuthenticatedUser,
  ): Promise<MatchScoreUpdatedPayload & { liveState?: unknown }> {
    const updatedState = await this.prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: dto.matchId },
        include: {
          tournament: true,
        },
      });

      if (!match) {
        throw new NotFoundException(`El partido #${dto.matchId} no existe.`);
      }

      const isAdmin = currentUser.role === Role.ADMIN;
      const isAssignedReferee =
        currentUser.role === Role.REFEREE && match.refereeId === currentUser.id;

      if (!isAdmin && !isAssignedReferee) {
        throw new ForbiddenException(
          'Solo el juez asignado a este partido o un administrador puede registrar puntos.',
        );
      }

      if (
        match.status === MatchStatus.FINISHED ||
        match.status === MatchStatus.CANCELLED
      ) {
        throw new BadRequestException(
          `El partido se encuentra en estado ${match.status} y no admite más puntos.`,
        );
      }

      if (
        dto.scoringTeamId !== match.homeTeamId &&
        dto.scoringTeamId !== match.awayTeamId
      ) {
        throw new BadRequestException(
          'El equipo anotador no pertenece a este partido.',
        );
      }

      const currentSet = await tx.matchSet.findUnique({
        where: { id: dto.setId },
        include: {
          lineups: true,
        },
      });

      if (!currentSet || currentSet.matchId !== match.id) {
        throw new NotFoundException(
          `El set #${dto.setId} no existe o no pertenece al partido #${match.id}.`,
        );
      }

      if (currentSet.status === SetStatus.COMPLETED) {
        throw new BadRequestException(
          `El set #${currentSet.setNumber} ya está finalizado.`,
        );
      }

      const homeLineupRecord = currentSet.lineups.find(
        (l) => l.teamId === match.homeTeamId,
      );
      const awayLineupRecord = currentSet.lineups.find(
        (l) => l.teamId === match.awayTeamId,
      );

      if (!homeLineupRecord || !awayLineupRecord) {
        throw new BadRequestException(
          'Ambos equipos deben tener su formación inicial (posiciones 1 a 6) registrada en SetLineup antes de anotar puntos.',
        );
      }

      const homeLineup: CourtLineupPositions = {
        pos1PlayerId: homeLineupRecord.pos1PlayerId,
        pos2PlayerId: homeLineupRecord.pos2PlayerId,
        pos3PlayerId: homeLineupRecord.pos3PlayerId,
        pos4PlayerId: homeLineupRecord.pos4PlayerId,
        pos5PlayerId: homeLineupRecord.pos5PlayerId,
        pos6PlayerId: homeLineupRecord.pos6PlayerId,
      };

      const awayLineup: CourtLineupPositions = {
        pos1PlayerId: awayLineupRecord.pos1PlayerId,
        pos2PlayerId: awayLineupRecord.pos2PlayerId,
        pos3PlayerId: awayLineupRecord.pos3PlayerId,
        pos4PlayerId: awayLineupRecord.pos4PlayerId,
        pos5PlayerId: awayLineupRecord.pos5PlayerId,
        pos6PlayerId: awayLineupRecord.pos6PlayerId,
      };

      const rallyOutcome = this.volleyballEngine.resolveRally({
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        currentHomeScore: currentSet.homeScore,
        currentAwayScore: currentSet.awayScore,
        currentServingTeamId: currentSet.servingTeamId,
        scoringTeamId: dto.scoringTeamId,
        homeLineup,
        awayLineup,
      });

      if (rallyOutcome.didServeChange) {
        if (rallyOutcome.rotatedTeamId === match.homeTeamId) {
          await tx.setLineup.update({
            where: { id: homeLineupRecord.id },
            data: { ...rallyOutcome.newHomeLineup },
          });
        } else if (rallyOutcome.rotatedTeamId === match.awayTeamId) {
          await tx.setLineup.update({
            where: { id: awayLineupRecord.id },
            data: { ...rallyOutcome.newAwayLineup },
          });
        }
      }

      const setCompletion = this.volleyballEngine.evaluateSetCompletion(
        currentSet.setNumber,
        rallyOutcome.newHomeScore,
        rallyOutcome.newAwayScore,
        match.homeTeamId,
        match.awayTeamId,
        {
          maxSets: match.tournament.maxSets,
          pointsRegularSet: match.tournament.pointsRegularSet,
          pointsFinalSet: match.tournament.pointsFinalSet,
          pointsDifference: match.tournament.pointsDifference,
        },
      );

      const newSetStatus = setCompletion.isSetCompleted
        ? SetStatus.COMPLETED
        : SetStatus.IN_PROGRESS;

      await tx.matchSet.update({
        where: { id: currentSet.id },
        data: {
          homeScore: rallyOutcome.newHomeScore,
          awayScore: rallyOutcome.newAwayScore,
          servingTeamId: rallyOutcome.newServingTeamId,
          status: newSetStatus,
          winnerTeamId: setCompletion.winnerTeamId,
        },
      });

      let updatedHomeSetsWon = match.homeSetsWon;
      let updatedAwaySetsWon = match.awaySetsWon;
      let updatedMatchStatus: MatchStatus =
        match.status === MatchStatus.SCHEDULED
          ? MatchStatus.IN_PROGRESS
          : match.status;
      let matchWinnerTeamId: number | null = match.winnerTeamId;

      if (setCompletion.isSetCompleted && setCompletion.winnerTeamId !== null) {
        if (setCompletion.winnerTeamId === match.homeTeamId) {
          updatedHomeSetsWon += 1;
        } else {
          updatedAwaySetsWon += 1;
        }

        const matchCompletion = this.volleyballEngine.evaluateMatchCompletion(
          updatedHomeSetsWon,
          updatedAwaySetsWon,
          match.homeTeamId,
          match.awayTeamId,
          match.tournament.maxSets,
        );

        if (matchCompletion.isMatchFinished) {
          updatedMatchStatus = MatchStatus.FINISHED;
          matchWinnerTeamId = matchCompletion.winnerTeamId;
        }
      }

      await tx.match.update({
        where: { id: match.id },
        data: {
          status: updatedMatchStatus,
          homeSetsWon: updatedHomeSetsWon,
          awaySetsWon: updatedAwaySetsWon,
          winnerTeamId: matchWinnerTeamId,
        },
      });

      const payload: MatchScoreUpdatedPayload = {
        matchId: match.id,
        setId: currentSet.id,
        setNumber: currentSet.setNumber,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeScore: rallyOutcome.newHomeScore,
        awayScore: rallyOutcome.newAwayScore,
        homeSetsWon: updatedHomeSetsWon,
        awaySetsWon: updatedAwaySetsWon,
        servingTeamId: rallyOutcome.newServingTeamId,
        didServeChange: rallyOutcome.didServeChange,
        rotatedTeamId: rallyOutcome.rotatedTeamId,
        homeLineup: rallyOutcome.newHomeLineup,
        awayLineup: rallyOutcome.newAwayLineup,
        setStatus: newSetStatus,
        setWinnerTeamId: setCompletion.winnerTeamId,
        matchStatus: updatedMatchStatus,
        matchWinnerTeamId,
        updatedAt: new Date().toISOString(),
      };

      return payload;
    });

    const liveState = await this.matchesService.getMatchLivePayload(
      dto.matchId,
    );

    this.liveScoringGateway.server
      .to(this.liveScoringGateway.getRoomName(dto.matchId))
      .emit('matchScoreUpdated', {
        ...liveState,
        didServeChange: updatedState.didServeChange,
        rotatedTeamId: updatedState.rotatedTeamId,
      });

    return {
      ...updatedState,
      liveState,
    };
  }

  /**
   * Permite al árbitro o administrador sustituir o corregir directamente
   * el jugador/número en una posición específica de la cancha (P1 a P6).
   */
  public async updateCourtPosition(
    dto: UpdateCourtPositionDto,
    currentUser: AuthenticatedUser,
  ) {
    const match = await this.prisma.match.findUnique({
      where: { id: dto.matchId },
    });

    if (!match) {
      throw new NotFoundException(`El partido #${dto.matchId} no existe.`);
    }

    const isAdmin = currentUser.role === Role.ADMIN;
    const isAssignedReferee =
      currentUser.role === Role.REFEREE && match.refereeId === currentUser.id;

    if (!isAdmin && !isAssignedReferee) {
      throw new ForbiddenException(
        'Solo el juez asignado al partido o el administrador puede modificar las posiciones de cancha.',
      );
    }

    const posField = `pos${dto.positionNumber}PlayerId`;

    await this.prisma.setLineup.update({
      where: {
        setId_teamId: {
          setId: dto.setId,
          teamId: dto.teamId,
        },
      },
      data: {
        [posField]: dto.playerId,
      },
    });

    const liveState = await this.matchesService.getMatchLivePayload(dto.matchId);

    this.liveScoringGateway.server
      .to(this.liveScoringGateway.getRoomName(dto.matchId))
      .emit('matchScoreUpdated', {
        ...liveState,
        didServeChange: false,
        rotatedTeamId: null,
      });

    return liveState;
  }
}
