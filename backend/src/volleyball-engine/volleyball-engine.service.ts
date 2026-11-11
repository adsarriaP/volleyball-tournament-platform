import { Injectable } from '@nestjs/common';

export interface CourtLineupPositions {
  readonly pos1PlayerId: number;
  readonly pos2PlayerId: number;
  readonly pos3PlayerId: number;
  readonly pos4PlayerId: number;
  readonly pos5PlayerId: number;
  readonly pos6PlayerId: number;
}

export interface TournamentRulesConfig {
  readonly maxSets: number; // 3 o 5
  readonly pointsRegularSet: number; // default 25
  readonly pointsFinalSet: number; // default 15
  readonly pointsDifference: number; // default 2
}

export interface SetCompletionResult {
  readonly isSetCompleted: boolean;
  readonly winnerTeamId: number | null;
}

export interface MatchCompletionResult {
  readonly isMatchFinished: boolean;
  readonly winnerTeamId: number | null;
}

export interface RallyResolutionInput {
  readonly homeTeamId: number;
  readonly awayTeamId: number;
  readonly currentHomeScore: number;
  readonly currentAwayScore: number;
  readonly currentServingTeamId: number | null;
  readonly scoringTeamId: number;
  readonly homeLineup: CourtLineupPositions;
  readonly awayLineup: CourtLineupPositions;
}

export interface RallyResolutionOutput {
  readonly newHomeScore: number;
  readonly newAwayScore: number;
  readonly newServingTeamId: number;
  readonly didServeChange: boolean;
  readonly rotatedTeamId: number | null;
  readonly newHomeLineup: CourtLineupPositions;
  readonly newAwayLineup: CourtLineupPositions;
}

@Injectable()
export class VolleyballEngineService {
  /**
   * 1. Lógica de Rotación en el Voleibol (Sentido Horario):
   * - Posición 1 pasa a Posición 6
   * - Posición 6 pasa a Posición 5
   * - Posición 5 pasa a Posición 4
   * - Posición 4 pasa a Posición 3
   * - Posición 3 pasa a Posición 2
   * - Posición 2 pasa a Posición 1 (nuevo sacador)
   */
  public rotateClockwise(
    lineup: CourtLineupPositions,
  ): CourtLineupPositions {
    return Object.freeze({
      pos1PlayerId: lineup.pos2PlayerId,
      pos2PlayerId: lineup.pos3PlayerId,
      pos3PlayerId: lineup.pos4PlayerId,
      pos4PlayerId: lineup.pos5PlayerId,
      pos5PlayerId: lineup.pos6PlayerId,
      pos6PlayerId: lineup.pos1PlayerId,
    });
  }

  /**
   * Evalúa un punto anotado (rally), actualiza el marcador y aplica rotación
   * únicamente si el equipo receptor recupera el servicio (side-out).
   */
  public resolveRally(input: RallyResolutionInput): RallyResolutionOutput {
    const isHomeScoring = input.scoringTeamId === input.homeTeamId;
    const newHomeScore = isHomeScoring
      ? input.currentHomeScore + 1
      : input.currentHomeScore;
    const newAwayScore = !isHomeScoring
      ? input.currentAwayScore + 1
      : input.currentAwayScore;

    // Hay cambio de saque (side-out) cuando había un equipo sacando y anota el receptor
    const didServeChange =
      input.currentServingTeamId !== null &&
      input.currentServingTeamId !== input.scoringTeamId;

    let newHomeLineup = { ...input.homeLineup };
    let newAwayLineup = { ...input.awayLineup };
    let rotatedTeamId: number | null = null;

    if (didServeChange) {
      if (isHomeScoring) {
        newHomeLineup = this.rotateClockwise(input.homeLineup);
        rotatedTeamId = input.homeTeamId;
      } else {
        newAwayLineup = this.rotateClockwise(input.awayLineup);
        rotatedTeamId = input.awayTeamId;
      }
    }

    return Object.freeze({
      newHomeScore,
      newAwayScore,
      newServingTeamId: input.scoringTeamId,
      didServeChange,
      rotatedTeamId,
      newHomeLineup: Object.freeze(newHomeLineup),
      newAwayLineup: Object.freeze(newAwayLineup),
    });
  }

  /**
   * 2. Criterio de Fin de Set:
   * - Sets regulares: primero en alcanzar `pointsRegularSet` (25) con ventaja >= `pointsDifference` (2).
   * - Set decisivo (tie-break, setNumber === maxSets): primero en alcanzar `pointsFinalSet` (15) con ventaja >= `pointsDifference` (2).
   */
  public evaluateSetCompletion(
    setNumber: number,
    homeScore: number,
    awayScore: number,
    homeTeamId: number,
    awayTeamId: number,
    rules: TournamentRulesConfig,
  ): SetCompletionResult {
    const isFinalDecidingSet = setNumber === rules.maxSets;
    const targetPoints = isFinalDecidingSet
      ? rules.pointsFinalSet
      : rules.pointsRegularSet;
    const scoreDifference = Math.abs(homeScore - awayScore);

    if (
      homeScore >= targetPoints &&
      homeScore - awayScore >= rules.pointsDifference
    ) {
      return Object.freeze({
        isSetCompleted: true,
        winnerTeamId: homeTeamId,
      });
    }

    if (
      awayScore >= targetPoints &&
      awayScore - homeScore >= rules.pointsDifference
    ) {
      return Object.freeze({
        isSetCompleted: true,
        winnerTeamId: awayTeamId,
      });
    }

    return Object.freeze({
      isSetCompleted: false,
      winnerTeamId: null,
    });
  }

  /**
   * 3. Criterio de Fin de Partido:
   * - Mejor de 3 (`maxSets = 3`): gana el primero en llegar a 2 sets.
   * - Mejor de 5 (`maxSets = 5`): gana el primero en llegar a 3 sets.
   */
  public evaluateMatchCompletion(
    homeSetsWon: number,
    awaySetsWon: number,
    homeTeamId: number,
    awayTeamId: number,
    maxSets: number,
  ): MatchCompletionResult {
    const setsRequiredToWin = Math.floor(maxSets / 2) + 1;

    if (homeSetsWon >= setsRequiredToWin) {
      return Object.freeze({
        isMatchFinished: true,
        winnerTeamId: homeTeamId,
      });
    }

    if (awaySetsWon >= setsRequiredToWin) {
      return Object.freeze({
        isMatchFinished: true,
        winnerTeamId: awayTeamId,
      });
    }

    return Object.freeze({
      isMatchFinished: false,
      winnerTeamId: null,
    });
  }
}

