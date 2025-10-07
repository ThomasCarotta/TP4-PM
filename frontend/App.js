// frontend/App.js
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, StatusBar } from 'react-native';
import TransactionForm from './components/TransactionForm';
import TransactionTimeline from './components/TransactionTimeline';
import { initSocket, subscribeToTransactionEvents } from './utils/websocket';

export default function App() {
  const [eventsMap, setEventsMap] = useState({});
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [kafkaConnected, setKafkaConnected] = useState(false);

  useEffect(() => {
    const socket = initSocket();

    socket.on('connect', () => {
      console.log('✅ Conectado al WebSocket:', socket.id);
      setSocketConnected(true);
      
      // Suscribirse con userId por defecto
      socket.emit('subscribe', { userId: 'user1' });
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado del WebSocket');
      setSocketConnected(false);
      setKafkaConnected(false);
    });

    socket.on('connected', (data) => {
      console.log('📡 Mensaje del servidor:', data.message);
    });

    socket.on('subscribed', (data) => {
      console.log('📡 Suscripción confirmada para usuario:', data.userId);
    });

    socket.on('kafkaStatus', (data) => {
      console.log('📊 Estado de Kafka:', data.connected ? 'Conectado' : 'Desconectado');
      setKafkaConnected(data.connected);
    });

    // Recibir eventos de transacciones
    const unsubscribe = subscribeToTransactionEvents((event) => {
      console.log('📨 Evento recibido:', event.eventType);
      
      const txId = event.transactionId;
      if (!txId) return;

      setEventsMap((prev) => {
        const prevList = prev[txId] || [];
        const newItem = { 
          ...event, 
          receivedAt: Date.now(),
          type: event.eventType
        };
        return { ...prev, [txId]: [...prevList, newItem] };
      });

      setSelectedTransactionId((cur) => cur || txId);
    });

    return () => {
      unsubscribe();
      socket.disconnect();
    };
  }, []);

  const handleNewTransaction = (transactionId) => {
    setEventsMap((prev) => ({ ...prev, [transactionId]: [] }));
    setSelectedTransactionId(transactionId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header con estados de conexión */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TP4 — Simulador de Transacciones</Text>
        <View style={styles.statusContainer}>
          <Text style={[styles.status, socketConnected ? styles.connected : styles.disconnected]}>
            WebSocket: {socketConnected ? '✅' : '❌'}
          </Text>
          <Text style={[styles.status, kafkaConnected ? styles.connected : styles.disconnected]}>
            Kafka: {kafkaConnected ? '✅' : '❌'}
          </Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <TransactionForm onNewTransaction={handleNewTransaction} />
      </View>

      <View style={styles.timelineContainer}>
        <TransactionTimeline
          transactionId={selectedTransactionId}
          events={selectedTransactionId ? eventsMap[selectedTransactionId] || [] : []}
          transactionsList={Object.keys(eventsMap)}
          onSelectTransaction={setSelectedTransactionId}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f6f7fb', 
    padding: 12 
  },
  header: { 
    marginBottom: 16 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    textAlign: 'center',
    color: '#1c1c1e',
    marginBottom: 8
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connected: { 
    backgroundColor: '#d4edda', 
    color: '#155724' 
  },
  disconnected: { 
    backgroundColor: '#f8d7da', 
    color: '#721c24' 
  },
  formContainer: { 
    marginBottom: 16 
  },
  timelineContainer: { 
    flex: 1 
  },
});