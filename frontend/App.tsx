import React from 'react';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import { StyleSheet, View } from 'react-native';
import InAppNotification from './InAppNotification';
import GlobalVoiceCallHandler from './src/features/voice/components/GlobalVoiceCallHandler';

import 'react-native-get-random-values';

function App() {
  return (
    <Provider store={store}>
      <View style={styles.container}>
        <AppNavigator />
        <GlobalVoiceCallHandler />
        <InAppNotification />
      </View>
    </Provider>
  );
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
