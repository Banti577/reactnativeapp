/**
 * @format
 */

import { AppRegistry } from 'react-native';

import messaging from '@react-native-firebase/messaging';

import App from './App';

import { voice } from './src/screens/VoiceScreen/services/twilioVoice';

import { name as appName } from './app.json';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('BACKGROUND MESSAGE', remoteMessage);

  voice.handleMessage(remoteMessage.data);
});

messaging().onMessage(async remoteMessage => {
  console.log('FOREGROUND MESSAGE', remoteMessage);

  voice.handleMessage(remoteMessage.data);
});

AppRegistry.registerComponent(appName, () => App);