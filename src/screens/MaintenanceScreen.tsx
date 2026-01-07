import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MaintenanceScreenProps {
  reason?: string;
}

export default function MaintenanceScreen({ reason }: MaintenanceScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🔧</Text>
        <Text style={styles.title}>メンテナンス中</Text>
        <Text style={styles.message}>
          ただいまメンテナンス作業を行っております。
        </Text>
        {reason && (
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>メンテナンス理由:</Text>
            <Text style={styles.reasonText}>{reason}</Text>
          </View>
        )}
        <Text style={styles.footer}>
          ご不便をおかけして申し訳ございません。{'\n'}
          しばらく経ってから再度アクセスしてください。
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  icon: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  reasonContainer: {
    backgroundColor: '#fff5f5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#feb2b2',
    marginBottom: 24,
    width: '100%',
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#742a2a',
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#c53030',
    lineHeight: 20,
  },
  footer: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
});
