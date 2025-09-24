/**
 * Couleurs Notifcar - Design System
 * Dégradé de violet (élégance), Orange (alerte), Gris (neutre)
 * "Votre véhicule vous parle, écoutez-le"
 */

// Nouvelle palette (DA fourni)
// Primaire bleu et déclinaisons verts pour accents
const primary = '#2633E1';   // Bleu primaire
const accent1 = '#1E9B7E';   // Vert foncé
const accent2 = '#26C29E';   // Vert moyen
const accent3 = '#7DDAC5';   // Vert clair

// Couleurs d'accent
const notifcarOrange = '#F97316';     // Orange alerte
const notifcarGray = '#6B7280';       // Gris neutre
const notifcarLightGray = '#F3F4F6';  // Gris clair
const notifcarDarkGray = '#374151';   // Gris foncé

const tintColorLight = primary;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: notifcarGray,
    tabIconDefault: notifcarGray,
    tabIconSelected: tintColorLight,
    // Couleurs Notifcar - Nouvelle palette
    primary: primary,
    primaryLight: accent3,
    primaryDark: '#1B24A8',
    secondary: accent1,
    accent: accent2,
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
    gradientStart: primary,
    gradientEnd: accent1,
    gradientLight: accent2,
    gradientAccent: accent3,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Couleurs Notifcar - Nouvelle palette (mode sombre)
    primary: accent1,
    primaryLight: primary,
    primaryDark: '#101769',
    secondary: accent2,
    accent: accent3,
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
    gradientStart: '#101769',
    gradientEnd: primary,
    gradientLight: accent1,
    gradientAccent: accent2,
  },
};
