import { Call } from '@twilio/voice-react-native-sdk';

import type { AppDispatch } from '../../../../redux/store';
import {
  clearIncomingCall,
  resetVoiceCall,
  setActiveCall,
  setVoiceError,
  setVoiceStatus,
} from '../../../../redux/slices/voiceSlice';
import { VOICE_STATUS } from '../../../constants/voice';
import { logger } from '../../../utils/logger';
import {
  getStoredIncomingInvite,
  setStoredActiveCall,
  setStoredIncomingInvite,
} from './incomingCallStore';
import { voice } from './phoneService';

const wait = (milliseconds: number) =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

const getFirstPendingInvite = async () => {
  const storedInvite = getStoredIncomingInvite();

  if (storedInvite) {
    logger.info('voice-call', 'using stored incoming invite');
    return storedInvite;
  }

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const invites = await voice.getCallInvites();
    const invite = invites.values().next().value || null;

    logger.info('voice-call', 'pending invite lookup', {
      attempt,
      count: invites.size,
    });

    if (invite) {
      return invite;
    }

    await wait(300);
  }

  return null;
};

const attachCallLifecycle = (call: Call, dispatch: AppDispatch) => {
  call.on(Call.Event.Connected, () => {
    dispatch(setVoiceStatus(VOICE_STATUS.CONNECTED));
  });

  call.on(Call.Event.Disconnected, () => {
    setStoredActiveCall(null);
    dispatch(resetVoiceCall(VOICE_STATUS.READY));
  });

  call.on(Call.Event.ConnectFailure, (err: unknown) => {
    logger.error('voice-call', 'connect failed', err);
    setStoredActiveCall(null);
    dispatch(setVoiceError(err instanceof Error ? err.message : 'Call failed'));
    dispatch(resetVoiceCall(VOICE_STATUS.READY));
  });
};

export const acceptPendingVoiceInvite = async (
  dispatch: AppDispatch,
): Promise<Call | null> => {
  const invite = await getFirstPendingInvite();

  if (!invite) {
    logger.info('voice-call', 'no pending invite found to accept');
    dispatch(setVoiceError('No incoming call to accept'));
    return null;
  }

  logger.info('voice-call', 'accepting pending invite');
  const call = await invite.accept();

  setStoredIncomingInvite(null);
  setStoredActiveCall(call);
  dispatch(clearIncomingCall());
  dispatch(setActiveCall(true));
  dispatch(setVoiceStatus(VOICE_STATUS.CONNECTED));
  attachCallLifecycle(call, dispatch);

  return call;
};

export const rejectPendingVoiceInvite = async (
  dispatch: AppDispatch,
): Promise<void> => {
  const invite = await getFirstPendingInvite();

  logger.info('voice-call', invite ? 'rejecting pending invite' : 'no pending invite found to reject');
  await invite?.reject();
  setStoredIncomingInvite(null);
  dispatch(clearIncomingCall());
  dispatch(setVoiceStatus(VOICE_STATUS.READY));
};
