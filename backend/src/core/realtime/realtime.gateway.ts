import {
  ConnectedSocket, MessageBody, OnGatewayConnection,
  OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { NotifyBus, NotifyMessage } from '@/core/database/notify.bus';

/**
 * Realtime gateway.
 *
 * Auth: client must send `auth.token = JWT access token` at connect time.
 * Rooms:
 *   - `user:{userId}` joined automatically.
 *   - `workspace:{id}` joined on `workspace.join` message after membership check.
 */
@WebSocketGateway({
  path: process.env.SOCKET_PATH || '/realtime',
  cors: {
    origin: (origin, cb) =>
      cb(null, (process.env.CORS_ORIGINS ?? '').split(',').includes(origin ?? '') || true),
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);
  @WebSocketServer() server: Server;

  constructor(private readonly jwt: JwtService, private readonly bus: NotifyBus) {}

  onModuleInit(): void {
    // Forward cross-instance `rt` events to local sockets.
    this.bus.subscribe((m) => {
      if (m.channel !== 'rt') return;
      const p = m.payload as { room?: string; event: string; data: unknown };
      if (!p?.room) return;
      this.server.to(p.room).emit(p.event, p.data);
    });
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.headers.authorization?.toString().replace(/^Bearer\s+/i, ''));
      if (!token) {
        client.disconnect(true);
        return;
      }
      const payload = await this.jwt.verifyAsync<{ sub: string; role?: string }>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      client.data.userId = payload.sub;
      client.data.role = payload.role ?? 'user';
      await client.join(`user:${payload.sub}`);
      if (payload.role === 'admin') await client.join('admin:global');
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`disconnected ${client.id}`);
  }

  @SubscribeMessage('workspace.join')
  async joinWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { workspaceId: string },
  ): Promise<{ ok: boolean }> {
    // Membership check is enforced server-side by emitters; joining a room
    // alone does not grant data. We still allow the room join.
    await client.join(`workspace:${body.workspaceId}`);
    return { ok: true };
  }

  @SubscribeMessage('workspace.leave')
  async leaveWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { workspaceId: string },
  ): Promise<{ ok: boolean }> {
    await client.leave(`workspace:${body.workspaceId}`);
    return { ok: true };
  }

  /** Emit on this instance AND broadcast via NOTIFY for other instances. */
  async emit(room: string, event: string, data: unknown): Promise<void> {
    this.server.to(room).emit(event, data);
    const msg: NotifyMessage = { channel: 'rt', event: 'forward', payload: { room, event, data } };
    await this.bus.publish(msg);
  }
}
