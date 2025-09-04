import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface VioletCardProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'light' | 'dark';
  style?: ViewStyle;
  gradient?: boolean;
  elevation?: number;
}

export function VioletCard({
  children,
  variant = 'primary',
  style,
  gradient = true,
  elevation = 4,
}: VioletCardProps) {
  const primary = useThemeColor({}, 'primary');
  const primaryLight = useThemeColor({}, 'primaryLight');
  const primaryDark = useThemeColor({}, 'primaryDark');
  const secondary = useThemeColor({}, 'secondary');
  const accent = useThemeColor({}, 'accent');
  const card = useThemeColor({}, 'card');

  const getCardColors = () => {
    switch (variant) {
      case 'primary':
        return [primary, secondary];
      case 'secondary':
        return [secondary, primary];
      case 'accent':
        return [accent, primaryLight];
      case 'light':
        return [primaryLight, accent];
      case 'dark':
        return [primaryDark, primary];
      default:
        return [primary, secondary];
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return primary;
      case 'secondary':
        return secondary;
      case 'accent':
        return accent;
      case 'light':
        return primaryLight;
      case 'dark':
        return primaryDark;
      default:
        return card;
    }
  };

  if (gradient) {
    return (
      <LinearGradient
        colors={getCardColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          {
            shadowColor: primary,
            shadowOffset: { width: 0, height: elevation },
            shadowOpacity: 0.2,
            shadowRadius: elevation * 2,
            elevation: elevation,
          },
          style,
        ]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          shadowColor: primary,
          shadowOffset: { width: 0, height: elevation },
          shadowOpacity: 0.2,
          shadowRadius: elevation * 2,
          elevation: elevation,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    margin: 8,
  },
});
