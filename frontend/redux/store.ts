import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import voiceReducer from './slices/voiceSlice';

export const store = configureStore({

    reducer: {
        auth: authReducer,
        voice: voiceReducer,
    },

});
