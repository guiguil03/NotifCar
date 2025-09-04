import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

interface GradientBackgroundProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'accent' | 'light' | 'dark';
  direction?: 'vertical' | 'horizontal' | 'diagonal';
}

export function GradientBackground({ 
  children, 
  style, 
  variant = 'primary',
  direction = 'vertical' 
}: GradientBackgroundProps) {
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');
  const gradientLight = useThemeColor({}, 'gradientLight');
  const gradientAccent = useThemeColor({}, 'gradientAccent');

  const getGradientColors = () => {
    switch (variant) {
      case 'primary':
        return [gradientStart, gradientEnd];
      case 'secondary':
        return [gradientEnd, gradientStart];
      case 'accent':
        return [gradientAccent, gradientLight];
      case 'light':
        return [gradientLight, gradientAccent];
      case 'dark':
        return [gradientStart, gradientEnd];
      default:
        return [gradientStart, gradientEnd];
    }
  };

  const getGradientDirection = () => {
    switch (direction) {
      case 'horizontal':
        return { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } };
      case 'diagonal':
        return { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
      case 'vertical':
      default:
        return { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } };
    }
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      {...getGradientDirection()}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
