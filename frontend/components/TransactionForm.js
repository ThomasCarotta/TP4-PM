// frontend/components/TransactionForm.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import { BACKEND_HOST } from '../utils/config';

const ALLOWED_USERS = ['user1', 'user2', 'admin'];

export default function TransactionForm({ onNewTransaction }) {
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [userId, setUserId] = useState('user1');
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!fromAccount || !toAccount || !amount) {
      Alert.alert('Validación', 'Completá desde, hacia y monto.');
      return false;
    }
    
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      Alert.alert('Validación', 'El monto debe ser un número positivo.');
      return false;
    }
    
    // Validación adicional: misma cuenta
    if (fromAccount.trim() === toAccount.trim()) {
      Alert.alert('Validación', 'No se puede transferir a la misma cuenta.');
      return false;
    }
    
    if (!ALLOWED_USERS.includes(userId)) {
      Alert.alert('Validación', `Usuario inválido. Usuarios permitidos: ${ALLOWED_USERS.join(', ')}`);
      return false;
    }
    
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setLoading(true);
    try {
      const body = {
        fromAccount: fromAccount.trim(),
        toAccount: toAccount.trim(),
        amount: Number(amount),
        currency: currency.trim(),
        userId: userId.trim(),
      };

      console.log('🔄 Enviando transacción...', body);

      const res = await axios.post(`${BACKEND_HOST}/transactions`, body, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const transactionId = res?.data?.transactionId;

      if (transactionId) {
        Alert.alert('✅ Éxito', `Transacción iniciada\nID: ${transactionId}`);
        if (onNewTransaction) onNewTransaction(transactionId);
        
        // Limpiar formulario
        setFromAccount('');
        setToAccount('');
        setAmount('');
      } else {
        Alert.alert('⚠️ Advertencia', 'Transacción enviada pero no se recibió ID');
      }

    } catch (err) {
      console.error('❌ Error completo:', err);
      
      // Manejar diferentes tipos de error
      if (err.response) {
        // Error del servidor (400, 500, etc.)
        const status = err.response.status;
        const message = err.response.data?.message || err.response.data;
        
        if (status === 400) {
          Alert.alert('❌ Error de validación', message || 'Datos inválidos');
        } else if (status === 500) {
          Alert.alert('❌ Error del servidor', 'Intente nuevamente');
        } else {
          Alert.alert('❌ Error', message || `Error ${status}`);
        }
      } else if (err.request) {
        // Error de conexión
        Alert.alert('🌐 Error de conexión', 'No se pudo conectar al servidor');
      } else {
        // Otros errores
        Alert.alert('❌ Error', err.message || 'Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Crear transacción</Text>

      <TextInput
        placeholder="From account"
        value={fromAccount}
        onChangeText={setFromAccount}
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="To account"
        value={toAccount}
        onChangeText={setToAccount}
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
        keyboardType="numeric"
      />

      <TextInput
        placeholder="Currency"
        value={currency}
        onChangeText={setCurrency}
        style={styles.input}
        autoCapitalize="characters"
      />

      <TextInput
        placeholder="User ID (hardcode)"
        value={userId}
        onChangeText={setUserId}
        style={styles.input}
        autoCapitalize="none"
      />

      <View style={styles.button}>
        <Button 
          title={loading ? 'Enviando...' : 'Enviar transacción'} 
          onPress={handleSubmit} 
          disabled={loading} 
          color="#007AFF"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
  },
  title: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 16,
    color: '#1c1c1e'
  },
  input: {
    borderWidth: 1,
    borderColor: '#c7c7cc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9'
  },
  button: {
    marginTop: 8,
  },
});