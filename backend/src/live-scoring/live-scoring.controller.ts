import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsPositive, Max, Min } from 'class-validator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ScorePointDto } from './dto/score-point.dto';
import { StartSetDto } from './dto/start-set.dto';
import { UpdateCourtPositionDto } from './dto/update-court-position.dto';
import { LiveScoringService } from './live-scoring.service';

export class UpdateCourtPositionByJerseyDto {
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
  teamId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  positionNumber!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  jerseyNumber!: number;
}

export class FinishSetDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  matchId!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  setId!: number;
}

export class FinishMatchDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  matchId!: number;
}

@Controller('live-scoring')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LiveScoringController {
  constructor(private readonly liveScoringService: LiveScoringService) {}

  @Post('start-set')
  @Roles(Role.REFEREE, Role.ADMIN)
  async startSet(
    @Body() dto: StartSetDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.liveScoringService.startSet(dto, user);
  }

  @Post('score-point')
  @Roles(Role.REFEREE, Role.ADMIN)
  async scorePoint(
    @Body() dto: ScorePointDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.liveScoringService.scorePoint(dto, user);
  }

  @Post('position')
  @Roles(Role.REFEREE, Role.ADMIN)
  async updateCourtPosition(
    @Body() dto: UpdateCourtPositionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.liveScoringService.updateCourtPosition(dto, user);
  }

  @Post('position-by-jersey')
  @Roles(Role.REFEREE, Role.ADMIN)
  async updateCourtPositionByJersey(
    @Body() dto: UpdateCourtPositionByJerseyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.liveScoringService.updateCourtPositionByJersey(dto, user);
  }

  @Post('finish-set')
  @Roles(Role.REFEREE, Role.ADMIN)
  async finishSet(
    @Body() dto: FinishSetDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.liveScoringService.finishSetManually(
      dto.matchId,
      dto.setId,
      user,
    );
  }

  @Post('finish-match')
  @Roles(Role.REFEREE, Role.ADMIN)
  async finishMatch(
    @Body() dto: FinishMatchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.liveScoringService.finishMatchManually(dto.matchId, user);
  }
}
