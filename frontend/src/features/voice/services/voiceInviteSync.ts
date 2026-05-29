import type { AppDispatch } from '../../../../redux/store';
import { setIncomingCall } from '../../../../redux/slices/voiceSlice';
import { logger } from '../../../utils/logger';
import { navigateToVoiceScreen } from '../../../navigation/navigationService';
import { setStoredIncomingInvite } from './incomingCallStore';
import { voice } from './phoneService';

export const syncPendingVoiceInvites = async (
  dispatch: AppDispatch,
  shouldNavigate = true,
) => {
  try {
    const invites = await voice.getCallInvites();
    const invite = invites.values().next().value;

    if (!invite) {
      return false;
    }

    const callerName =
      typeof invite.getFrom === 'function' ? invite.getFrom() : 'Unknown';

    setStoredIncomingInvite(invite);
    dispatch(setIncomingCall({ callerName }));

    if (shouldNavigate) {
      navigateToVoiceScreen();
    }

    return true;
  } catch (err) {
    logger.error('voice-call', 'failed to sync pending call invites', err);
    return false;
  }
};
