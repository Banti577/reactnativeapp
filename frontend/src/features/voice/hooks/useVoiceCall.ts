import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { Call } from '@twilio/voice-react-native-sdk';

import { VOICE_STATUS, VoiceStatus } from '../../../constants/voice';
import { logger } from '../../../utils/logger';
import type { AppDispatch, RootState } from '../../../../redux/store';
import {
  clearVoiceError,
  resetVoiceCall,
  setActiveCall,
  setIdentity as setReduxIdentity,
  setMuted,
  setPhoneNumber as setReduxPhoneNumber,
  setVoiceError,
  setVoiceLoading,
  setVoiceStatus,
} from '../../../../redux/slices/voiceSlice';
import {
  makeVoiceCall,
  registerVoice,
} from '../services/phoneService';
import {
  getStoredActiveCall,
  subscribeToActiveCall,
  subscribeToIncomingInvite,
} from '../services/incomingCallStore';
import { validateOutboundPhoneNumber } from '../domain/voiceValidation';
import {
  acceptPendingVoiceInvite,
  rejectPendingVoiceInvite,
} from '../services/voiceCallActions';

type VoiceCallHook = {
  acceptCall: () => Promise<Call | null>;
  activeCall: Call | null;
  call: () => Promise<Call | null>;
  callerName: string;
  endCall: () => Promise<void>;
  error: string | null;
  hasActiveCall: boolean;
  hasIncomingCall: boolean;
  identity: string;
  incomingInvite: any;
  isMuted: boolean;
  loading: boolean;
  logs: string[];
  phoneNumber: string;
  register: () => Promise<void>;
  rejectCall: () => void;
  setIdentity: (value: string) => void;
  setPhoneNumber: (value: string) => void;
  status: VoiceStatus;
  toggleMute: () => Promise<void>;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

export const useVoiceCall = (): VoiceCallHook => {
  const dispatch = useDispatch<AppDispatch>();
  const voiceState = useSelector((state: RootState) => state.voice);

  const [incomingInvite, setIncomingInvite] = useState<any>(null);
  const [activeCall, setActiveCallState] = useState<Call | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const callRef = useRef<Call | null>(null);
  const tokenRef = useRef<string | null>(null);

  const log = useCallback((message: string) => {
    logger.info('voice-call', message);

    setLogs(prev => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev.slice(0, 25),
    ]);
  }, []);

  const clearCall = useCallback((nextStatus: VoiceStatus) => {
    callRef.current = null;
    dispatch(resetVoiceCall(nextStatus));
  }, [dispatch]);

  const attachCallListeners = useCallback(
    (callInstance: Call) => {
      callInstance.on(Call.Event.Connected, () => {
        log('Call connected');
        dispatch(setVoiceStatus(VOICE_STATUS.CONNECTED));
      });

      callInstance.on(Call.Event.Disconnected, () => {
        log('Call ended');
        clearCall(VOICE_STATUS.READY);
      });

      callInstance.on(Call.Event.ConnectFailure, (err: unknown) => {
        logger.error('voice-call', 'connect failed', err);
        log('Call failed');
        dispatch(setVoiceError(getErrorMessage(err, 'Call failed')));
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
      log('Register failed: ' + getErrorMessage(err, 'Registration failed'));
      dispatch(setVoiceError(getErrorMessage(err, 'Voice registration failed')));
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
      log('Call error: ' + getErrorMessage(err, 'Call failed'));
      dispatch(setVoiceError(getErrorMessage(err, 'Call failed')));
      clearCall(VOICE_STATUS.FAILED);
      throw err;
    } finally {
      dispatch(setVoiceLoading(false));
    }
  }, [attachCallListeners, clearCall, dispatch, log, voiceState.phoneNumber]);

  const acceptCall = useCallback(async () => {
    const nextCall = await acceptPendingVoiceInvite(dispatch);

    if (nextCall) {
      callRef.current = nextCall;
      setActiveCallState(nextCall);
      log('Call accepted');
    }

    return nextCall;
  }, [dispatch, log]);

  const rejectCall = useCallback(async () => {
    await rejectPendingVoiceInvite(dispatch);
    log('Call rejected');
  }, [dispatch, log]);

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

  useEffect(() => subscribeToIncomingInvite(setIncomingInvite), []);

  useEffect(
    () => subscribeToActiveCall(callInstance => {
      callRef.current = callInstance;
      setActiveCallState(callInstance);
    }),
    [],
  );

  return {
    acceptCall,
    activeCall: activeCall || getStoredActiveCall(),
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
    setIdentity: (value: string) => dispatch(setReduxIdentity(value)),
    setPhoneNumber: (value: string) => dispatch(setReduxPhoneNumber(value)),
    status: voiceState.status,
    toggleMute,
  };
};
