// src/api/api.controller.ts
import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { v4 as uuidv4 } from 'uuid';
import type { TransactionInitiated } from '../events/event-types'; // <- import type

@Controller('transactions')
export class ApiController {
  constructor(private readonly kafka: KafkaService) {}

  @Post()
  async create(@Body() body: TransactionInitiated) { // ok because we used import type
    const VALID_USERS = ['user1', 'user2', 'admin'];

    // Validaciones de negocio
    if (!VALID_USERS.includes(body.userId)) {
      throw new BadRequestException('Usuario no autorizado');
    }
    if (body.amount <= 0) {
      throw new BadRequestException('Monto inválido');
    }
    if (body.fromAccount === body.toAccount) {
      throw new BadRequestException('No se puede transferir a la misma cuenta');
    }

    const transactionId = uuidv4();
    const envelope = {
      eventType: 'TransactionInitiated',
      transactionId,
      timestamp: new Date().toISOString(),
      payload: body,
    };

    // usamos el método emit (ver KafkaService abajo)
    await this.kafka.emit('txn.commands', envelope);
    return { transactionId };
  }
}
