
import React from 'react';
import { createNativeStackNavigator }
    from '@react-navigation/native-stack';

import HomeScreen from '../../HomeScreen';
import SearchPage from '../screens/SearchPage/SearchPage';
import VoiceScreen from '../screens/VoiceScreen/VoiceScreen'


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
                component={VoiceScreen}
            />


            <Stack.Screen
                name="VoiceScreen"
                component={VoiceScreen}
            />


        </Stack.Navigator>
    );
}

export default MainNavigator;