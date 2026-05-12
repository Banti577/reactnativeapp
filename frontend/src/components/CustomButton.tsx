import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';

type Props = {
  title: string;
  onPress: () => void;

  bgColor?: string;
  textColor?: string;

  loading?: boolean;
  disabled?: boolean;
  horizontalPadding?: number;

  style?: StyleProp<ViewStyle>;
};

const CustomButton = ({
  title,
  onPress,
  bgColor = '#000',
  textColor = '#fff',
  loading = false,
  disabled = false,
  horizontalPadding,
}: Props) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: bgColor,
          opacity: disabled ? 0.6 : 1,
          paddingHorizontal: horizontalPadding,

        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  button: {
    // width: '100%',
    height: 45,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',

  },

  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});