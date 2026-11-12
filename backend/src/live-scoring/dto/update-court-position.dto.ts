import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateCourtPositionDto {
  @Type(() => Number)
  @IsInt()
  matchId!: number;

  @Type(() => Number)
  @IsInt()
  setId!: number;

  @Type(() => Number)
  @IsInt()
  teamId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  positionNumber!: number; // 1 to 6

  @Type(() => Number)
  @IsInt()
  playerId!: number;
}

