import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [KafkaModule],
  providers: [OrchestratorService],
})
export class OrchestratorModule {}
