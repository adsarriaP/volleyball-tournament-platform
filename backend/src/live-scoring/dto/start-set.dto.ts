import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';

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

  @IsOptional()
  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @Type(() => Number)
  homeLineupPlayerIds?: number[]; // [pos1, pos2, pos3, pos4, pos5, pos6]

  @IsOptional()
  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @Type(() => Number)
  awayLineupPlayerIds?: number[]; // [pos1, pos2, pos3, pos4, pos5, pos6]

  @IsOptional()
  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @Type(() => Number)
  homeJerseyNumbers?: number[]; // Dorsales directos [pos1..pos6]

  @IsOptional()
  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @Type(() => Number)
  awayJerseyNumbers?: number[]; // Dorsales directos [pos1..pos6]
}

