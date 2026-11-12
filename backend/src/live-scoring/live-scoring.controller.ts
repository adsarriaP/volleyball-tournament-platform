import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
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
}
