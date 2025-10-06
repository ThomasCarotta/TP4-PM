import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class ApiService {
  constructor(private readonly kafkaService: KafkaService) {}

  async publishTransactionInitiated(data: any) {
    const transactionId = uuidv4();

    const event = {
      type: 'TransactionInitiated',
      transactionId,
      payload: data,
    };

    await this.kafkaService.emit('txn.commands', event, transactionId);

    return { status: 'Transaction Initiated', transactionId };
  }
}
