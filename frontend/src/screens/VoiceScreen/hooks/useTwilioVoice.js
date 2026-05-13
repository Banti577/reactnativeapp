import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import messaging from '@react-native-firebase/messaging';

import { fetchTwilioToken } from '../services/voiceApi';
import { voice } from '../services/twilioVoice';
import { requestVoicePermissions } from '../utils/permissions';

export const useTwilioVoice = () => {
  const [identity, setIdentity] = useState('');
  const [callTo, setCallTo] = useState('');
  const [status, setStatus] = useState('idle');
  const [logs, setLogs] = useState([]);
  const [callerName, setCallerName] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const activeCallRef = useRef(null);
  const callInviteRef = useRef(null);
  const tokenRef = useRef('');

  const log = useCallback((msg) => {
    console.log(msg);

    setLogs(prev => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 25),
    ]);
  }, []);

  useEffect(() => {
    console.log('SETTING TWILIO LISTENERS');

    voice.on('registered', () => {
      console.log('TWILIO REGISTERED EVENT');
    });

    voice.on('registrationFailed', e => {
      console.log('TWILIO REGISTRATION FAILED', e);
    });

voice.on('incomingCall', (callInvite) => {
  console.log('INCOMING CALL EVENT');

  const from = callInvite.from || 'Unknown';

  Alert.alert('Incoming Call', `From: ${from}`);

  log('Incoming call from: ' + from);

  setCallerName(from);

  callInviteRef.current = callInvite;

  setStatus('incoming');
});




    voice.on('cancelledCallInvite', () => {
      console.log('CALL CANCELLED');

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
        } catch (_) { }
      }
    };
  }, [log]);

  const register = async () => {
    const trimmedIdentity = identity.trim();

    if (!trimmedIdentity) {
      Alert.alert('Error', 'Enter identity');
      return;
    }

    try {
      setStatus('registering');
      log('Starting registration');

      const permissionGranted = await requestVoicePermissions();

      if (!permissionGranted) {
        setStatus('idle');
        return;
      }

      await messaging().requestPermission();

      const fcmToken = await messaging().getToken();

      console.log('FCM TOKEN:', fcmToken);
      log('FCM token received');

      const twilioToken = await fetchTwilioToken(trimmedIdentity);

      tokenRef.current = twilioToken;
      log('Twilio token received');

      // await voice.register(twilioToken);
      //const final  = await voice.register(twilioToken, fcmToken);

      console.log('this is final', final)
      //       await voice.register(twilioToken, {
      //   fcmToken,
      // });

     const final  =  await voice.register(twilioToken, {
        fcmToken,
      });

        console.log('this is final', final)

      console.log('TWILIO REGISTERED');
      setStatus('registered');
      log('Registered successfully');
    } catch (err) {
      console.log(err);

      const message =
        err?.response?.data?.error || err?.message || 'Registration failed';

      log('Register failed: ' + message);
      Alert.alert('Register Failed', message);
      setStatus('idle');
    }
  };

  const attachCallListeners = (call) => {
    call.on('connected', () => {
      log('Call connected');
      setStatus('connected');
    });

    call.on('disconnected', () => {
      log('Call ended');
      activeCallRef.current = null;
      setIsMuted(false);
      setStatus('registered');
    });

    call.on('failed', (err) => {
      log('Call failed: ' + err.message);
      activeCallRef.current = null;
      setIsMuted(false);
      setStatus('registered');
    });
  };

  const makeCall = async () => {
    const receiver = callTo.trim();

    console.log('this is receiver', receiver)

    if (!receiver) {
      Alert.alert('Error', 'Enter receiver identity');
      return;
    }

    try {
      setStatus('calling');
      log('Calling ' + receiver);

      console.log('console se pahle', tokenRef.current)

      const call = await voice.connect(tokenRef.current, {
        params: {
          To: receiver,
        },
      });

//       const call = await voice.connect(tokenRef.current, {
//   params: {
//     to: receiver,
//   },
// });

      console.log('console me yah impotant call', call)

      activeCallRef.current = call;
      attachCallListeners(call);
    } catch (err) {
      console.log(err);

      log('Call error: ' + err.message);
      setStatus('registered');
    }
  };

  const acceptCall = async () => {
    try {
      if (!callInviteRef.current) {
        log('No call invite');
        return;
      }

      const call = await callInviteRef.current.accept();

      activeCallRef.current = call;
      callInviteRef.current = null;
      setStatus('connected');
      log('Call accepted');
      attachCallListeners(call);
    } catch (err) {
      console.log(err);

      log('Accept failed: ' + err.message);
      setStatus('registered');
    }
  };

  const rejectCall = () => {
    try {
      callInviteRef.current?.reject();
    } catch (_) { }

    callInviteRef.current = null;
    setCallerName('');
    setStatus('registered');
    log('Call rejected');
  };

  const hangUp = () => {
    try {
      activeCallRef.current?.disconnect();
    } catch (_) { }

    activeCallRef.current = null;
    setIsMuted(false);
    setStatus('registered');
    log('Call ended');
  };

  const toggleMute = async () => {
    if (!activeCallRef.current) {
      return;
    }

    try {
      const next = !isMuted;

      await activeCallRef.current.mute(next);

      setIsMuted(next);
      log(next ? 'Muted' : 'Unmuted');
    } catch (err) {
      console.log(err);
    }
  };

  return {
    acceptCall,
    callerName,
    callTo,
    hangUp,
    identity,
    isMuted,
    logs,
    makeCall,
    register,
    rejectCall,
    setCallTo,
    setIdentity,
    status,
    toggleMute,
  };
};
