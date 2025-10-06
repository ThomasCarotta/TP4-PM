// frontend/App.js
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, StatusBar } from 'react-native';
import TransactionForm from './components/TransactionForm';
import TransactionTimeline from './components/TransactionTimeline';
import { initSocket, subscribeToTransactionEvents } from './utils/websocket';

export default function App() {
  const [eventsMap, setEventsMap] = useState({}); // { transactionId: [events...] }
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);

  useEffect(() => {
    initSocket();

    // recibir todos los events del gateway y almacenarlos en eventsMap
    const unsubscribe = subscribeToTransactionEvents((event) => {
      // event expected: { type, transactionId, payload }
      const txId = event.transactionId || (event.payload && event.payload.transactionId) || 'unknown';
      setEventsMap((prev) => {
        const prevList = prev[txId] || [];
        // append with timestamp
        const newItem = { ...event, receivedAt: Date.now() };
        return { ...prev, [txId]: [...prevList, newItem] };
      });

      // si no hay selectedTransactionId, seleccionarlo automáticamente
      setSelectedTransactionId((cur) => cur || txId);
    });

    return () => unsubscribe();
  }, []);

  // cuando se inicia una nueva transacción desde el form
  const handleNewTransaction = (transactionId) => {
    // crear entrada vacía para mostrar timeline
    setEventsMap((prev) => ({ ...prev, [transactionId]: [] }));
    setSelectedTransactionId(transactionId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.header}>TP4 — Simulador de Transacciones</Text>

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
  header: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  formContainer: { marginBottom: 12 },
  timelineContainer: { flex: 1 },
});
