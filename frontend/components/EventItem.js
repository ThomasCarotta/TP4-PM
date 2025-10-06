// frontend/components/EventItem.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EventItem({ event }) {
  const { type, payload, receivedAt } = event;
  const date = receivedAt ? new Date(receivedAt) : new Date();

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.type}>{type}</Text>
        <Text style={styles.time}>{date.toLocaleTimeString()}</Text>
      </View>

      <Text style={styles.payload}>{formatPayload(payload)}</Text>
    </View>
  );
}

function formatPayload(payload) {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  try {
    return JSON.stringify(payload, null, 2);
  } catch (e) {
    return String(payload);
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eef0f6',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  type: { fontWeight: '700' },
  time: { color: '#666', fontSize: 12 },
  payload: { color: '#333', fontSize: 12, fontFamily: 'monospace' },
});
