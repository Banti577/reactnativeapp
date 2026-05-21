import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ActiveCallPanel from './components/ActiveCallPanel';
import IncomingCallPanel from './components/IncomingCallPanel';
import VoiceActionButton from './components/VoiceActionButton';
import VoiceLogList from './components/VoiceLogList';
import VoiceTextInput from './components/VoiceTextInput';
import { useVoiceCall } from '../../features/voice/hooks/useVoiceCall';

const VoiceScreen = () => {
  const {
    acceptCall,
    callerName,
    endCall,
    identity,
    isMuted,
    logs,
    call,
    phoneNumber,
    register,
    rejectCall,
    setIdentity,
    setPhoneNumber,
    status,
    toggleMute,
  } = useVoiceCall();

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

      {status === 'ready' && (
        <>
          <VoiceTextInput
            placeholder="Call To"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          <VoiceActionButton title="Call" onPress={call} />
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
          onHangUp={endCall}
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
