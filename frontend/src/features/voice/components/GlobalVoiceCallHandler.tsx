import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Voice } from '@twilio/voice-react-native-sdk';

import type { AppDispatch } from '../../../../redux/store';
import {
  clearIncomingCall,
  setIncomingCall,
  setVoiceStatus,
} from '../../../../redux/slices/voiceSlice';
import { VOICE_STATUS } from '../../../constants/voice';
import { logger } from '../../../utils/logger';
import { navigateToVoiceScreen } from '../../../navigation/navigationService';
import { voice } from '../services/phoneService';
import { setStoredIncomingInvite } from '../services/incomingCallStore';
import { syncPendingVoiceInvites } from '../services/voiceInviteSync';

const GlobalVoiceCallHandler = () => {
  const dispatch = useDispatch<AppDispatch>();

  const clearInvite = useCallback(() => {
    setStoredIncomingInvite(null);
    dispatch(clearIncomingCall());
    dispatch(setVoiceStatus(VOICE_STATUS.READY));
  }, [dispatch]);

  useEffect(() => {
    const handleInvite = (invite: any) => {
      setStoredIncomingInvite(invite);
      dispatch(setIncomingCall({ callerName: invite?.from || 'Unknown' }));
      logger.info('voice-call', 'Incoming call from: ' + (invite?.from || 'Unknown'));
      navigateToVoiceScreen();

      invite?.on?.('cancelled', clearInvite);
      invite?.on?.('rejected', clearInvite);
    };

    voice.on(Voice.Event.CallInvite, handleInvite);
    syncPendingVoiceInvites(dispatch);

    return () => {
      if (typeof voice.removeListener === 'function') {
        voice.removeListener(Voice.Event.CallInvite, handleInvite);
      }
    };
  }, [clearInvite, dispatch]);

  return null;
};

export default GlobalVoiceCallHandler;
