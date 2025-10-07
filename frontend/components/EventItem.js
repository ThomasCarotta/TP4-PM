// frontend/components/EventItem.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EventItem({ event }) {
  const { type, payload, receivedAt } = event;
  const date = receivedAt ? new Date(receivedAt) : new Date();

  // Colores según tipo de evento
  const getEventColor = (eventType) => {
    switch (eventType) {
      case 'FundsReserved': return payload?.ok ? '#27ae60' : '#e74c3c';
      case 'FraudChecked': return payload?.risk === 'HIGH' ? '#e74c3c' : '#27ae60';
      case 'Committed': return '#2ecc71';
      case 'Reversed': return '#e67e22';
      case 'Notified': return '#3498db';
      default: return '#2c3e50';
    }
  };

  return (
    <View style={[styles.card, { borderLeftColor: getEventColor(type), borderLeftWidth: 4 }]}>
      <View style={styles.row}>
        <Text style={[styles.type, { color: getEventColor(type) }]}>{type}</Text>
        <Text style={styles.time}>{date.toLocaleTimeString()}</Text>
      </View>
      <Text style={styles.payload}>{formatPayload(payload)}</Text>
    </View>
  );
}

function formatPayload(payload) {
  if (!payload) return 'Sin datos';
  if (typeof payload === 'string') return payload;
  
  try {
    // Formatear JSON de manera más legible
    const formatted = JSON.stringify(payload, null, 2)
      .replace(/\n/g, '\n  ') // Indentación
      .replace(/\"([^"]+)\":/g, '$1:'); // Remover comillas de keys
    
    return formatted.length > 200 
      ? formatted.substring(0, 200) + '...' 
      : formatted;
  } catch (e) {
    return String(payload);
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eef0f6',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 6 
  },
  type: { 
    fontWeight: '700', 
    fontSize: 14,
  },
  time: { 
    color: '#7f8c8d', 
    fontSize: 11 
  },
  payload: { 
    color: '#34495e', 
    fontSize: 12, 
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
});