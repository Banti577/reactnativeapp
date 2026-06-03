import { Call, Voice } from '@twilio/voice-react-native-sdk';

import { VOICE_ERRORS } from '../../../constants/voice';
import { fetchTwilioToken } from '../../../services/api/twilioTokenApi';
import { logger } from '../../../utils/logger';
import { requestMicrophonePermission } from './voicePermissions';

export const voice = new Voice();

const scope = 'phone-service';

export const registerVoice = async (identity: string): Promise<string> => {
  const hasPermission = await requestMicrophonePermission();

  if (!hasPermission) {
    throw new Error(VOICE_ERRORS.MICROPHONE_PERMISSION_DENIED);
  }

  const token = await fetchTwilioToken(identity);

  console.log('this is voice token console', token)
  await voice.register(token);

  logger.info(scope, 'registered');

  return token;
};

export const unregisterVoice = async (token?: string | null): Promise<void> => {
  if (!token) {
    return;
  }

  await voice.unregister(token);
};

export const makeVoiceCall = async (
  token: string | null,
  phoneNumber: string,
): Promise<Call> => {
  if (!token) {
    throw new Error(VOICE_ERRORS.TOKEN_MISSING);
  }

  const call = await voice.connect(token, {
    params: {
      To: phoneNumber,
    },
  });

  logger.info(scope, 'outbound call started', { to: phoneNumber });

  return call;
};

export const phoneService = {
  makeVoiceCall,
  registerVoice,
  unregisterVoice,
  voice,
};
