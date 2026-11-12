import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MatchStatus, Role } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MatchesService } from './matches.service';

export class ScheduleMatchDto {
  @IsOptional()
  @IsString()
  scheduledAt?: string | null;

  @IsOptional()
  @IsString()
  courtNumber?: string | null;

  @IsOptional()
  @IsString()
  courtMapUrl?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  refereeId?: number | null;
}

export class SetScoreInputDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  setNumber!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  homeScore!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  awayScore!: number;
}

export class UpdateMatchResultDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  homeSetsWon?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  awaySetsWon?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  winnerTeamId?: number | null;

  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetScoreInputDto)
  sets?: SetScoreInputDto[];
}

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('my-assigned')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.REFEREE, Role.ADMIN)
  async getMyAssignedMatches(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.matchesService.findMyAssignedMatches(
      currentUser.id,
      currentUser.role === Role.ADMIN,
    );
  }

  @Get('team/:teamId')
  async getTeamMatches(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Query('tournamentId') tournamentId?: string,
  ) {
    return this.matchesService.findTeamMatches(
      teamId,
      tournamentId ? Number(tournamentId) : undefined,
    );
  }

  @Get(':id/live')
  async getMatchLive(@Param('id', ParseIntPipe) id: number) {
    return this.matchesService.getMatchLivePayload(id);
  }

  @Patch(':id/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async scheduleMatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ScheduleMatchDto,
  ) {
    return this.matchesService.scheduleMatch(id, dto);
  }

  @Patch(':id/result')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateMatchResult(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMatchResultDto,
  ) {
    return this.matchesService.updateMatchResult(id, dto);
  }
}
