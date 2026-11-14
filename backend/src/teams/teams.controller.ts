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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  R2StorageService,
  UploadedImageFile,
} from '../storage/r2-storage.service';
import { TeamsService } from './teams.service';

export class PlayerItemDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  jerseyNumber!: number;
}

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  delegateName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tournamentId?: number;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}

@Controller('teams')
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly r2StorageService: R2StorageService,
  ) {}

  @Get()
  async findAll(@Query('tournamentId') tournamentId?: string) {
    return this.teamsService.findAllTeams(
      tournamentId ? Number(tournamentId) : undefined,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findTeamById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async create(
    @Body() dto: CreateTeamDto,
    @UploadedFile() file?: UploadedImageFile,
  ) {
    const savedLogoPath = file
      ? await this.r2StorageService.uploadTeamLogo(file)
      : dto.logoUrl;

    return this.teamsService.createTeam({
      name: dto.name,
      delegateName: dto.delegateName,
      tournamentId: dto.tournamentId ? Number(dto.tournamentId) : undefined,
      logoUrl: savedLogoPath,
    });
  }

  @Post(':id/players')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async addPlayer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PlayerItemDto,
  ) {
    return this.teamsService.addPlayer(id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updateTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTeamDto,
    @UploadedFile() file?: UploadedImageFile,
  ) {
    const savedLogoPath = file
      ? await this.r2StorageService.uploadTeamLogo(file)
      : dto.logoUrl;

    return this.teamsService.updateTeam(id, {
      name: dto.name,
      delegateName: dto.delegateName,
      logoUrl: savedLogoPath,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteTeam(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.deleteTeam(id);
  }
}
