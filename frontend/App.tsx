import React from 'react';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import { View } from 'react-native';
import InAppNotification from './InAppNotification';

function App() {
  return (
    <Provider store={store}>
      <View style={{ flex: 1 }}>
        <AppNavigator />
        <InAppNotification />
      </View>
    </Provider>
  );
}

export default App;
