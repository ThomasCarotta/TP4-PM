// frontend/components/TransactionForm.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import { BACKEND_HOST } from '../utils/config';

const ALLOWED_USERS = ['user1', 'user2', 'admin']; // hardcodeado para validación UI

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
    // regla de negocio UI: usuario debe ser uno de los permitidos (hardcodeado)
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
        fromAccount,
        toAccount,
        amount: Number(amount),
        currency,
        userId,
      };

      const res = await axios.post(`${BACKEND_HOST}/transactions`, body, {
        timeout: 10000,
      });

      // El backend devuelve: { status: 'Transaction Initiated', transactionId }
      const transactionId = res?.data?.transactionId || res?.data?.id || null;

      Alert.alert('Éxito', `Transacción iniciada. ID: ${transactionId || 'desconocido'}`);
      if (transactionId && onNewTransaction) onNewTransaction(transactionId);

      // limpiar parcialmente
      setFromAccount('');
      setToAccount('');
      setAmount('');
    } catch (err) {
      console.error('Error enviando transacción', err?.message || err);
      Alert.alert('Error', 'No se pudo enviar la transacción. Revisá la consola.');
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
        <Button title={loading ? 'Enviando...' : 'Enviar transacción'} onPress={handleSubmit} disabled={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e6ef',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  button: {
    marginTop: 6,
  },
});
