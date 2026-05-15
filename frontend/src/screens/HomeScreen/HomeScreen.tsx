

import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {

  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('ConversationsList')}
      >
        <Text style={styles.buttonText}>
          App To App Chat
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('VoiceScreen')}
      >
        <Text style={styles.buttonText}>
          Voice Call
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('SmsScreen')}
      >
        <Text style={styles.buttonText}>
          Send SMS
        </Text>
      </TouchableOpacity>

    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },

  button: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});