export type UserRole = 'ADMIN' | 'REFEREE' | 'TEAM_REP';

export type TournamentFormatType =
  | 'LEAGUE_ONLY'
  | 'KNOCKOUT_ONLY'
  | 'GROUPS_THEN_KNOCKOUT';

export type TournamentStatus = 'ACTIVE' | 'FINISHED';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Player {
  id: number;
  teamId: number;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
}

export interface Team {
  id: number;
  tournamentId?: number | null;
  name: string;
  delegateName?: string | null;
  logoUrl?: string | null;
  players?: Player[];
}

export interface LineupPositions {
  pos1: Player;
  pos2: Player;
  pos3: Player;
  pos4: Player;
  pos5: Player;
  pos6: Player;
}

export interface MatchSetState {
  id: number;
  setNumber: number;
  homeScore: number;
  awayScore: number;
  servingTeamId: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  winnerTeamId?: number;
  homeLineup?: LineupPositions;
  awayLineup?: LineupPositions;
}

export interface TournamentRules {
  id: number;
  name: string;
  status?: TournamentStatus;
  formatType: TournamentFormatType;
  maxTeams: number;
  groupsCount: number;
  maxSets: number;
  pointsRegularSet: number;
  pointsFinalSet: number;
  pointsDifference: number;
  qualifiersPerGroup: number;
  startDate?: string | null;
  endDate?: string | null;
  dailyStartHour?: number;
  dailyEndHour?: number;
}

export interface MatchSummary {
  id: number;
  tournamentId: number;
  phaseId: number;
  homeTeamId: number;
  awayTeamId: number;
  refereeId: number | null;
  scheduledAt: string | null;
  courtNumber: string | null;
  courtMapUrl?: string | null;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
  homeSetsWon: number;
  awaySetsWon: number;
  winnerTeamId?: number | null;
  homeTeam: Team;
  awayTeam: Team;
  tournament?: TournamentRules;
  phase?: { id: number; name: string };
  referee?: { id: number; name: string; email?: string } | null;
  sets?: MatchSetState[];
}

export interface MatchLivePayload {
  matchId: number;
  tournament?: TournamentRules;
  phase?: { id: number; name: string };
  scheduledAt?: string | null;
  courtNumber?: string | null;
  courtMapUrl?: string | null;
  referee?: { id: number; name: string; email?: string } | null;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED';
  homeTeam: Team;
  awayTeam: Team;
  homeSetsWon: number;
  awaySetsWon: number;
  winnerTeamId?: number | null;
  currentSet: MatchSetState;
  setsHistory: MatchSetState[];
  didServeChange?: boolean;
  rotatedTeamId?: number | null;
}

export interface StandingRow {
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
  isQualified?: boolean;
}

export interface GroupStandingBlock {
  groupName: string;
  qualifiersPerGroup: number;
  standings: StandingRow[];
}

export interface TournamentDetail extends TournamentRules {
  teams: Team[];
  standings: StandingRow[];
  groupStandings?: GroupStandingBlock[];
  matches: MatchSummary[];
  filteredMatches: MatchSummary[];
  liveMatches: MatchSummary[];
  upcomingMatches: MatchSummary[];
  finishedMatches: MatchSummary[];
}
