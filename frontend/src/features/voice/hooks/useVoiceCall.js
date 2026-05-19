import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { Call, Voice } from '@twilio/voice-react-native-sdk';

import { VOICE_STATUS } from '../../../constants/voice';
import { logger } from '../../../utils/logger';
import {
  clearIncomingCall,
  clearVoiceError,
  resetVoiceCall,
  setActiveCall,
  setIdentity as setReduxIdentity,
  setIncomingCall,
  setMuted,
  setPhoneNumber as setReduxPhoneNumber,
  setVoiceError,
  setVoiceLoading,
  setVoiceStatus,
} from '../../../../redux/slices/voiceSlice';
import {
  makeVoiceCall,
  registerVoice,
  voice,
} from '../services/phoneService';
import { validateOutboundPhoneNumber } from '../domain/voiceValidation';

export const useVoiceCall = () => {
  const dispatch = useDispatch();
  const voiceState = useSelector(state => state.voice);

  const [incomingInvite, setIncomingInvite] = useState(null);
  const [logs, setLogs] = useState([]);

  const callRef = useRef(null);
  const tokenRef = useRef(null);

  const log = useCallback(message => {
    logger.info('voice-call', message);

    setLogs(prev => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev.slice(0, 25),
    ]);
  }, []);

  const clearCall = useCallback(nextStatus => {
    callRef.current = null;
    dispatch(resetVoiceCall(nextStatus));
  }, [dispatch]);

  const attachCallListeners = useCallback(
    call => {
      call.on(Call.Event.Connected, () => {
        log('Call connected');
        dispatch(setVoiceStatus(VOICE_STATUS.CONNECTED));
      });

      call.on(Call.Event.Disconnected, () => {
        log('Call ended');
        clearCall(VOICE_STATUS.READY);
      });

      call.on(Call.Event.ConnectFailure, err => {
        logger.error('voice-call', 'connect failed', err);
        log('Call failed');
        dispatch(setVoiceError(err?.message || 'Call failed'));
        clearCall(VOICE_STATUS.READY);
      });
    },
    [clearCall, dispatch, log],
  );

  const register = useCallback(async () => {
    const trimmedIdentity = voiceState.identity.trim();

    if (!trimmedIdentity) {
      Alert.alert('Error', 'Enter identity');
      return;
    }

    dispatch(setVoiceLoading(true));
    dispatch(clearVoiceError());
    dispatch(setVoiceStatus(VOICE_STATUS.REGISTERING));
    log('Starting registration');

    try {
      tokenRef.current = await registerVoice(trimmedIdentity);
      log('Registered successfully');
      dispatch(setVoiceStatus(VOICE_STATUS.READY));
    } catch (err) {
      logger.error('voice-call', 'registration failed', err);
      log('Register failed: ' + (err?.message || 'Registration failed'));
      dispatch(setVoiceError(err?.message || 'Voice registration failed'));
      dispatch(setVoiceStatus(VOICE_STATUS.IDLE));
      throw err;
    } finally {
      dispatch(setVoiceLoading(false));
    }
  }, [dispatch, log, voiceState.identity]);

  const call = useCallback(async () => {
    const result = validateOutboundPhoneNumber(voiceState.phoneNumber);

    if (result.error) {
      dispatch(setVoiceError(result.error));
      Alert.alert('Error', result.error);
      return null;
    }

    dispatch(setVoiceLoading(true));
    dispatch(clearVoiceError());
    dispatch(setVoiceStatus(VOICE_STATUS.CALLING));
    log('Calling ' + result.phoneNumber);

    try {
      const nextCall = await makeVoiceCall(tokenRef.current, result.phoneNumber);
      callRef.current = nextCall;
      dispatch(setActiveCall(true));
      attachCallListeners(nextCall);

      return nextCall;
    } catch (err) {
      logger.error('voice-call', 'call failed', err);
      log('Call error: ' + (err?.message || 'Call failed'));
      dispatch(setVoiceError(err?.message || 'Call failed'));
      clearCall(VOICE_STATUS.FAILED);
      throw err;
    } finally {
      dispatch(setVoiceLoading(false));
    }
  }, [attachCallListeners, clearCall, dispatch, log, voiceState.phoneNumber]);

  const acceptCall = useCallback(async () => {
    if (!incomingInvite) {
      return null;
    }

    const nextCall = await incomingInvite.accept();

    callRef.current = nextCall;
    dispatch(setActiveCall(true));
    setIncomingInvite(null);
    dispatch(clearIncomingCall());
    dispatch(setVoiceStatus(VOICE_STATUS.CONNECTED));
    log('Call accepted');
    attachCallListeners(nextCall);

    return nextCall;
  }, [attachCallListeners, dispatch, incomingInvite, log]);

  const rejectCall = useCallback(() => {
    incomingInvite?.reject();
    setIncomingInvite(null);
    dispatch(clearIncomingCall());
    dispatch(setVoiceStatus(VOICE_STATUS.READY));
    log('Call rejected');
  }, [dispatch, incomingInvite, log]);

  const endCall = useCallback(async () => {
    await callRef.current?.disconnect();
    log('Call ended');
    clearCall(VOICE_STATUS.READY);
  }, [clearCall, log]);

  const toggleMute = useCallback(async () => {
    if (!callRef.current) {
      return;
    }

    const nextValue = !voiceState.isMuted;

    await callRef.current.mute(nextValue);
    dispatch(setMuted(nextValue));
    log(nextValue ? 'Muted' : 'Unmuted');
  }, [dispatch, log, voiceState.isMuted]);

  useEffect(() => {
    const handleInvite = invite => {
      setIncomingInvite(invite);
      dispatch(setIncomingCall({ callerName: invite?.from || 'Unknown' }));
      log('Incoming call from: ' + (invite?.from || 'Unknown'));
    };

    voice.on(Voice.Event.CallInvite, handleInvite);

    return () => {
      if (typeof voice.removeListener === 'function') {
        voice.removeListener(Voice.Event.CallInvite, handleInvite);
      }
    };
  }, [dispatch, log]);

  return {
    acceptCall,
    activeCall: callRef.current,
    call,
    callerName: voiceState.callerName,
    endCall,
    error: voiceState.error,
    hasActiveCall: voiceState.hasActiveCall,
    hasIncomingCall: voiceState.hasIncomingCall,
    identity: voiceState.identity,
    incomingInvite,
    isMuted: voiceState.isMuted,
    loading: voiceState.loading,
    logs,
    phoneNumber: voiceState.phoneNumber,
    register,
    rejectCall,
    setIdentity: value => dispatch(setReduxIdentity(value)),
    setPhoneNumber: value => dispatch(setReduxPhoneNumber(value)),
    status: voiceState.status,
    toggleMute,
  };
};
