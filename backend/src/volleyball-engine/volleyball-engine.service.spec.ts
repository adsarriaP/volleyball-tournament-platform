import {
  CourtLineupPositions,
  TournamentRulesConfig,
  VolleyballEngineService,
} from './volleyball-engine.service';

describe('VolleyballEngineService', () => {
  let service: VolleyballEngineService;

  const initialHomeLineup: CourtLineupPositions = {
    pos1PlayerId: 101, // Sacador actual
    pos2PlayerId: 102,
    pos3PlayerId: 103,
    pos4PlayerId: 104,
    pos5PlayerId: 105,
    pos6PlayerId: 106,
  };

  const initialAwayLineup: CourtLineupPositions = {
    pos1PlayerId: 201,
    pos2PlayerId: 202,
    pos3PlayerId: 203,
    pos4PlayerId: 204,
    pos5PlayerId: 205,
    pos6PlayerId: 206,
  };

  const defaultRulesBestOf5: TournamentRulesConfig = {
    maxSets: 5,
    pointsRegularSet: 25,
    pointsFinalSet: 15,
    pointsDifference: 2,
  };

  const defaultRulesBestOf3: TournamentRulesConfig = {
    maxSets: 3,
    pointsRegularSet: 25,
    pointsFinalSet: 15,
    pointsDifference: 2,
  };

  beforeEach(() => {
    service = new VolleyballEngineService();
  });

  describe('1. Lógica de Rotación Horaria (rotateClockwise & resolveRally)', () => {
    it('debe rotar en sentido horario (P1->P6->P5->P4->P3->P2->P1) cuando el equipo receptor gana el punto', () => {
      const rotated = service.rotateClockwise(initialAwayLineup);

      expect(rotated).toEqual({
        pos1PlayerId: 202, // P2 pasa a P1 (nuevo sacador)
        pos2PlayerId: 203, // P3 pasa a P2
        pos3PlayerId: 204, // P4 pasa a P3
        pos4PlayerId: 205, // P5 pasa a P4
        pos5PlayerId: 206, // P6 pasa a P5
        pos6PlayerId: 201, // P1 pasa a P6
      });
    });

    it('NO debe rotar si el equipo que tenía el saque anota el punto', () => {
      const result = service.resolveRally({
        homeTeamId: 1,
        awayTeamId: 2,
        currentHomeScore: 10,
        currentAwayScore: 8,
        currentServingTeamId: 1, // Saca Local
        scoringTeamId: 1, // Anota Local
        homeLineup: initialHomeLineup,
        awayLineup: initialAwayLineup,
      });

      expect(result.newHomeScore).toBe(11);
      expect(result.newAwayScore).toBe(8);
      expect(result.didServeChange).toBe(false);
      expect(result.rotatedTeamId).toBeNull();
      expect(result.newHomeLineup).toEqual(initialHomeLineup);
      expect(result.newAwayLineup).toEqual(initialAwayLineup);
    });

    it('DEBE rotar únicamente al equipo receptor cuando recupera el saque (side-out)', () => {
      const result = service.resolveRally({
        homeTeamId: 1,
        awayTeamId: 2,
        currentHomeScore: 10,
        currentAwayScore: 8,
        currentServingTeamId: 1, // Saca Local
        scoringTeamId: 2, // Anota Visitante (Receptor)
        homeLineup: initialHomeLineup,
        awayLineup: initialAwayLineup,
      });

      expect(result.newHomeScore).toBe(10);
      expect(result.newAwayScore).toBe(9);
      expect(result.didServeChange).toBe(true);
      expect(result.newServingTeamId).toBe(2);
      expect(result.rotatedTeamId).toBe(2);
      expect(result.newHomeLineup).toEqual(initialHomeLineup);
      expect(result.newAwayLineup.pos1PlayerId).toBe(202);
      expect(result.newAwayLineup.pos6PlayerId).toBe(201);
    });
  });

  describe('2. Criterio de Fin de Set (evaluateSetCompletion)', () => {
    it('cierra un set regular en 25-23', () => {
      const res = service.evaluateSetCompletion(
        1,
        25,
        23,
        1,
        2,
        defaultRulesBestOf5,
      );
      expect(res.isSetCompleted).toBe(true);
      expect(res.winnerTeamId).toBe(1);
    });

    it('continúa un set regular en 25-24 (ventaja menor a 2)', () => {
      const res = service.evaluateSetCompletion(
        1,
        25,
        24,
        1,
        2,
        defaultRulesBestOf5,
      );
      expect(res.isSetCompleted).toBe(false);
      expect(res.winnerTeamId).toBeNull();
    });

    it('cierra un set regular extendido en 26-24', () => {
      const res = service.evaluateSetCompletion(
        2,
        24,
        26,
        1,
        2,
        defaultRulesBestOf5,
      );
      expect(res.isSetCompleted).toBe(true);
      expect(res.winnerTeamId).toBe(2);
    });

    it('evalúa tie-break (set 5 en mejor de 5, o set 3 en mejor de 3) a 15 puntos con diferencia de 2', () => {
      const ongoingTieBreak = service.evaluateSetCompletion(
        3,
        15,
        14,
        1,
        2,
        defaultRulesBestOf3,
      );
      expect(ongoingTieBreak.isSetCompleted).toBe(false);

      const finishedTieBreak = service.evaluateSetCompletion(
        3,
        16,
        14,
        1,
        2,
        defaultRulesBestOf3,
      );
      expect(finishedTieBreak.isSetCompleted).toBe(true);
      expect(finishedTieBreak.winnerTeamId).toBe(1);
    });
  });

  describe('3. Criterio de Fin de Partido (evaluateMatchCompletion)', () => {
    it('finaliza partido al mejor de 3 cuando un equipo alcanza 2 sets', () => {
      expect(service.evaluateMatchCompletion(2, 1, 1, 2, 3)).toEqual({
        isMatchFinished: true,
        winnerTeamId: 1,
      });
      expect(service.evaluateMatchCompletion(1, 1, 1, 2, 3)).toEqual({
        isMatchFinished: false,
        winnerTeamId: null,
      });
    });

    it('finaliza partido al mejor de 5 cuando un equipo alcanza 3 sets', () => {
      expect(service.evaluateMatchCompletion(2, 3, 1, 2, 5)).toEqual({
        isMatchFinished: true,
        winnerTeamId: 2,
      });
      expect(service.evaluateMatchCompletion(2, 2, 1, 2, 5)).toEqual({
        isMatchFinished: false,
        winnerTeamId: null,
      });
    });
  });
});

