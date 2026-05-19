import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  identity: 'bunty',
  phoneNumber: '',
  status: 'idle',
  error: null as string | null,
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
    setIdentity: (state, action) => {
      state.identity = action.payload;
    },
    setPhoneNumber: (state, action) => {
      state.phoneNumber = action.payload;
    },
    setVoiceStatus: (state, action) => {
      state.status = action.payload;
    },
    setVoiceLoading: (state, action) => {
      state.loading = action.payload;
    },
    setVoiceError: (state, action) => {
      state.error = action.payload;
    },
    clearVoiceError: state => {
      state.error = null;
    },
    setIncomingCall: (state, action) => {
      state.hasIncomingCall = true;
      state.callerName = action.payload?.callerName || 'Unknown';
      state.status = 'incoming';
    },
    clearIncomingCall: state => {
      state.hasIncomingCall = false;
      state.callerName = '';
    },
    setActiveCall: (state, action) => {
      state.hasActiveCall = action.payload;
    },
    setMuted: (state, action) => {
      state.isMuted = action.payload;
    },
    resetVoiceCall: (state, action) => {
      state.hasActiveCall = false;
      state.hasIncomingCall = false;
      state.callerName = '';
      state.isMuted = false;
      state.status = action.payload || 'ready';
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

