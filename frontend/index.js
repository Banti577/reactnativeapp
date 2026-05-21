import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';


import notifee, { AndroidImportance } from '@notifee/react-native';

import { Client } from '@twilio/conversations';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background notification:', remoteMessage);

  // Show notification using notifee instead of Twilio SDK
  try {
    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });

    const title = remoteMessage.data?.author || 'New Message';
    const body = remoteMessage.data?.twi_body || '';

    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: 'default',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        pressAction: { id: 'default' },
        smallIcon: 'ic_launcher',
      },
    });

    console.log('✅ Notification displayed!');

  } catch (err) {
    console.log('❌ Error:', err);
  }
});


notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Notifee background event:', type, detail);

  
});



AppRegistry.registerComponent(appName, () => App);