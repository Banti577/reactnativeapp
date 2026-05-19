import { VOICE_ERRORS } from '../../../constants/voice';
import { isE164PhoneNumber, normalizePhoneNumber } from '../../../utils/phoneNumber';

export const validateOutboundPhoneNumber = value => {
  const phoneNumber = normalizePhoneNumber(value);

  if (!phoneNumber) {
    return {
      phoneNumber,
      error: VOICE_ERRORS.PHONE_NUMBER_REQUIRED,
    };
  }

  if (!isE164PhoneNumber(phoneNumber)) {
    return {
      phoneNumber,
      error: VOICE_ERRORS.PHONE_NUMBER_INVALID,
    };
  }

  return {
    phoneNumber,
    error: null,
  };
};

