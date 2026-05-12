import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import VoiceActionButton from './VoiceActionButton';

const IncomingCallPanel = ({ callerName, onAccept, onReject }) => (
  <View style={styles.callBox}>
    <Text style={styles.incoming}>Incoming Call</Text>

    <Text style={styles.caller}>{callerName}</Text>

    <VoiceActionButton title="Accept" onPress={onAccept} variant="success" />
    <VoiceActionButton title="Reject" onPress={onReject} variant="danger" />
  </View>
);

export default IncomingCallPanel;

const styles = StyleSheet.create({
  callBox: {
    marginTop: 20,
    alignItems: 'center',
  },
  incoming: {
    color: '#fff',
    fontSize: 22,
    marginBottom: 10,
  },
  caller: {
    color: '#0f0',
    fontSize: 18,
    marginBottom: 20,
  },
});
