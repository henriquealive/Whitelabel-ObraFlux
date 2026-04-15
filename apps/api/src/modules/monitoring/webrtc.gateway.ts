import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';

@WebSocketGateway({ namespace: '/monitoring', cors: { origin: '*' } })
export class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebRTCGateway.name);

  constructor(private readonly monitoringService: MonitoringService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-camera')
  async handleJoinCamera(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { cameraId: string; tenantId: string },
  ) {
    try {
      const streamInfo = await this.monitoringService.getCameraStream(payload.cameraId, payload.tenantId);
      client.join(`camera:${payload.cameraId}`);
      client.emit('camera-ready', { cameraId: payload.cameraId, streamUrl: streamInfo.go2rtcUrl });
    } catch (e) {
      client.emit('camera-error', { message: 'Camera not available' });
    }
  }

  @SubscribeMessage('webrtc-offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { cameraId: string; sdp: string },
  ) {
    client.to(`camera:${payload.cameraId}`).emit('webrtc-offer', { ...payload, from: client.id });
  }

  @SubscribeMessage('webrtc-answer')
  handleAnswer(@MessageBody() payload: { to: string; sdp: string }) {
    this.server.to(payload.to).emit('webrtc-answer', { sdp: payload.sdp });
  }

  @SubscribeMessage('webrtc-ice-candidate')
  handleIceCandidate(@MessageBody() payload: { to: string; candidate: unknown }) {
    this.server.to(payload.to).emit('webrtc-ice-candidate', { candidate: payload.candidate });
  }
}
