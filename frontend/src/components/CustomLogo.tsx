import React from 'react';
import { View, StyleSheet } from 'react-native';

import InterviewNowSvg from '../assets/svg/InterviewNowSvg';


const C0 = '#26D1AC';
const C1 = '#26B591';

type Props = {
  width?: number;
  height?: number;
};

export default function Logo({
  width = 270,
  height = 52,
}: Props) {
  return (
    <View style={styles.logoWrapper}>
      <InterviewNowSvg

        width={width}
        height={height}
      />

    </View>

  );
}

const styles = StyleSheet.create({

  logoWrapper: {

    width: '100%',
    alignItems: 'center',
    marginBottom: 5,
  },
});