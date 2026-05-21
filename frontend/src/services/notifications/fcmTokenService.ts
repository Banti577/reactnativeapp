import messaging from '@react-native-firebase/messaging';

import type { AppDispatch } from '../../../redux/store';
import { clearFcmToken, setFcmToken } from '../../../redux/slices/fcmNotificationSlice';

export async function setupFCMTokenRefresh(dispatch: AppDispatch) {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.log('Permission denied');
    dispatch(clearFcmToken());
    return;
  }

  const token = await messaging().getToken();
  console.log('FCM Token:', token);
  dispatch(setFcmToken(token));

  return messaging().onTokenRefresh(newToken => {
    console.log('Token refreshed:', newToken);
    dispatch(setFcmToken(newToken));
  });
}
