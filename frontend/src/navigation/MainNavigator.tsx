import React from 'react';

import {
    createNativeStackNavigator,
} from '@react-navigation/native-stack';


import SearchPage from '../screens/SearchPage/SearchPage';
import VoiceScreen from '../screens/VoiceScreen/VoiceScreen';
import ChatScreen from '../screens/ChatScreen/ChatScreen';
import SmsScreen from '../screens/sendSmsScreen/sendSms';
import ConversationsListScreen from '../screens/ChatScreen/ConversationsListScreen';
import HomeScreen from '../screens/HomeScreen/HomeScreen';

import PhoneScreen from '../screens/PhoneScreen/PhoneScreen'
//import HomeScreen from '../../HomeScreen'; //have to use this 
HomeScreen



const Stack = createNativeStackNavigator();

function MainNavigator() {

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >

            <Stack.Screen
                name="Home"
                component={HomeScreen}
            />


                <Stack.Screen
                name="PhoneScreen"
                component={PhoneScreen}
            />

            {/* ── Conversations List ── */}
            <Stack.Screen
                name="ConversationsList"
                component={ConversationsListScreen}
            />

            {/* ── Chat Screen ── */}
            <Stack.Screen
                name="Chat"
                component={ChatScreen}
            />

            {/* ── Voice Screen ── */}
            <Stack.Screen
                name="VoiceScreen"
                component={VoiceScreen}
            />

            {/* ── SMS Screen ── */}
            <Stack.Screen
                name="SmsScreen"
                component={SmsScreen}
            />

        </Stack.Navigator>
    );
}

export default MainNavigator;