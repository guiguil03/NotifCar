import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

export default function BlurTabBarBackground() {
  const colorScheme = useColorScheme();
  const gradientStart = Colors[colorScheme ?? 'light'].gradientStart;
  const gradientEnd = Colors[colorScheme ?? 'light'].gradientEnd;

  return (
    <LinearGradient
      colors={['#2633E1', '#2633E1']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
