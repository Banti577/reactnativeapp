import { createSlice } from "@reduxjs/toolkit";


const initialState = {

    user: {
        uid: '',
        email: '',
        name: '',
        token: '',
        isAuthenticated: false,
    },

};

const authSlice = createSlice({
    name: 'auth',
    initialState,

    reducers: {
        setUser: (state, action) => {
            state.user.isAuthenticated = true;

            state.user.uid = action.payload.uid;
            state.user.email = action.payload.email;
            state.user.name = action.payload.name;
            state.user.token = action.payload.token;

        },
        clearUser: (state) => {

            state.user.uid = '';
            state.user.email = '';
            state.user.name = '';
            state.user.token = '';
            state.user.isAuthenticated = false;
        }
    }
})

export const {
    setUser,
    clearUser,
} = authSlice.actions;


export default authSlice.reducer;
