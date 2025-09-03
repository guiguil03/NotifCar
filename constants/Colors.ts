/**
 * Couleurs Notifcar - Design System
 * Bleu (sécurité), Orange (alerte), Gris (neutre)
 * "Votre véhicule vous parle, écoutez-le"
 */

// Couleurs principales Notifcar
const notifcarBlue = '#2563EB';      // Bleu sécurité
const notifcarOrange = '#F97316';    // Orange alerte
const notifcarGray = '#6B7280';      // Gris neutre
const notifcarLightGray = '#F3F4F6'; // Gris clair
const notifcarDarkGray = '#374151';  // Gris foncé

const tintColorLight = notifcarBlue;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: notifcarGray,
    tabIconDefault: notifcarGray,
    tabIconSelected: tintColorLight,
    // Couleurs Notifcar
    primary: notifcarBlue,
    secondary: notifcarOrange,
    neutral: notifcarGray,
    lightNeutral: notifcarLightGray,
    darkNeutral: notifcarDarkGray,
    success: '#10B981',
    warning: notifcarOrange,
    error: '#EF4444',
    card: '#fff',
    border: '#E5E7EB',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Couleurs Notifcar (mode sombre)
    primary: '#3B82F6',
    secondary: '#FB923C',
    neutral: '#9CA3AF',
    lightNeutral: '#374151',
    darkNeutral: '#1F2937',
    success: '#34D399',
    warning: '#FB923C',
    error: '#F87171',
    card: '#1F2937',
    border: '#374151',
  },
};
