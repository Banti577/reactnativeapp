import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';


import notifee, { AndroidImportance } from '@notifee/react-native';
import { voice } from './src/features/voice/services/phoneService';
import { store } from './redux/store';
import {
  acceptPendingVoiceInvite,
  rejectPendingVoiceInvite,
} from './src/features/voice/services/voiceCallActions';
import { navigateToVoiceScreen } from './src/navigation/navigationService';

const getStringData = data =>
  Object.fromEntries(
    Object.entries(data || {}).filter(([, value]) => typeof value === 'string'),
  );

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background notification:', remoteMessage);

  // Show notification using notifee instead of Twilio SDK
  try {
    try {
      const handledByVoice = await voice.handleFirebaseMessage(
        getStringData(remoteMessage.data),
      );

      if (handledByVoice) {
        console.log('✅ Voice push handled by Twilio SDK');
      }
    } catch (err) {
      console.log('Twilio voice push handoff failed:', err);
    }

    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });

    const payload = JSON.stringify(remoteMessage).toLowerCase();
    const isIncomingCall = payload.includes('call') || payload.includes('voice');
    const title = remoteMessage.notification?.title || remoteMessage.data?.title || remoteMessage.data?.author || (isIncomingCall ? 'Incoming call' : 'New Message');
    const body = remoteMessage.notification?.body || remoteMessage.data?.body || remoteMessage.data?.twi_body || remoteMessage.data?.twi_from || '';

    await notifee.displayNotification({
      title,
      body,
      data: {
        ...(remoteMessage.data || {}),
        isIncomingCall: isIncomingCall ? 'true' : 'false',
      },
      android: {
        channelId: 'default',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        pressAction: { id: 'default', launchActivity: 'default' },
        smallIcon: 'ic_launcher',
        actions: isIncomingCall
          ? [
              {
                title: 'Pick up',
                pressAction: { id: 'answer-call', launchActivity: 'default' },
              },
              {
                title: 'Decline',
                pressAction: { id: 'decline-call', launchActivity: 'default' },
              },
            ]
          : undefined,
      },
    });

    console.log('✅ Notification displayed!');

  } catch (err) {
    console.log('❌ Error:', err);
  }
});


notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Notifee background event:', type, detail);

  const actionId = detail.pressAction?.id;

  if (actionId === 'answer-call') {
    try {
      await voice.handleFirebaseMessage(getStringData(detail.notification?.data));
      await acceptPendingVoiceInvite(store.dispatch);
      navigateToVoiceScreen();
    } catch (err) {
      console.log('Failed to answer call from notification:', err);
    }
  }

  if (actionId === 'decline-call') {
    try {
      await rejectPendingVoiceInvite(store.dispatch);
    } catch (err) {
      console.log('Failed to decline call from notification:', err);
    }
  }
});



AppRegistry.registerComponent(appName, () => App);
