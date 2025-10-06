import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { ClientKafka } from '@nestjs/microservices';
import { kafkaConfig } from '../kafka/kafka.config';

@Injectable()
export class OrchestratorService implements OnModuleInit {
  private client: ClientKafka;

  constructor(private readonly kafkaService: KafkaService) {
    this.client = new ClientKafka(kafkaConfig.options as any);
  }

  async onModuleInit() {
    await this.client.connect();
    console.log('🧠 Orchestrator conectado a Kafka');

    // Escuchar comandos del topic txn.commands
    const consumer = this.client.subscribeToResponseOf('txn.commands');

    // No existe un consume directo en ClientKafka, así que lo hacemos manualmente:
    (this.client as any).consumerRun = this.client.consumer.run({
      eachMessage: async ({ message }) => {
        const value = message.value?.toString();
        if (!value) return;
        const command = JSON.parse(value);
        console.log('📥 Comando recibido:', command);
        await this.handleCommand(command);
      },
    });
  }

  // 🔁 Procesar el comando recibido
  async handleCommand(command: any) {
    const { type, transactionId, payload } = command;

    if (type === 'TransactionInitiated') {
      console.log(`⚙️ Procesando TransactionInitiated (${transactionId})...`);

      // Paso 1: Reservar fondos
      await this.delay(1000);
      await this.emitEvent('FundsReserved', transactionId, {
        ok: true,
        holdId: `HOLD-${Math.floor(Math.random() * 1000)}`,
        amount: payload.amount,
      });

      // Paso 2: Chequear fraude (simulado)
      await this.delay(1000);
      const risk = Math.random() < 0.8 ? 'LOW' : 'HIGH';
      await this.emitEvent('FraudChecked', transactionId, { risk });

      // Paso 3: Commit o Reversa según riesgo
      await this.delay(1000);
      if (risk === 'LOW') {
        await this.emitEvent('Committed', transactionId, {
          ledgerTxId: `LEDGER-${Math.floor(Math.random() * 1000)}`,
        });
      } else {
        await this.emitEvent('Reversed', transactionId, {
          reason: 'High risk detected',
        });
      }

      // Paso 4: Notificación
      await this.delay(500);
      await this.emitEvent('Notified', transactionId, {
        channels: ['email', 'push'],
      });

      console.log(`✅ Transacción ${transactionId} completada`);
    }
  }

  // 📤 Emitir evento a txn.events
  async emitEvent(type: string, transactionId: string, payload: any) {
    const event = { type, transactionId, payload };
    await this.kafkaService.emit('txn.events', event, transactionId);
  }

  // ⏱️ Simular espera
  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
