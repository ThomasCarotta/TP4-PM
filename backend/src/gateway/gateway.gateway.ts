import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Kafka } from 'kafkajs';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GatewayGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private kafka: Kafka;

  async afterInit() {
    console.log('✅ WebSocket Gateway iniciado');

    // Crear cliente Kafka usando kafkajs
    this.kafka = new Kafka({
      clientId: 'gateway-client',
      brokers: ['localhost:9092 '], //kafka:9092
    });

    const consumer = this.kafka.consumer({ groupId: 'gateway-group' });
    await consumer.connect();
    await consumer.subscribe({ topic: 'txn.events', fromBeginning: true });

    // Escuchar eventos Kafka
    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        const event = JSON.parse(message.value.toString());
        console.log('📥 Evento recibido de Kafka:', event);

        // Emitir por WebSocket
        this.server.emit('transactionEvent', event);
      },
    });
  }
}
