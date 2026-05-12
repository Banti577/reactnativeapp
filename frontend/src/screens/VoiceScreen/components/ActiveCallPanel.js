import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import VoiceActionButton from './VoiceActionButton';

const ActiveCallPanel = ({ isMuted, onHangUp, onToggleMute, status }) => (
  <View style={styles.callBox}>
    <Text style={styles.incoming}>
      {status === 'calling' ? 'Calling...' : 'Connected'}
    </Text>

    <VoiceActionButton
      title={isMuted ? 'Unmute' : 'Mute'}
      onPress={onToggleMute}
    />

    <VoiceActionButton title="End Call" onPress={onHangUp} variant="danger" />
  </View>
);

export default ActiveCallPanel;

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
});
