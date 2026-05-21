import { VOICE_ERRORS } from '../../../constants/voice';
import { isE164PhoneNumber, normalizePhoneNumber } from '../../../utils/phoneNumber';

type PhoneValidationResult = {
  phoneNumber: string;
  error: string | null;
};

export const validateOutboundPhoneNumber = (
  value?: string | null,
): PhoneValidationResult => {
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
