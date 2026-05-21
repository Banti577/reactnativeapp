import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type NotificationState = {
  fcmToken: string;
};

const initialState: NotificationState = {
  fcmToken: '',
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setFcmToken: (state, action: PayloadAction<string>) => {
      state.fcmToken = action.payload;
    },
    clearFcmToken: state => {
      state.fcmToken = '';
    },
  },
});

export const { clearFcmToken, setFcmToken } = notificationSlice.actions;

export default notificationSlice.reducer;
