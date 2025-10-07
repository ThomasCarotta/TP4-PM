// backend/src/kafka/kafka.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Partitioners } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka = new Kafka({ 
    brokers: ['localhost:29092'],
    logLevel: 1 // Solo errores
  });
  private producer: Producer;

  async onModuleInit() {
    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner // ← Eliminar warning
    });
    await this.producer.connect();
    console.log('✅ Kafka Producer conectado a localhost:29092');
  }

  async emit(topic: string, event: any) {
    try {
      await this.producer.send({
        topic,
        messages: [
          { 
            key: event.transactionId,
            value: JSON.stringify(event) 
          }
        ],
      });
      console.log(`📤 Evento enviado a ${topic}: ${event.eventType}`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando evento a Kafka:', error.message);
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.producer) await this.producer.disconnect();
  }
}