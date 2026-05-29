import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

let shouldOpenVoiceScreen = false;

export const navigateToVoiceScreen = () => {
  if (navigationRef.isReady()) {
    navigationRef.navigate('VoiceScreen' as never);
    shouldOpenVoiceScreen = false;
    return;
  }

  shouldOpenVoiceScreen = true;
};

export const flushPendingNavigation = () => {
  if (shouldOpenVoiceScreen) {
    navigateToVoiceScreen();
  }
};
