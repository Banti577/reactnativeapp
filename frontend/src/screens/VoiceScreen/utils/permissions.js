import { Alert, PermissionsAndroid, Platform } from 'react-native';

export const requestVoicePermissions = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    ];

    if (Platform.Version >= 31) {
      permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
    }

    const result = await PermissionsAndroid.requestMultiple(permissions);

    console.log('PERMISSION RESULT:', result);

    const micGranted =
      result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === 'granted';

    const notificationGranted =
      result[PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS] === 'granted';

    if (!micGranted || !notificationGranted) {
      Alert.alert('Required permissions denied');

      return false;
    }

    return true;
  } catch (err) {
    console.log(err);

    return false;
  }
};