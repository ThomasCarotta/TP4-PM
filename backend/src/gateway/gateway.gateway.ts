// backend/src/gateway/gateway.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Kafka } from 'kafkajs';

@WebSocketGateway({ 
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})
export class GatewayGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private kafka = new Kafka({ 
    brokers: ['localhost:29092'],
    logLevel: 1
  });
  private consumer = this.kafka.consumer({ 
    groupId: 'gateway-group-v3'
  });
  private userSockets = new Map<string, string>();
  private isKafkaConnected = false;

  async afterInit() {
    console.log('🚀 WebSocket Gateway inicializado');
    await this.setupKafkaConsumer();
  }

  async setupKafkaConsumer() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ 
        topic: 'txn.events', 
        fromBeginning: true 
      });

      console.log('✅ Gateway conectado a Kafka - Escuchando eventos...');
      this.isKafkaConnected = true;

      // Notificar a todos los clientes conectados
      this.server.emit('kafkaStatus', { connected: true });

      await this.consumer.run({
        eachMessage: async ({ message }) => {
          try {
            if (!message.value) return;
            
            const raw = message.value.toString();
            const event = JSON.parse(raw);
            
            console.log(`📨 Evento recibido de Kafka: ${event.eventType}`);
            
            // BUSCAR USERID EN DIFERENTES UBICACIONES
            let userId = null;
            
            // Opción 1: En el payload del evento
            if (event.payload && event.payload.userId) {
              userId = event.payload.userId;
            }
            // Opción 2: En el envelope del evento (si existe)
            else if (event.userId) {
              userId = event.userId;
            }
            
            console.log(`👤 UserId encontrado: ${userId}`);
            
            if (userId) {
              const socketId = this.userSockets.get(userId);
              if (socketId) {
                this.server.to(socketId).emit('transactionEvent', event);
                console.log(`📤 Evento enviado a usuario ${userId}: ${event.eventType}`);
              } else {
                console.log(`❌ No hay socket para usuario: ${userId}`);
                // ENVIAR A TODOS LOS CLIENTES COMO FALLBACK
                this.server.emit('transactionEvent', event);
                console.log(`📤 Evento enviado a todos los clientes: ${event.eventType}`);
              }
            } else {
              console.log('❌ No se encontró userId en el evento, enviando a todos');
              // ENVIAR A TODOS LOS CLIENTES SI NO HAY USERID
              this.server.emit('transactionEvent', event);
            }
            
          } catch (error) {
            console.error('❌ Error procesando mensaje Kafka:', error);
          }
        },
      });
    } catch (error) {
      console.error('❌ Error conectando Gateway a Kafka:', error.message);
      this.isKafkaConnected = false;
      this.server.emit('kafkaStatus', { connected: false });
      setTimeout(() => this.setupKafkaConsumer(), 5000);
    }
  }

  async handleConnection(client: Socket) {
    console.log(`🔌 Cliente conectado: ${client.id}`);

    // Informar estado de Kafka
    client.emit('kafkaStatus', { 
      connected: this.isKafkaConnected 
    });

    client.on('subscribe', (data: { userId?: string }) => {
      const userId = data?.userId;
      if (userId) {
        this.userSockets.set(userId, client.id);
        console.log(`📡 Usuario suscrito: ${userId} -> ${client.id}`);
        
        client.emit('subscribed', { 
          userId, 
          success: true,
          kafkaConnected: this.isKafkaConnected
        });
      }
    });

    client.emit('connected', { 
      message: 'Conectado al servidor WebSocket',
      kafkaConnected: this.isKafkaConnected
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Cliente desconectado: ${client.id}`);
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        console.log(`📡 Usuario desuscrito: ${userId}`);
        break;
      }
    }
  }
}