import React, { useCallback, useEffect, useState } from 'react';
import firebase from '@react-native-firebase/app';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from './redux/store';
import { setupFCMTokenRefresh } from './src/services/notifications/fcmTokenService';
import { navigateToVoiceScreen } from './src/navigation/navigationService';
import { voice } from './src/features/voice/services/phoneService';
import { syncPendingVoiceInvites } from './src/features/voice/services/voiceInviteSync';
import {
  acceptPendingVoiceInvite,
  rejectPendingVoiceInvite,
} from './src/features/voice/services/voiceCallActions';

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

const getStringData = (
  data: FirebaseMessagingTypes.RemoteMessage['data'],
): Record<string, string> => {
  const entries = Object.entries(data || {}).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );

  return Object.fromEntries(entries);
};

const isIncomingCallNotification = (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
) => {
  const payload = JSON.stringify({
    data: remoteMessage.data,
    notification: remoteMessage.notification,
  }).toLowerCase();

  return payload.includes('call') || payload.includes('voice');
};

const InAppNotificationBanner = ({
  title,
  body,
  onPress,
  onHide,
}: InAppNotificationProps) => {
  const translateY = useRef(new Animated.Value(-150)).current;

  const hideNotification = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onHide());
  }, [onHide, translateY]);

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
  }, [hideNotification, translateY]);

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
    || (isIncomingCallNotification(remoteMessage) ? 'Incoming call' : '')
    || 'New Notification';

  const body = remoteMessage.notification?.body
    || getStringValue(remoteMessage.data?.body)
    || getStringValue(remoteMessage.data?.twi_from)
    || '';

  await notifee.displayNotification({
    title,
    body,
    data: {
      ...(remoteMessage.data || {}),
      isIncomingCall: isIncomingCallNotification(remoteMessage) ? 'true' : 'false',
    },
    android: {
      channelId: 'default',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [300, 500],
      pressAction: { id: 'default', launchActivity: 'default' },
      smallIcon: 'ic_launcher',
      actions: isIncomingCallNotification(remoteMessage)
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
    // Notification listeners should be registered once for this component mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      let handledByVoice = false;

      try {
        handledByVoice = await voice.handleFirebaseMessage(
          getStringData(remoteMessage.data),
        );
      } catch (err) {
        console.log('Twilio voice push handoff failed:', err);
      }

      const isIncomingCall = isIncomingCallNotification(remoteMessage);

      if (isIncomingCall) {
        await syncPendingVoiceInvites(dispatch);
      }

      const title =
        remoteMessage.notification?.title ||
        getStringValue(remoteMessage.data?.title) ||
        (isIncomingCall ? 'Incoming call' : '') ||
        'Notification';

      const body =
        remoteMessage.notification?.body ||
        getStringValue(remoteMessage.data?.body) ||
        getStringValue(remoteMessage.data?.twi_from) ||
        '';

      // 1. Show in-app banner
      setInAppNotif({ title, body });

      // 2. Show status bar notification
      if (!handledByVoice || isIncomingCall) {
        await displayNotification(remoteMessage);
      }
    });

    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      const actionId = detail.pressAction?.id;

      if (actionId === 'answer-call') {
        voice.handleFirebaseMessage(getStringData(detail.notification?.data))
          .catch(err => console.log('Twilio voice push handoff failed:', err))
          .then(() => acceptPendingVoiceInvite(dispatch))
          .then(() => navigateToVoiceScreen())
          .catch(err => console.log('Failed to answer call:', err));
        return;
      }

      if (actionId === 'decline-call') {
        rejectPendingVoiceInvite(dispatch)
          .catch(err => console.log('Failed to decline call:', err));
        return;
      }

      if (
        type === EventType.PRESS &&
        detail.notification?.data?.isIncomingCall === 'true'
      ) {
        navigateToVoiceScreen();
      }
    });

    // ─────────────────────────────────────
    // BACKGROUND
    // ─────────────────────────────────────
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Tapped from background:', remoteMessage);
      if (isIncomingCallNotification(remoteMessage)) {
        navigateToVoiceScreen();
      }
    });

    // ─────────────────────────────────────
    // KILLED
    // ─────────────────────────────────────
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('Opened from killed state:', remoteMessage);
        if (isIncomingCallNotification(remoteMessage)) {
          navigateToVoiceScreen();
        }
      }
    });

    return () => {
      unsubscribe();
      unsubscribeNotifee();
    };
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
        navigateToVoiceScreen();
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
