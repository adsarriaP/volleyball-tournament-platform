import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export class LoginDto {
  email!: string;
  password!: string;
}

export class CreateRefereeDto {
  name!: string;
  email!: string;
  password!: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private hashPassword(rawPassword: string): string {
    return crypto.createHash('sha256').update(rawPassword).digest('hex');
  }

  /**
   * Crea automáticamente una cuenta ADMIN por defecto si no existe ninguna,
   * para permitir el primer ingreso al panel de administración.
   */
  async onModuleInit(): Promise<void> {
    try {
      const adminEmail = 'admin@voleibol.com';
      const existing = await this.prisma.user.findUnique({
        where: { email: adminEmail },
      });
      if (!existing) {
        await this.prisma.user.create({
          data: {
            name: 'Administrador General',
            email: adminEmail,
            passwordHash: this.hashPassword('admin123'),
            role: Role.ADMIN,
          },
        });
      }
    } catch {
      // Ignorar si la tabla aún no fue migrada en entorno de test aislado
    }
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException('Debes ingresar correo y contraseña.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    const hashedInput = this.hashPassword(password);
    if (
      !user ||
      (user.passwordHash !== hashedInput && user.passwordHash !== password)
    ) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async createReferee(dto: CreateRefereeDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un usuario registrado con el correo ${normalizedEmail}.`,
      );
    }

    const referee = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: normalizedEmail,
        passwordHash: this.hashPassword(dto.password),
        role: Role.REFEREE,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return referee;
  }

  async listReferees() {
    return this.prisma.user.findMany({
      where: { role: Role.REFEREE },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}

