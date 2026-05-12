import React, { useState, useEffect, useRef, useCallback } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';

import axios from 'axios';

import messaging from '@react-native-firebase/messaging';

import { Voice } from '@twilio/voice-react-native-sdk';

const API_URL = 'http://10.49.211.1:3000';

const voice = new Voice();

const VoiceScreen = () => {

  // ─────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────

  const [identity, setIdentity] = useState('');
  const [callTo, setCallTo] = useState('');
  const [status, setStatus] = useState('idle');
  const [logs, setLogs] = useState([]);
  const [callerName, setCallerName] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // ─────────────────────────────────────────
  // REFS
  // ─────────────────────────────────────────

  const activeCallRef = useRef(null);
  const callInviteRef = useRef(null);
  const tokenRef = useRef('');

  // ─────────────────────────────────────────
  // LOG HELPER
  // ─────────────────────────────────────────

  const log = useCallback((msg) => {

    console.log(msg);

    setLogs(prev => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 25),
    ]);

  }, []);

  // ─────────────────────────────────────────
  // LISTENERS
  // ─────────────────────────────────────────

  useEffect(() => {

    console.log('SETTING TWILIO LISTENERS');

    // Incoming Call
    voice.on('callInvite', (callInvite) => {

      console.log('🔥 INCOMING CALL EVENT');


      Alert.alert(
        'Incoming Call',
        `From: ${callInvite.from || 'Unknown'}`
      );

      const from = callInvite.from || 'Unknown';

      log('📲 Incoming call from: ' + from);

      setCallerName(from);

      callInviteRef.current = callInvite;

      setStatus('incoming');
    });

    // Cancelled
    voice.on('cancelledCallInvite', () => {

      console.log('❌ CALL CANCELLED');

      log('Caller cancelled call');

      callInviteRef.current = null;

      setCallerName('');

      setStatus('registered');
    });

    return () => {

      console.log('REMOVING LISTENERS');

      voice.removeAllListeners();

      if (activeCallRef.current) {
        try {
          activeCallRef.current.disconnect();
        } catch (_) {}
      }
    };

  }, [log]);

  // ─────────────────────────────────────────
  // PERMISSIONS
  // ─────────────────────────────────────────

  const requestPermissions = async () => {

    if (Platform.OS !== 'android') {
      return true;
    }

    try {

      const permissions = [
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      ];

      if (Platform.Version >= 31) {
        permissions.push(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
      }

      const result = await PermissionsAndroid.requestMultiple(permissions);

      const mic =
        result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === 'granted';

      if (!mic) {

        Alert.alert('Permission Denied');

        return false;
      }

      return true;

    } catch (err) {

      console.log(err);

      return false;
    }
  };

  // ─────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────

  const register = async () => {

    if (!identity.trim()) {

      Alert.alert('Error', 'Enter identity');

      return;
    }

    try {

      setStatus('registering');

      log('🔄 Starting registration');

      const permissionGranted = await requestPermissions();

      if (!permissionGranted) {

        setStatus('idle');

        return;
      }

      // Firebase token
      await messaging().requestPermission();

      const fcmToken = await messaging().getToken();

      console.log('FCM TOKEN:', fcmToken);

      log('✅ FCM token received');

      // Twilio token
      const response = await axios.get(
        `${API_URL}/voice/token?identity=${identity.trim()}`
      );

      const twilioToken = response.data.token;

      tokenRef.current = twilioToken;

      log('✅ Twilio token received');

      // Register Twilio
      await voice.register(twilioToken);

      console.log('✅ TWILIO REGISTERED');

      setStatus('registered');

      log('✅ Registered successfully');

    } catch (err) {

      console.log(err);

      const message =
        err?.response?.data?.error ||
        err?.message ||
        'Registration failed';

      log('❌ ' + message);

      Alert.alert('Register Failed', message);

      setStatus('idle');
    }
  };

  // ─────────────────────────────────────────
  // MAKE CALL
  // ─────────────────────────────────────────

  const makeCall = async () => {

    if (!callTo.trim()) {

      Alert.alert('Error', 'Enter receiver identity');

      return;
    }

    try {

      setStatus('calling');

      log('📞 Calling ' + callTo);

      const call = await voice.connect(tokenRef.current, {
        params: {
          To: callTo.trim(),
        },
      });

      activeCallRef.current = call;

      // Call connected
      call.on('connected', () => {

        log('✅ Call connected');

        setStatus('connected');
      });

      // Call disconnected
      call.on('disconnected', () => {

        log('📵 Call ended');

        activeCallRef.current = null;

        setStatus('registered');
      });

      // Failed
      call.on('failed', (err) => {

        log('❌ Call failed: ' + err.message);

        setStatus('registered');
      });

    } catch (err) {

      console.log(err);

      log('❌ Call error: ' + err.message);

      setStatus('registered');
    }
  };

  // ─────────────────────────────────────────
  // ACCEPT CALL
  // ─────────────────────────────────────────

  const acceptCall = async () => {

    try {

      if (!callInviteRef.current) {

        log('❌ No call invite');

        return;
      }

      const call = await callInviteRef.current.accept();

      activeCallRef.current = call;

      callInviteRef.current = null;

      setStatus('connected');

      log('✅ Call accepted');

      call.on('disconnected', () => {

        log('📵 Call ended');

        activeCallRef.current = null;

        setStatus('registered');
      });

    } catch (err) {

      console.log(err);

      log('❌ Accept failed: ' + err.message);

      setStatus('registered');
    }
  };

  // ─────────────────────────────────────────
  // REJECT CALL
  // ─────────────────────────────────────────

  const rejectCall = () => {

    try {

      callInviteRef.current?.reject();

    } catch (_) {}

    callInviteRef.current = null;

    setCallerName('');

    setStatus('registered');

    log('❌ Call rejected');
  };

  // ─────────────────────────────────────────
  // HANGUP
  // ─────────────────────────────────────────

  const hangUp = () => {

    try {

      activeCallRef.current?.disconnect();

    } catch (_) {}

    activeCallRef.current = null;

    setStatus('registered');

    log('📵 Call ended');
  };

  // ─────────────────────────────────────────
  // MUTE
  // ─────────────────────────────────────────

  const toggleMute = async () => {

    if (!activeCallRef.current) {
      return;
    }

    try {

      const next = !isMuted;

      await activeCallRef.current.mute(next);

      setIsMuted(next);

      log(next ? '🔇 Muted' : '🎤 Unmuted');

    } catch (err) {

      console.log(err);
    }
  };

  // ─────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Twilio Voice</Text>

      <Text style={styles.status}>
        Status: {status}
      </Text>

      {(status === 'idle' || status === 'registering') && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Identity"
            placeholderTextColor="#777"
            value={identity}
            onChangeText={setIdentity}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={register}
          >
            <Text style={styles.buttonText}>
              Register
            </Text>
          </TouchableOpacity>
        </>
      )}

      {status === 'registered' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Call To"
            placeholderTextColor="#777"
            value={callTo}
            onChangeText={setCallTo}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={makeCall}
          >
            <Text style={styles.buttonText}>
              Call
            </Text>
          </TouchableOpacity>
        </>
      )}

      {status === 'incoming' && (
        <View style={styles.callBox}>

          <Text style={styles.incoming}>
            Incoming Call
          </Text>

          <Text style={styles.caller}>
            {callerName}
          </Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: 'green' }]}
            onPress={acceptCall}
          >
            <Text style={styles.buttonText}>
              Accept
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: 'red' }]}
            onPress={rejectCall}
          >
            <Text style={styles.buttonText}>
              Reject
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {(status === 'calling' || status === 'connected') && (
        <View style={styles.callBox}>

          <Text style={styles.incoming}>
            {status === 'calling'
              ? 'Calling...'
              : 'Connected'}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={toggleMute}
          >
            <Text style={styles.buttonText}>
              {isMuted ? 'Unmute' : 'Mute'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: 'red' }]}
            onPress={hangUp}
          >
            <Text style={styles.buttonText}>
              End Call
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.logs}>

        {logs.map((item, index) => (
          <Text key={index} style={styles.log}>
            {item}
          </Text>
        ))}

      </ScrollView>

    </View>
  );
};

export default VoiceScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
    paddingTop: 50,
  },

  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },

  status: {
    color: '#0f0',
    marginBottom: 20,
    textAlign: 'center',
  },

  input: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },

  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  callBox: {
    marginTop: 20,
    alignItems: 'center',
  },

  incoming: {
    color: '#fff',
    fontSize: 22,
    marginBottom: 10,
  },

  caller: {
    color: '#0f0',
    fontSize: 18,
    marginBottom: 20,
  },

  logs: {
    marginTop: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 10,
  },

  log: {
    color: '#0f0',
    fontSize: 11,
    marginBottom: 4,
  },
});