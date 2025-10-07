// src/events/event-types.ts

export type EventEnvelope<T> = {
  eventType: string;
  transactionId: string;
  timestamp: string;
  payload: T;
};

// Inicio de transacción
export type TransactionInitiated = {
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  userId: string;
};

// Reserva de fondos
export type FundsReserved = {
  ok: boolean;
  holdId: string;
  amount: number;
};

// Resultado de chequeo de fraude
export type FraudChecked = {
  risk: 'LOW' | 'HIGH';
};

// Transacción confirmada
export type Committed = {
  ledgerTxId: string;
};

// Transacción revertida
export type Reversed = {
  reason: string;
};

// Notificación final
export type Notified = {
  channels: string[];
};

// Unión de todos los eventos posibles
export type AnyTransactionEvent =
  | EventEnvelope<TransactionInitiated>
  | EventEnvelope<FundsReserved>
  | EventEnvelope<FraudChecked>
  | EventEnvelope<Committed>
  | EventEnvelope<Reversed>
  | EventEnvelope<Notified>;
