export const VOICE_STATUS = {
  IDLE: 'idle',
  REGISTERING: 'registering',
  READY: 'ready',
  INCOMING: 'incoming',
  CALLING: 'calling',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed',
} as const;

export type VoiceStatus = typeof VOICE_STATUS[keyof typeof VOICE_STATUS];

export const VOICE_ERRORS = {
  MICROPHONE_PERMISSION_DENIED: 'Microphone permission denied',
  TOKEN_MISSING: 'Voice token missing',
  PHONE_NUMBER_REQUIRED: 'Please enter mobile number',
  PHONE_NUMBER_INVALID: 'Use country code. Example: +919876543210',
} as const;
