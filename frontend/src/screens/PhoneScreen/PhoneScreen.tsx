import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import {
  Call,
} from '@twilio/voice-react-native-sdk';

import {
  registerVoice,
  makeVoiceCall,
} from '../../services/twilioVoice';

const PhoneScreen = ({ navigation }: any) => {

  const [phoneNumber, setPhoneNumber] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [callStatus, setCallStatus] =
    useState('');

  const [call, setCall] =
    useState<Call | null>(null);


  useEffect(() => {

    initVoice();

  }, []);


  // REGISTER TWILIO VOICE

  const initVoice = async () => {
    try {

      setCallStatus('Registering...');

      await registerVoice('user1');

      setCallStatus('Ready to call');

      console.log('VOICE READY');

    } catch (err) {

      console.log(err);

      setCallStatus(
        'Voice registration failed',
      );
    }
  };




  const makeCall = async () => {
    try {

      if (!phoneNumber.trim()) {

        Alert.alert(
          'Error',
          'Please enter mobile number',
        );

        return;
      }

     
      if (!phoneNumber.startsWith('+')) {

        Alert.alert(
          'Invalid Number',
          'Use country code\nExample: +919876543210',
        );

        return;
      }

      setLoading(true);

      setCallStatus('Calling...');

      // START CALL
      const activeCall =
        await makeVoiceCall(phoneNumber);

      if (!activeCall) {

        setCallStatus('Call failed');

        return;
      }

      setCall(activeCall);

      console.log(
        'VOICE CALL STARTED',
      );

     
      // CONNECTED
      
      activeCall.on(
        Call.Event.Connected,
        () => {

          console.log(
            'CALL CONNECTED',
          );

          setCallStatus('Connected');
        },
      );

      // ─────────────────────────────────────────
      // DISCONNECTED
      // ─────────────────────────────────────────
      activeCall.on(
        Call.Event.Disconnected,
        () => {

          console.log(
            'CALL DISCONNECTED',
          );

          setCall(null);

          setCallStatus('Call ended');
        },
      );

      // ─────────────────────────────────────────
      // CONNECTION FAILED
      // ─────────────────────────────────────────
      activeCall.on(
        Call.Event.ConnectFailure,
        (err: any) => {

          console.log(
            'CALL FAILURE',
            err,
          );

          setCall(null);

          setCallStatus('Call failed');
        },
      );

    } catch (error: any) {

      console.log(
        'CALL ERROR:',
        error,
      );

      setCallStatus('Call failed');

      Alert.alert(
        'Call Error',
        error?.message ||
          'Something went wrong',
      );

    } finally {

      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // END CALL
  // ─────────────────────────────────────────────
  const endCall = async () => {
    try {

      if (call) {

        await call.disconnect();

        setCall(null);

        setCallStatus('Call ended');

        console.log(
          'CALL ENDED',
        );
      }

    } catch (err) {

      console.log(err);
    }
  };

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >

        {/* HEADER */}
        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() =>
              navigation?.goBack()
            }
          >
            <Text style={styles.backText}>
              ←
            </Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Phone Call
          </Text>

          <View style={{ width: 40 }} />

        </View>

        {/* PROFILE */}
        <View style={styles.profileSection}>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              📞
            </Text>
          </View>

          <Text style={styles.nameText}>
            Twilio Call
          </Text>

          <Text style={styles.statusText}>
            {call
              ? 'In Call'
              : callStatus || 'Ready'}
          </Text>

        </View>

        {/* INPUT */}
        <View style={styles.inputContainer}>

          <Text style={styles.label}>
            Mobile Number
          </Text>

          <TextInput
            style={styles.input}
            placeholder="+919876543210"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholderTextColor="#999"
            editable={!call}
          />

        </View>

        {/* BUTTONS */}
        <View style={styles.bottomContainer}>

          {loading ? (

            <ActivityIndicator
              size="large"
              color="#00C853"
            />

          ) : (

            <TouchableOpacity
              style={[
                styles.callBtn,

                call && {
                  opacity: 0.5,
                },
              ]}
              disabled={!!call}
              onPress={makeCall}
            >
              <Text style={styles.callBtnText}>
                📞
              </Text>
            </TouchableOpacity>

          )}

          {/* END CALL */}
          <TouchableOpacity
            style={styles.endCallBtn}
            onPress={endCall}
          >
            <Text style={styles.endCallText}>
              End Call
            </Text>
          </TouchableOpacity>

        </View>

      </KeyboardAvoidingView>

    </SafeAreaView>
  );
};

export default PhoneScreen;

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },

  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  backBtn: {
    width: 40,
  },

  backText: {
    color: '#fff',
    fontSize: 24,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  profileSection: {
    alignItems: 'center',
    marginTop: 40,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1F1F1F',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: 50,
  },

  nameText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
  },

  statusText: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 8,
  },

  inputContainer: {
    marginTop: 50,
    paddingHorizontal: 20,
  },

  label: {
    color: '#fff',
    marginBottom: 10,
    fontSize: 14,
  },

  input: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 55,
    color: '#fff',
    fontSize: 16,
  },

  bottomContainer: {
    marginTop: 'auto',
    alignItems: 'center',
    marginBottom: 40,
  },

  callBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  callBtnText: {
    fontSize: 34,
    color: '#fff',
  },

  endCallBtn: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: '#D50000',
    borderRadius: 10,
  },

  endCallText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

});