import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import notificationReducer from './slices/fcmNotificationSlice';
import voiceReducer from './slices/voiceSlice';

export const store = configureStore({

    reducer: {
        auth: authReducer,
        fcmtoken: notificationReducer,
        voice: voiceReducer,
    },

});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
