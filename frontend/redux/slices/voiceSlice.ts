import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { VOICE_STATUS, VoiceStatus } from '../../src/constants/voice';

type VoiceState = {
  identity: string;
  phoneNumber: string;
  status: VoiceStatus;
  error: string | null;
  callerName: string;
  isMuted: boolean;
  loading: boolean;
  hasIncomingCall: boolean;
  hasActiveCall: boolean;
};

const initialState: VoiceState = {
  identity: 'bunty',
  phoneNumber: '',
  status: VOICE_STATUS.IDLE,
  error: null,
  callerName: '',
  isMuted: false,
  loading: false,
  hasIncomingCall: false,
  hasActiveCall: false,
};

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    setIdentity: (state, action: PayloadAction<string>) => {
      state.identity = action.payload;
    },
    setPhoneNumber: (state, action: PayloadAction<string>) => {
      state.phoneNumber = action.payload;
    },
    setVoiceStatus: (state, action: PayloadAction<VoiceStatus>) => {
      state.status = action.payload;
    },
    setVoiceLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setVoiceError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearVoiceError: state => {
      state.error = null;
    },
    setIncomingCall: (state, action: PayloadAction<{ callerName?: string }>) => {
      state.hasIncomingCall = true;
      state.callerName = action.payload?.callerName || 'Unknown';
      state.status = VOICE_STATUS.INCOMING;
    },
    clearIncomingCall: state => {
      state.hasIncomingCall = false;
      state.callerName = '';
    },
    setActiveCall: (state, action: PayloadAction<boolean>) => {
      state.hasActiveCall = action.payload;
    },
    setMuted: (state, action: PayloadAction<boolean>) => {
      state.isMuted = action.payload;
    },
    resetVoiceCall: (state, action: PayloadAction<VoiceStatus | undefined>) => {
      state.hasActiveCall = false;
      state.hasIncomingCall = false;
      state.callerName = '';
      state.isMuted = false;
      state.status = action.payload || VOICE_STATUS.READY;
    },
  },
});

export const {
  clearIncomingCall,
  clearVoiceError,
  resetVoiceCall,
  setActiveCall,
  setIdentity,
  setIncomingCall,
  setMuted,
  setPhoneNumber,
  setVoiceError,
  setVoiceLoading,
  setVoiceStatus,
} = voiceSlice.actions;

export default voiceSlice.reducer;
