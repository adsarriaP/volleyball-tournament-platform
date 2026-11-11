import { IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class ScorePointDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  matchId!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  setId!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  scoringTeamId!: number;
}

