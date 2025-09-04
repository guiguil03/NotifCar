/**
 * Couleurs Notifcar - Design System
 * Dégradé de violet (élégance), Orange (alerte), Gris (neutre)
 * "Votre véhicule vous parle, écoutez-le"
 */

// Palette de violets - Dégradé principal (nouveau test)
const violetPrimary = '#7C3AED';      // Violet principal plus foncé
const violetSecondary = '#8B5CF6';    // Violet secondaire
const violetLight = '#C4B5FD';        // Violet clair
const violetDark = '#5B21B6';         // Violet foncé plus profond
const violetAccent = '#E9D5FF';       // Violet accent plus doux

// Couleurs d'accent
const notifcarOrange = '#F97316';     // Orange alerte
const notifcarGray = '#6B7280';       // Gris neutre
const notifcarLightGray = '#F3F4F6';  // Gris clair
const notifcarDarkGray = '#374151';   // Gris foncé

const tintColorLight = violetPrimary;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: notifcarGray,
    tabIconDefault: notifcarGray,
    tabIconSelected: tintColorLight,
    // Couleurs Notifcar - Palette violet
    primary: violetPrimary,
    primaryLight: violetLight,
    primaryDark: violetDark,
    secondary: violetSecondary,
    accent: violetAccent,
    alert: notifcarOrange,
    neutral: notifcarGray,
    lightNeutral: notifcarLightGray,
    darkNeutral: notifcarDarkGray,
    success: '#10B981',
    warning: notifcarOrange,
    error: '#EF4444',
    card: '#fff',
    border: '#E5E7EB',
    // Dégradés
    gradientStart: violetPrimary,
    gradientEnd: violetSecondary,
    gradientLight: violetLight,
    gradientAccent: violetAccent,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Couleurs Notifcar - Palette violet (mode sombre)
    primary: violetSecondary,
    primaryLight: violetPrimary,
    primaryDark: violetDark,
    secondary: violetLight,
    accent: violetAccent,
    alert: '#FB923C',
    neutral: '#9CA3AF',
    lightNeutral: '#374151',
    darkNeutral: '#1F2937',
    success: '#34D399',
    warning: '#FB923C',
    error: '#F87171',
    card: '#1F2937',
    border: '#374151',
    // Dégradés
    gradientStart: violetDark,
    gradientEnd: violetPrimary,
    gradientLight: violetSecondary,
    gradientAccent: violetLight,
  },
};
