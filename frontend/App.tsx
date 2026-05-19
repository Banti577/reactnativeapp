import React from 'react';

import firebase from '@react-native-firebase/app';

import { Provider } from 'react-redux';

import { store } from './redux/store';
import AppNavigator from './src/navigation/AppNavigator'

console.log(firebase.app());

function App() {

  return (

    <Provider store={store}>

      <AppNavigator />

    </Provider>
  );
}

export default App;
