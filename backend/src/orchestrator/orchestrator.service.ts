// backend/src/orchestrator/orchestrator.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Partitioners } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrchestratorService implements OnModuleInit {
  private kafka = new Kafka({ 
    brokers: ['localhost:29092'],
    logLevel: 1
  });
  private producer = this.kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner
  });
  private consumer = this.kafka.consumer({ 
    groupId: 'orchestrator-group-v2' // ← Cambiar groupId
  });

  async onModuleInit() {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      await this.consumer.subscribe({ 
        topic: 'txn.commands', 
        fromBeginning: true 
      });

      console.log('✅ Orchestrator conectado a Kafka - Esperando comandos...');

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
    } catch (error) {
      console.error('❌ Error conectando Orchestrator a Kafka:', error.message);
      // Reintentar después de 5 segundos
      setTimeout(() => this.onModuleInit(), 5000);
    }
  }

  private async processTransaction(event: any) {
    const { transactionId, payload } = event;

    console.log(`🔍 Iniciando procesamiento para transacción: ${transactionId}`);

    // 1. Reserva de fondos
    await this.delay(500);
    const fundsSuccess = Math.random() > 0.1;
    
    const fundsReserved = {
      eventType: 'FundsReserved',
      transactionId,
      timestamp: new Date().toISOString(),
      payload: {
        ok: fundsSuccess,
        holdId: uuidv4(),
        amount: payload.amount,
        userId: payload.userId
      },
    };
    await this.sendToKafka('txn.events', fundsReserved);

    if (!fundsSuccess) {
      console.log(`❌ Fondos insuficientes para transacción: ${transactionId}`);
      const reversed = {
        eventType: 'Reversed',
        transactionId,
        timestamp: new Date().toISOString(),
        payload: { 
          reason: 'Fondos insuficientes',
          userId: payload.userId
        },
      };
      await this.sendToKafka('txn.events', reversed);
      return;
    }

    // 2. Chequeo de fraude
    await this.delay(800);
    const fraudRisk = Math.random() > 0.9 ? 'HIGH' : 'LOW';
    
    const fraudChecked = {
      eventType: 'FraudChecked',
      transactionId,
      timestamp: new Date().toISOString(),
      payload: { 
        risk: fraudRisk,
        userId: payload.userId
      },
    };
    await this.sendToKafka('txn.events', fraudChecked);

    if (fraudRisk === 'HIGH') {
      console.log(`🚨 Fraude detectado en transacción: ${transactionId}`);
      const reversed = {
        eventType: 'Reversed',
        transactionId,
        timestamp: new Date().toISOString(),
        payload: { 
          reason: 'Fraude detectado',
          userId: payload.userId
        },
      };
      await this.sendToKafka('txn.events', reversed);
      return;
    }

    // 3. Commit exitoso
    await this.delay(600);
    const committed = {
      eventType: 'Committed',
      transactionId,
      timestamp: new Date().toISOString(),
      payload: { 
        ledgerTxId: uuidv4(),
        userId: payload.userId
      },
    };
    await this.sendToKafka('txn.events', committed);

    // 4. Notificación
    await this.delay(400);
    const notified = {
      eventType: 'Notified',
      transactionId,
      timestamp: new Date().toISOString(),
      payload: { 
        channels: ['email', 'push'],
        userId: payload.userId
      },
    };
    await this.sendToKafka('txn.events', notified);

    console.log(`✅ Transacción ${transactionId} completada exitosamente`);
  }

  private async sendToKafka(topic: string, event: any) {
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
      console.log(`📤 ${event.eventType} enviado a ${topic}`);
    } catch (error) {
      console.error(`❌ Error enviando ${event.eventType} a Kafka:`, error.message);
    }
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}