// navigation/AuthNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RecruiterLoginScreen from '../screens/auth/RecruiterLoginScreen'
import Register from '../screens/auth/Register';
//import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Login"
        component={RecruiterLoginScreen}
      />

      <Stack.Screen
        name="Register"
        component={Register}
      />
    </Stack.Navigator>
  );
}

export default AuthNavigator;