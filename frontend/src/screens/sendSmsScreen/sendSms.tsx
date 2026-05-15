// SmsScreen.tsx

import React, { useState } from 'react';

import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';

const SmsScreen = () => {

  const [number, setNumber] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const sendSMS = async (): Promise<void> => {

    const cleanNumber = number.trim();

    // VALIDATION

    if (!cleanNumber) {
      Alert.alert('Validation', 'Phone number required');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Validation', 'Message required');
      return;
    }

    // REMOVE NON DIGITS
    const onlyDigits = cleanNumber.replace(/\D/g, '');

    // CHECK 10 DIGITS
    if (onlyDigits.length !== 10) {
      Alert.alert(
        'Validation',
        'Enter valid 10 digit mobile number'
      );
      return;
    }

    // AUTO ADD +91
    const formattedNumber = `+91${onlyDigits}`;

    try {

      const response = await fetch(
        'http://192.168.0.99:3000/send-sms',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: formattedNumber,
            message: message.trim(),
          }),
        }
      );

      const data = await response.json();

      console.log(data);

      if (data.success) {

        Alert.alert('Success', 'SMS Sent');

        // CLEAR INPUTS
        setNumber('');
        setMessage('');

      } else {

        Alert.alert('Error', data.error);
      }

    } catch (error: any) {

      console.log(error);

      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>

      {/* PHONE INPUT */}

      <View style={styles.phoneContainer}>

        <View style={styles.countryCode}>
          <Text style={styles.countryCodeText}>
            +91
          </Text>
        </View>

        <TextInput
          placeholder="Enter 10 Digit Mobile Number"
          placeholderTextColor="#999"
          value={number}
          onChangeText={setNumber}
          keyboardType="number-pad"
          maxLength={10}
          style={styles.phoneInput}
        />

      </View>

      {/* MESSAGE INPUT */}

      <TextInput
        placeholder="Enter Message"
        placeholderTextColor="#999"
        value={message}
        onChangeText={setMessage}
        multiline
        style={[styles.input, styles.messageInput]}
      />

      {/* BUTTON */}

      <TouchableOpacity
        style={styles.button}
        onPress={sendSMS}
      >
        <Text style={styles.buttonText}>
          Send SMS
        </Text>
      </TouchableOpacity>

    </View>
  );
};

export default SmsScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },

  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  countryCode: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginRight: 10,
  },

  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
  },

  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },

  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },

  button: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});