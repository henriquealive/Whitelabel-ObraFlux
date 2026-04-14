import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*' } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly userSockets = new Map<string, string[]>();

  handleConnection(client: Socket) {
    this.logger.log(`Notifications client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.userSockets.forEach((sockets, userId) => {
      const idx = sockets.indexOf(client.id);
      if (idx !== -1) { sockets.splice(idx, 1); if (!sockets.length) this.userSockets.delete(userId); }
    });
  }

  @SubscribeMessage('authenticate')
  handleAuth(@ConnectedSocket() client: Socket, @MessageBody() payload: { userId: string }) {
    const existing = this.userSockets.get(payload.userId) ?? [];
    existing.push(client.id);
    this.userSockets.set(payload.userId, existing);
    client.join(`user:${payload.userId}`);
  }

  sendToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
