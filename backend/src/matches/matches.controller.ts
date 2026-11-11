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
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
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
}
