import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface VioletButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function VioletButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
}: VioletButtonProps) {
  const primary = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const primaryDark = useThemeColor({}, 'primaryDark');
  const secondary = useThemeColor({}, 'secondary');
  const accent = useThemeColor({}, 'accent');
  const text = useThemeColor({}, 'text');

  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return [primary, secondary];
      case 'secondary':
        return [secondary, primary];
      case 'accent':
        return [accent, primaryLight];
      case 'outline':
        return ['transparent', 'transparent'];
      default:
        return [primary, secondary];
    }
  };

  const getTextColor = () => {
    if (disabled) return '#9CA3AF';
    if (variant === 'outline') return primary;
    return '#FFFFFF';
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 32, fontSize: 18 };
      case 'medium':
      default:
        return { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16 };
    }
  };

  const sizeStyles = getSizeStyles();

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.button,
          {
            borderWidth: 2,
            borderColor: primary,
            backgroundColor: 'transparent',
            ...sizeStyles,
          },
          style,
        ]}
      >
        <Text style={[styles.text, { color: getTextColor(), fontSize: sizeStyles.fontSize }, textStyle]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <LinearGradient
      colors={getButtonColors()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.gradientButton,
        {
          opacity: disabled ? 0.5 : 1,
          ...sizeStyles,
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={styles.touchable}
      >
        <Text style={[styles.text, { color: getTextColor(), fontSize: sizeStyles.fontSize }, textStyle]}>
          {title}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientButton: {
    borderRadius: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  touchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
