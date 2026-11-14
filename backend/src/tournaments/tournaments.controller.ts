import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role, TournamentFormatType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TournamentsService } from './tournaments.service';

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(TournamentFormatType)
  formatType!: TournamentFormatType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(128)
  maxTeams?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(16)
  groupsCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxSets?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  pointsRegularSet?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  pointsFinalSet?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pointsDifference?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  qualifiersPerGroup?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(6)
  @Max(22)
  dailyStartHour?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(23)
  dailyEndHour?: number;
}

export class UpdateTournamentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEnum(TournamentFormatType)
  formatType?: TournamentFormatType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(128)
  maxTeams?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(16)
  groupsCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  maxSets?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  pointsRegularSet?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  pointsFinalSet?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pointsDifference?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  qualifiersPerGroup?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(6)
  @Max(22)
  dailyStartHour?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(23)
  dailyEndHour?: number;
}

export class StartTournamentDto {
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  teamIds?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  groupsCount?: number;
}

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  async findAll() {
    return this.tournamentsService.findAllTournaments();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('teamId') teamId?: string,
  ) {
    const parsedTeamId = teamId ? Number(teamId) : undefined;
    return this.tournamentsService.findTournamentDetail(id, parsedTeamId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateTournamentDto) {
    return this.tournamentsService.createTournament(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTournamentDto,
  ) {
    return this.tournamentsService.updateTournament(id, dto);
  }

  @Patch(':id/finish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async finishTournament(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentsService.finishTournament(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentsService.deleteTournament(id);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async startTournament(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StartTournamentDto,
  ) {
    return this.tournamentsService.startTournamentAndGenerateMatchups(id, dto);
  }

  @Post(':id/advance-knockout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async advanceKnockout(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentsService.advanceGroupQualifiersToKnockout(id);
  }
}
