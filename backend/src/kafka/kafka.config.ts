import { KafkaOptions, Transport } from '@nestjs/microservices';

export const kafkaConfig: KafkaOptions = {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:29092'],
    },
    consumer: {
      groupId: 'orchestrator-group',
    },
  },
};


