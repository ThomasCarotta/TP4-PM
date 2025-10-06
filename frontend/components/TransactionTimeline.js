// frontend/components/TransactionTimeline.js
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import EventItem from './EventItem';

export default function TransactionTimeline({ transactionId, events, transactionsList, onSelectTransaction }) {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        <Text style={styles.sideTitle}>Transacciones</Text>
        <FlatList
          data={transactionsList}
          keyExtractor={(t) => t}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onSelectTransaction(item)}
              style={[styles.txButton, item === transactionId ? styles.txSelected : null]}
            >
              <Text numberOfLines={1} style={styles.txText}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No hay transacciones</Text>}
        />
      </View>

      <View style={styles.timeline}>
        <Text style={styles.timelineTitle}>
          Timeline {transactionId ? `— ${transactionId}` : ''}
        </Text>

        <FlatList
          data={events}
          keyExtractor={(it, idx) => `${it.type}-${idx}-${it.receivedAt || Date.now()}`}
          renderItem={({ item }) => <EventItem event={item} />}
          ListEmptyComponent={<Text style={styles.emptyTimeline}>No hay eventos aún</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  side: { width: 140, paddingRight: 8 },
  sideTitle: { fontWeight: '700', marginBottom: 6 },
  txButton: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eef0f6',
  },
  txSelected: { backgroundColor: '#e9f2ff', borderColor: '#7fb1ff' },
  txText: { fontSize: 12 },
  empty: { color: '#666', fontSize: 12 },
  timeline: { flex: 1, paddingLeft: 8 },
  timelineTitle: { fontWeight: '700', marginBottom: 6 },
  emptyTimeline: { color: '#666', fontStyle: 'italic' },
});
