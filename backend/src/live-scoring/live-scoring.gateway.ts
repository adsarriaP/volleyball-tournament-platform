import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MatchStatus, SetStatus } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { CourtLineupPositions } from '../volleyball-engine/volleyball-engine.service';

export interface MatchScoreUpdatedPayload {
  readonly matchId: number;
  readonly setId: number;
  readonly setNumber: number;
  readonly homeTeamId: number;
  readonly awayTeamId: number;
  readonly homeScore: number;
  readonly awayScore: number;
  readonly homeSetsWon: number;
  readonly awaySetsWon: number;
  readonly servingTeamId: number;
  readonly didServeChange: boolean;
  readonly rotatedTeamId: number | null;
  readonly homeLineup: CourtLineupPositions;
  readonly awayLineup: CourtLineupPositions;
  readonly setStatus: SetStatus;
  readonly setWinnerTeamId: number | null;
  readonly matchStatus: MatchStatus;
  readonly matchWinnerTeamId: number | null;
  readonly updatedAt: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
    credentials: true,
  },
})
export class LiveScoringGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(LiveScoringGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket): void {
    this.logger.log(`Cliente conectado a WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Cliente desconectado de WebSocket: ${client.id}`);
  }

  public getRoomName(matchId: number): string {
    return `match_${matchId}`;
  }

  @SubscribeMessage('joinMatchRoom')
  async handleJoinMatchRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: number | { matchId: number },
  ): Promise<{ event: string; data: { room: string; matchId: number } }> {
    const matchId =
      typeof payload === 'number' ? payload : Number(payload?.matchId);
    const roomName = this.getRoomName(matchId);

    await client.join(roomName);
    this.logger.log(`Cliente ${client.id} se unió a la sala ${roomName}`);

    return {
      event: 'joinedMatchRoom',
      data: { room: roomName, matchId },
    };
  }

  @SubscribeMessage('leaveMatchRoom')
  async handleLeaveMatchRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: number | { matchId: number },
  ): Promise<{ event: string; data: { room: string; matchId: number } }> {
    const matchId =
      typeof payload === 'number' ? payload : Number(payload?.matchId);
    const roomName = this.getRoomName(matchId);

    await client.leave(roomName);
    return {
      event: 'leftMatchRoom',
      data: { room: roomName, matchId },
    };
  }

  /**
   * Emite a todos los clientes suscritos a `match_${matchId}` el estado actualizado
   * del set, marcador, saque y rotaciones de ambos equipos.
   */
  public emitMatchScoreUpdated(payload: MatchScoreUpdatedPayload): void {
    const roomName = this.getRoomName(payload.matchId);
    this.server.to(roomName).emit('matchScoreUpdated', payload);
  }
}

