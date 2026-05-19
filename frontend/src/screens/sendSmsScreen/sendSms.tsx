

import React, { useState } from 'react';

import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
   import { encode } from 'base-64';

const accountSid = '';
const authToken  = '';

const twilioNumber = '+18147475599';

const SmsDirectApi = () => {

  const [number, setNumber] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const sendSMS = async (): Promise<void> => {

    try {

      const cleanNumber = number.trim();

      if (!cleanNumber) {
        Alert.alert('Validation', 'Phone number required');
        return;
      }

      if (!message.trim()) {
        Alert.alert('Validation', 'Message required');
        return;
      }


      const onlyDigits = cleanNumber.replace(/\D/g, '');

      // 10 DIGIT CHECK

      if (onlyDigits.length !== 10) {
        Alert.alert(
          'Validation',
          'Enter valid 10 digit mobile number'
        );
        return;
      }

      const formattedNumber = `+91${onlyDigits}`
  

const credentials = encode(
  `${accountSid}:${authToken}`
);


      const body =
        `To=${encodeURIComponent(formattedNumber)}` +
        `&From=${encodeURIComponent(twilioNumber)}` +
        `&Body=${encodeURIComponent(message.trim())}`;



      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type':
              'application/x-www-form-urlencoded',
          },
          body,
        }
      );

      const data = await response.json();

      console.log('TWILIO RESPONSE');
      console.log(data);

      if (response.ok) {

        Alert.alert(
          'Success',
          `SMS Sent\n${data.sid}`
        );

        setNumber('');
        setMessage('');

      } else {

        Alert.alert(
          'Twilio Error',
          data.message || 'SMS failed'
        );
      }

    } catch (error: any) {

      console.log(error);

      Alert.alert(
        'Error',
        error.message
      );
    }
  };

  return (
    <View style={styles.container}>

      {/* PHONE */}

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


      <TextInput
        placeholder="Enter Message"
        placeholderTextColor="#999"
        value={message}
        onChangeText={setMessage}
        multiline
        style={[styles.input, styles.messageInput]}
      />

  

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

export default SmsDirectApi;

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