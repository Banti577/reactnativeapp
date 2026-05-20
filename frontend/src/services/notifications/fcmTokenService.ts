import messaging from '@react-native-firebase/messaging';

export async function setupFCMTokenRefresh() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.log('Permission denied');
    return;
  }

  const token = await messaging().getToken();
  console.log('FCM Token:', token);

  return messaging().onTokenRefresh(newToken => {
    console.log('Token refreshed:', newToken);
  });
}
