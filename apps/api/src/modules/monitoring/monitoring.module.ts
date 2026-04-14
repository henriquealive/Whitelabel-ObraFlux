import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { WebRTCGateway } from './webrtc.gateway';

@Module({
  controllers: [MonitoringController],
  providers: [MonitoringService, WebRTCGateway],
  exports: [MonitoringService],
})
export class MonitoringModule {}
