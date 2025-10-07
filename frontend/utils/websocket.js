import { io } from 'socket.io-client';
import { SOCKET_IO_HOST } from './config';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export function initSocket() {
  if (socket) return socket;

  console.log('🔌 Conectando WebSocket a:', SOCKET_IO_HOST);
  
  socket = io(SOCKET_IO_HOST, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('✅ Conectado al WebSocket:', socket.id);
    reconnectAttempts = 0;
    
    // Suscribirse automáticamente con userId por defecto
    socket.emit('subscribe', { userId: 'user1' });
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Desconectado del WebSocket:', reason);
  });

  socket.on('connect_error', (err) => {
    reconnectAttempts++;
    console.warn('🔌 Error conexión socket (intento ${reconnectAttempts}):', err.message);
  });

  socket.on('connected', (data) => {
    console.log('📡 Mensaje del servidor:', data.message);
  });

  socket.on('subscribed', (data) => {
    console.log('📡 Suscripción confirmada:', data);
  });

  socket.on('kafkaStatus', (data) => {
    console.log('📊 Estado de Kafka:', data.connected ? 'Conectado' : 'Desconectado');
  });

  return socket;
}

export function subscribeToTransactionEvents(callback) {
  const s = initSocket();
  const handler = (event) => {
    try {
      console.log('📨 Evento recibido:', event.eventType);
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