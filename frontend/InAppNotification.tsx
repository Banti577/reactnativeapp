import React, { useEffect, useState } from 'react';
import firebase from '@react-native-firebase/app';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from './redux/store';
import { setupFCMTokenRefresh } from './src/services/notifications/fcmTokenService';
import { Client } from '@twilio/conversations';

import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useRef } from 'react';

console.log(firebase.app());

type InAppNotificationProps = {
  title: string;
  body: string;
  onPress?: () => void;
  onHide: () => void;
};

type InAppNotificationState = {
  title: string;
  body: string;
};

const getStringValue = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const InAppNotificationBanner = ({
  title,
  body,
  onPress,
  onHide,
}: InAppNotificationProps) => {
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 20,
    }).start();

    const timer = setTimeout(() => {
      hideNotification();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const hideNotification = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onHide());
  };

  return (
    <Animated.View style={[
      bannerStyles.container,
      { transform: [{ translateY }] }
    ]}>
      <TouchableOpacity
        style={bannerStyles.inner}
        onPress={() => {
          hideNotification();
          onPress?.();
        }}
        activeOpacity={0.9}
      >
        <View style={bannerStyles.iconWrap}>
          <Text style={bannerStyles.icon}>🔔</Text>
        </View>

        <View style={bannerStyles.textWrap}>
          <Text style={bannerStyles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={bannerStyles.body} numberOfLines={2}>
            {body}
          </Text>
        </View>

        <TouchableOpacity onPress={hideNotification}>
          <Text style={bannerStyles.close}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

async function displayNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
) {
  const title = remoteMessage.notification?.title
    || getStringValue(remoteMessage.data?.title)
    || 'New Notification';

  const body = remoteMessage.notification?.body
    || getStringValue(remoteMessage.data?.body)
    || '';

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: 'default',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [300, 500],
      pressAction: { id: 'default' },
      smallIcon: 'ic_launcher',
    },
  });
}

function InAppNotification() {
  const dispatch = useDispatch<AppDispatch>();
  const [inAppNotif, setInAppNotif] =
    useState<InAppNotificationState | null>(null);

  useEffect(() => {
    let unsubscribeTokenRefresh: (() => void) | undefined;

    requestNotificationPermission();
    createChannel();
    setupFCMTokenRefresh(dispatch).then(unsubscribe => {
      unsubscribeTokenRefresh = unsubscribe;
    });

    const unsubscribeNotificationHandlers = setupNotificationHandlers();

    return () => {
      unsubscribeTokenRefresh?.();
      unsubscribeNotificationHandlers();
    };
  }, [dispatch]);

  async function requestNotificationPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    }
  }

  async function createChannel() {
    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });
    console.log('✅ Channel created');
  }

  function setupNotificationHandlers() {

    // ─────────────────────────────────────
    // FOREGROUND
    // shows BOTH in-app banner + status bar
    // ─────────────────────────────────────
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('🔔 Foreground notification:', JSON.stringify(remoteMessage));

      const title =
        remoteMessage.notification?.title ||
        getStringValue(remoteMessage.data?.title) ||
        'Notification';

      const body =
        remoteMessage.notification?.body ||
        getStringValue(remoteMessage.data?.body) ||
        '';

      // 1. Show in-app banner
      setInAppNotif({ title, body });

      // 2. Show status bar notification
      await displayNotification(remoteMessage);
    });

    // ─────────────────────────────────────
    // BACKGROUND
    // ─────────────────────────────────────
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Tapped from background:', remoteMessage);
      // navigation.navigate('Chat')
    });

    // ─────────────────────────────────────
    // KILLED
    // ─────────────────────────────────────
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('Opened from killed state:', remoteMessage);
        // navigation.navigate('Chat')
      }
    });

    return unsubscribe;
  }

  if (!inAppNotif) {
    return null;
  }

  return (
    <InAppNotificationBanner
      title={inAppNotif.title}
      body={inAppNotif.body}
      onPress={() => {
        console.log('In-app notification tapped');
        // navigation.navigate('Chat')
      }}
      onHide={() => setInAppNotif(null)}
    />
  );
}

export default InAppNotification;

// ─────────────────────────────────────
// BANNER STYLES
// ─────────────────────────────────────
const bannerStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? 40 : 50,
  },
  inner: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2c2c2e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  body: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  close: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    paddingLeft: 8,
  },
});
