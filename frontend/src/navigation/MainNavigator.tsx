
import React from 'react';
import { createNativeStackNavigator }
    from '@react-navigation/native-stack';

import HomeScreen from '../../HomeScreen';
import SearchPage from '../screens/SearchPage/SearchPage';
import VoiceScreen from '../screens/VoiceScreen/VoiceScreen'
import ChatScreen  from '../screens/ChatScreen/ChatScreen'


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
                component={ChatScreen}
            />


            <Stack.Screen
                name="VoiceScreen"
                component={ChatScreen}
            />


        </Stack.Navigator>
    );
}

export default MainNavigator;