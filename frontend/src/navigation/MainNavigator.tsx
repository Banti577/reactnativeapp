import React from 'react';
import { createNativeStackNavigator }
    from '@react-navigation/native-stack';

import HomeScreen               from '../../HomeScreen';
import SearchPage               from '../screens/SearchPage/SearchPage';
import VoiceScreen              from '../screens/VoiceScreen/VoiceScreen';
import ChatScreen               from '../screens/ChatScreen/ChatScreen';
import ConversationsListScreen  from '../screens/ChatScreen/ConversationsListScreen';


const Stack = createNativeStackNavigator();

function MainNavigator() {

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >

            {/* ── Step 1: Register + all conversations ── */}
            <Stack.Screen
                name="ConversationsList"
                component={ConversationsListScreen}
            />

            {/* ── Step 2: Individual chat ── */}
            <Stack.Screen
                name="Chat"
                component={ChatScreen}
            />

            <Stack.Screen
                name="VoiceScreen"
                component={VoiceScreen}
            />

        </Stack.Navigator>
    );
}

export default MainNavigator;