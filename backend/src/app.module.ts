import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiModule } from './api/api.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { GatewayModule } from './gateway/gateway.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [ApiModule, OrchestratorModule, GatewayModule, KafkaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

