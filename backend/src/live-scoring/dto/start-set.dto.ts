import { Type } from 'class-transformer';
import { IsArray, ArrayMinSize, ArrayMaxSize, IsInt, IsPositive } from 'class-validator';

export class StartSetDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  matchId!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  setNumber!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  servingTeamId!: number;

  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @Type(() => Number)
  homeLineupPlayerIds!: number[]; // [pos1, pos2, pos3, pos4, pos5, pos6]

  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @Type(() => Number)
  awayLineupPlayerIds!: number[]; // [pos1, pos2, pos3, pos4, pos5, pos6]
}

