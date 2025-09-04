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
    const violetGradient = ['#1E1B4B', '#312E81', '#4C1D95', '#7C3AED'];
    
    switch (variant) {
      case 'primary':
        return violetGradient;
      case 'secondary':
        return ['#7C3AED', '#4C1D95', '#312E81', '#1E1B4B'];
      case 'accent':
        return ['#7C3AED', '#5B21B6', '#4C1D95'];
      case 'light':
        return ['#E9D5FF', '#DDD6FE', '#C4B5FD'];
      case 'dark':
        return violetGradient;
      default:
        return violetGradient;
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
