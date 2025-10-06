import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { kafkaConfig } from './kafka.config';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private client: ClientKafka;

  constructor() {
    // Crear instancia Kafka
    this.client = new ClientKafka(kafkaConfig.options as any);
  }

  // 🔌 Conectarse a Kafka al iniciar el módulo
  async onModuleInit() {
    try {
      await this.client.connect();
      console.log('✅ Kafka conectado');
    } catch (err) {
      console.error('❌ Error conectando a Kafka:', err);
    }
  }

  // 🔌 Desconectar al cerrar la app
  async onModuleDestroy() {
    await this.client.close();
  }

  // 📤 Emitir un evento a un tópico
  async emit(topic: string, message: any, key?: string) {
    try {
      await this.client.emit(topic, {
        key: key || null,
        value: JSON.stringify(message),
      });
      console.log(`📤 Mensaje publicado en "${topic}"`, message);
    } catch (error) {
      console.error(`❌ Error al publicar en "${topic}"`, error);
    }
  }

  // 📥 Escuchar eventos desde un tópico
  async consume(topic: string, callback: (message: any) => void) {
    try {
      // Este método no existe nativamente, así que lo simulamos con subscribeToResponseOf
      this.client.subscribeToResponseOf(topic);
      console.log(`👂 Suscripto al tópico "${topic}"`);

      // Kafka en NestJS no tiene "consume directo" con callbacks,
      // pero podés escuchar desde otro módulo usando EventPattern
    } catch (error) {
      console.error(`❌ Error al suscribirse a "${topic}"`, error);
    }
  }

  getClient() {
    return this.client;
  }
}
