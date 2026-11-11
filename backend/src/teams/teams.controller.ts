import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
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

const teamLogoStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dest = join(process.cwd(), 'uploads', 'teams');
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = extname(file.originalname) || '.png';
    cb(null, `team-${uniqueSuffix}${ext}`);
  },
});

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

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
      storage: teamLogoStorage,
    }),
  )
  async create(
    @Body() dto: CreateTeamDto,
    @UploadedFile() file?: { filename: string },
  ) {
    const savedLogoPath = file
      ? `/uploads/teams/${file.filename}`
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
}
