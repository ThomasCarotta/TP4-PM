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

  useEffect(() => {
    const socket = initSocket();

    socket.on('connect', () => {
      console.log('✅ Conectado al WebSocket');
      setSocketConnected(true);
      
      // Suscribirse con userId por defecto
      socket.emit('subscribe', { userId: 'user1' });
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado del WebSocket');
      setSocketConnected(false);
    });

    socket.on('connected', (data) => {
      console.log('📡 Mensaje del servidor:', data.message);
    });

    socket.on('subscribed', (data) => {
      console.log('📡 Suscripción confirmada para usuario:', data.userId);
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
          type: event.eventType // ← Normalizar nombre
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TP4 — Simulador de Transacciones</Text>
        <Text style={[styles.connectionStatus, socketConnected ? styles.connected : styles.disconnected]}>
          {socketConnected ? '✅ Conectado' : '❌ Desconectado'}
        </Text>
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
  container: { flex: 1, backgroundColor: '#f6f7fb', padding: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  connectionStatus: { fontSize: 12, fontWeight: '600' },
  connected: { color: 'green' },
  disconnected: { color: 'red' },
  formContainer: { marginBottom: 12 },
  timelineContainer: { flex: 1 },
});