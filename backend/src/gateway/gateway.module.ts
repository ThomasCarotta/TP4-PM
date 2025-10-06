import { Module } from '@nestjs/common';
import { GatewayGateway } from './gateway.gateway';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [KafkaModule],
  providers: [GatewayGateway],
})
export class GatewayModule {}
