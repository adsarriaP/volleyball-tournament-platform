import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateTeamInput {
  name: string;
  delegateName?: string;
  tournamentId?: number;
  logoUrl?: string;
  players?: {
    firstName: string;
    lastName: string;
    jerseyNumber: number;
  }[];
}

export interface AddPlayerInput {
  firstName: string;
  lastName: string;
  jerseyNumber: number;
}

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllTeams(tournamentId?: number) {
    return this.prisma.team.findMany({
      where: tournamentId ? { tournamentId } : undefined,
      include: {
        tournament: {
          select: { id: true, name: true, maxTeams: true },
        },
        players: {
          orderBy: { jerseyNumber: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findTeamById(id: number) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        tournament: true,
        players: {
          orderBy: { jerseyNumber: 'asc' },
        },
      },
    });
    if (!team) {
      throw new NotFoundException(`El equipo #${id} no existe.`);
    }
    return team;
  }

  /**
   * Crea un equipo con validación estricta de:
   * 1. Pertenencia a un torneo existente.
   * 2. No duplicidad de nombre dentro del mismo torneo.
   * 3. No superar el cupo máximo (`maxTeams`) de ese torneo.
   */
  async createTeam(input: CreateTeamInput) {
    if (!input.name || !input.name.trim()) {
      throw new BadRequestException('El nombre del equipo es obligatorio.');
    }

    const trimmedName = input.name.trim();

    if (input.tournamentId) {
      const tournament = await this.prisma.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          teams: true,
        },
      });

      if (!tournament) {
        throw new NotFoundException(
          `El torneo #${input.tournamentId} no existe.`,
        );
      }

      // Validar duplicidad de nombre dentro del torneo
      const existingName = tournament.teams.find(
        (t) => t.name.trim().toLowerCase() === trimmedName.toLowerCase(),
      );
      if (existingName) {
        throw new ConflictException(
          `Ya existe un equipo registrado con el nombre "${trimmedName}" en este torneo.`,
        );
      }

      if (tournament.teams.length >= tournament.maxTeams) {
        throw new BadRequestException(
          `Validación de cupo: El torneo "${tournament.name}" está configurado para un máximo de ${tournament.maxTeams} equipos y ya tiene ${tournament.teams.length} registrados.`,
        );
      }
    }

    const defaultPlayers =
      input.players && input.players.length >= 6
        ? input.players
        : [
            { firstName: 'Jugador', lastName: 'Pos 1', jerseyNumber: 1 },
            { firstName: 'Jugador', lastName: 'Pos 2', jerseyNumber: 2 },
            { firstName: 'Jugador', lastName: 'Pos 3', jerseyNumber: 3 },
            { firstName: 'Jugador', lastName: 'Pos 4', jerseyNumber: 4 },
            { firstName: 'Jugador', lastName: 'Pos 5', jerseyNumber: 5 },
            { firstName: 'Jugador', lastName: 'Pos 6', jerseyNumber: 6 },
          ];

    return this.prisma.team.create({
      data: {
        name: trimmedName,
        delegateName: input.delegateName?.trim() || null,
        tournamentId: input.tournamentId ?? null,
        logoUrl: input.logoUrl ?? null,
        players: {
          create: defaultPlayers.map((p) => ({
            firstName: p.firstName.trim(),
            lastName: p.lastName.trim(),
            jerseyNumber: p.jerseyNumber,
          })),
        },
      },
      include: {
        tournament: {
          select: { id: true, name: true, maxTeams: true },
        },
        players: {
          orderBy: { jerseyNumber: 'asc' },
        },
      },
    });
  }

  async addPlayer(teamId: number, input: AddPlayerInput) {
    await this.findTeamById(teamId);
    return this.prisma.player.create({
      data: {
        teamId,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        jerseyNumber: input.jerseyNumber,
      },
    });
  }

  async updateTeam(
    id: number,
    input: { name?: string; delegateName?: string; logoUrl?: string },
  ) {
    const existing = await this.findTeamById(id);
    const trimmedName = input.name?.trim();

    if (trimmedName && existing.tournamentId) {
      const duplicate = await this.prisma.team.findFirst({
        where: {
          tournamentId: existing.tournamentId,
          id: { not: id },
          name: trimmedName,
        },
      });
      if (duplicate) {
        throw new ConflictException(
          `Ya existe otro equipo con el nombre "${trimmedName}" en este torneo.`,
        );
      }
    }

    return this.prisma.team.update({
      where: { id },
      data: {
        name: trimmedName || undefined,
        delegateName:
          input.delegateName !== undefined
            ? input.delegateName.trim() || null
            : undefined,
        logoUrl: input.logoUrl !== undefined ? input.logoUrl : undefined,
      },
      include: {
        tournament: {
          select: { id: true, name: true, maxTeams: true },
        },
        players: {
          orderBy: { jerseyNumber: 'asc' },
        },
      },
    });
  }

  async deleteTeam(id: number) {
    await this.findTeamById(id);

    const matchCount = await this.prisma.match.count({
      where: {
        OR: [{ homeTeamId: id }, { awayTeamId: id }, { winnerTeamId: id }],
      },
    });

    if (matchCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar un equipo que ya tiene partidos programados o jugados en el torneo.',
      );
    }

    return this.prisma.team.delete({ where: { id } });
  }
}
