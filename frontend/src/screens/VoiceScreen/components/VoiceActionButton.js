import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

const VoiceActionButton = ({ title, onPress, variant = 'primary' }) => (
  <TouchableOpacity
    style={[styles.button, styles[variant]]}
    onPress={onPress}
  >
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

export default VoiceActionButton;

const styles = StyleSheet.create({
  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  primary: {
    backgroundColor: '#2563eb',
  },
  success: {
    backgroundColor: 'green',
  },
  danger: {
    backgroundColor: 'red',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
