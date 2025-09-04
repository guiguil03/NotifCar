import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  style?: any;
}

export function QRCodeDisplay({ value, size = 200, style }: QRCodeDisplayProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const backgroundColor = useThemeColor({}, 'card');

  return (
    <View style={[styles.container, style]}>
      <QRCode
        value={value}
        size={size}
        color={primaryColor}
        backgroundColor={backgroundColor}
        logoSize={30}
        logoMargin={2}
        logoBorderRadius={15}
        quietZone={10}
        enableLinearGradient={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
