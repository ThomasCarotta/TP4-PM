// backend/src/orchestrator/orchestrator.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrchestratorService implements OnModuleInit {
  private kafka = new Kafka({ 
    brokers: ['localhost:29092'] // ← CAMBIAR aquí también
  });
  private producer = this.kafka.producer();
  private consumer = this.kafka.consumer({ groupId: 'orchestrator-group' });

  async onModuleInit() {
    await this.producer.connect();
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'txn.commands', fromBeginning: false });

    console.log('✅ Orchestrator listo - Esperando comandos...');

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        try {
          if (!message.value) return;
          
          const raw = message.value.toString();
          const event = JSON.parse(raw);
          
          console.log(`🔄 Procesando transacción: ${event.transactionId}`);
          
          await this.processTransaction(event);
          
        } catch (error) {
          console.error('❌ Error en orchestrator:', error);
        }
      },
    });
  }

  private async processTransaction(event: any) {
    const { transactionId, payload } = event;

    // 1. Reserva de fondos (90% éxito)
    const fundsReserved = {
      eventType: 'FundsReserved',
      transactionId,
      timestamp: new Date().toISOString(),
      payload: {
        ok: Math.random() > 0.1,
        holdId: uuidv4(),
        amount: payload.amount,
        userId: payload.userId // ← IMPORTANTE: agregar userId aquí
      },
    };
    await this.sendToKafka('txn.events', fundsReserved);

    if (!fundsReserved.payload.ok) {
      const reversed = {
        eventType: 'Reversed',
        transactionId,
        timestamp: new Date().toISOString(),
        payload: { 
          reason: 'Fondos insuficientes',
          userId: payload.userId // ← agregar userId
        },
      };
      await this.sendToKafka('txn.events', reversed);
      return;
    }

    // 2. Chequeo de fraude (10% HIGH risk)
    await this.delay(1000); // Simular procesamiento
    
    const fraudRisk = Math.random() > 0.9 ? 'HIGH' : 'LOW';
    const fraudChecked = {
      eventType: 'FraudChecked',
      transactionId,
      timestamp: new Date().toISOString(),
      payload: { 
        risk: fraudRisk,
        userId: payload.userId // ← agregar userId
      },
    };
    await this.sendToKafka('txn.events', fraudChecked);

    if (fraudRisk === 'HIGH') {
      const reversed = {
        eventType: 'Reversed',
        transactionId,
        timestamp: new Date().toISOString(),
        payload: { 
          reason: 'Fraude detectado',
          userId: payload.userId // ← agregar userId
        },
      };
      await this.sendToKafka('txn.events', reversed);
      return;
    }

    // 3. Commit exitoso
    await this.delay(500);
    const committed = {
      eventType: 'Committed',
      transactionId,
      timestamp: new Date().toISOString(),
      payload: { 
        ledgerTxId: uuidv4(),
        userId: payload.userId // ← agregar userId
      },
    };
    await this.sendToKafka('txn.events', committed);

    // 4. Notificación
    await this.delay(300);
    const notified = {
      eventType: 'Notified',
      transactionId,
      timestamp: new Date().toISOString(),
      payload: { 
        channels: ['email', 'push'],
        userId: payload.userId // ← agregar userId
      },
    };
    await this.sendToKafka('txn.events', notified);

    console.log(`✅ Transacción ${transactionId} completada exitosamente`);
  }

  private async sendToKafka(topic: string, event: any) {
    await this.producer.send({
      topic,
      messages: [
        { 
          key: event.transactionId, // Clave para ordenamiento
          value: JSON.stringify(event) 
        }
      ],
    });
    console.log(`📤 ${event.eventType} enviado a ${topic}`);
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}