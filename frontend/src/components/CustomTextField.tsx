import React, { useState } from 'react';
import {
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';

type Props = TextInputProps & {
  borderColor?: string;
  focusBorderColor?: string;
  backgroundColor?: string;
  textColor?: string;
};

const CustomTextField = ({
  borderColor = '#D0D0D0',
  focusBorderColor = '#2DC5A2',
  backgroundColor = '#fff',
  textColor = '#000',
  
  ...props
}: Props) => {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      {...props}
      placeholderTextColor="#A0A0A0"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        styles.input,
        {
          borderColor: focused
            ? focusBorderColor
            : borderColor,

          backgroundColor,
          color: textColor,
        },
      ]}
    />
  );
};

export default CustomTextField;

const styles = StyleSheet.create({
  input: {
    width: '100%',
    height: 45,
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 14,
    fontSize: 18,
    marginBottom: 12,
  },
});