// frontend/utils/websocket.js
import { io } from 'socket.io-client';
import { SOCKET_IO_HOST } from './config';

let socket = null;

/**
 * Inicializa la conexión (idempotente).
 * Llamar desde App.js una vez.
 */
export function initSocket() {
  if (socket) return socket;

  // reconexiones automáticas activadas por defecto
  socket = io(SOCKET_IO_HOST, {
    transports: ['websocket'],
    reconnectionAttempts: 5,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket conectado:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket desconectado:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('🔌 Error conexión socket:', err.message || err);
  });

  return socket;
}

/**
 * Subscribe callback recibe (event) cada vez que llega un transactionEvent
 * Retorna función para unsubscribe.
 */
export function subscribeToTransactionEvents(callback) {
  const s = initSocket();
  const handler = (event) => {
    try {
      callback(event);
    } catch (e) {
      console.error('Error en callback de evento', e);
    }
  };
  s.on('transactionEvent', handler);

  return () => {
    s.off('transactionEvent', handler);
  };
}
