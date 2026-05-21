import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

type VoiceLogListProps = {
  logs: string[];
};

const VoiceLogList = ({ logs }: VoiceLogListProps) => (
  <ScrollView style={styles.logs}>
    {logs.map((item, index) => (
      <Text key={`${item}-${index}`} style={styles.log}>
        {item}
      </Text>
    ))}
  </ScrollView>
);

export default VoiceLogList;

const styles = StyleSheet.create({
  logs: {
    marginTop: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 10,
  },
  log: {
    color: '#0f0',
    fontSize: 11,
    marginBottom: 4,
  },
});
