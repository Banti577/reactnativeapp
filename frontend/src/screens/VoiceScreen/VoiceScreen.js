import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ActiveCallPanel from './components/ActiveCallPanel';
import IncomingCallPanel from './components/IncomingCallPanel';
import VoiceActionButton from './components/VoiceActionButton';
import VoiceLogList from './components/VoiceLogList';
import VoiceTextInput from './components/VoiceTextInput';
import { useTwilioVoice } from './hooks/useTwilioVoice';

const VoiceScreen = () => {
  const {
    acceptCall,
    callerName,
    callTo,
    hangUp,
    identity,
    isMuted,
    logs,
    makeCall,
    register,
    rejectCall,
    setCallTo,
    setIdentity,
    status,
    toggleMute,
  } = useTwilioVoice();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Twilio Voice</Text>

      <Text style={styles.status}>Status: {status}</Text>

      {(status === 'idle' || status === 'registering') && (
        <>
          <VoiceTextInput
            placeholder="Identity"
            value={identity}
            onChangeText={setIdentity}
          />

          <VoiceActionButton title="Register" onPress={register} />
        </>
      )}

      {status === 'registered' && (
        <>
          <VoiceTextInput
            placeholder="Call To"
            value={callTo}
            onChangeText={setCallTo}
          />

          <VoiceActionButton title="Call" onPress={makeCall} />
        </>
      )}

      {status === 'incoming' && (
        <IncomingCallPanel
          callerName={callerName}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {(status === 'calling' || status === 'connected') && (
        <ActiveCallPanel
          isMuted={isMuted}
          onHangUp={hangUp}
          onToggleMute={toggleMute}
          status={status}
        />
      )}

      <VoiceLogList logs={logs} />
    </View>
  );
};

export default VoiceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  status: {
    color: '#0f0',
    marginBottom: 20,
    textAlign: 'center',
  },
});
