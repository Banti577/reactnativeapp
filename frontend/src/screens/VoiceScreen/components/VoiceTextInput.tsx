import React from 'react';
import { StyleSheet, TextInput } from 'react-native';

type VoiceTextInputProps = {
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
};

const VoiceTextInput = ({
  placeholder,
  value,
  onChangeText,
}: VoiceTextInputProps) => (
  <TextInput
    style={styles.input}
    placeholder={placeholder}
    placeholderTextColor="#777"
    value={value}
    onChangeText={onChangeText}
  />
);

export default VoiceTextInput;

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
});
