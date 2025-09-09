import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  darkMode: boolean;
  autoRefresh: boolean;
  locationSharing: boolean;
  language: string;
  refreshInterval: number; // en minutes
}

const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  darkMode: false,
  autoRefresh: true,
  locationSharing: false,
  language: 'fr',
  refreshInterval: 5,
};

const SETTINGS_KEY = 'app_settings';

export class SettingsService {
  /**
   * Charger les paramètres depuis le stockage local
   */
  static async loadSettings(): Promise<AppSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        return { ...DEFAULT_SETTINGS, ...settings };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Sauvegarder les paramètres dans le stockage local
   */
  static async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings = await this.loadSettings();
      const newSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
      throw new Error('Impossible de sauvegarder les paramètres');
    }
  }

  /**
   * Réinitialiser les paramètres aux valeurs par défaut
   */
  static async resetSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      console.error('Erreur réinitialisation paramètres:', error);
      throw new Error('Impossible de réinitialiser les paramètres');
    }
  }

  /**
   * Obtenir un paramètre spécifique
   */
  static async getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    const settings = await this.loadSettings();
    return settings[key];
  }

  /**
   * Mettre à jour un paramètre spécifique
   */
  static async updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
    await this.saveSettings({ [key]: value });
  }

  /**
   * Vérifier si les notifications sont activées
   */
  static async areNotificationsEnabled(): Promise<boolean> {
    return await this.getSetting('notificationsEnabled');
  }

  /**
   * Vérifier si le mode sombre est activé
   */
  static async isDarkModeEnabled(): Promise<boolean> {
    return await this.getSetting('darkMode');
  }

  /**
   * Vérifier si l'actualisation automatique est activée
   */
  static async isAutoRefreshEnabled(): Promise<boolean> {
    return await this.getSetting('autoRefresh');
  }

  /**
   * Obtenir l'intervalle d'actualisation en millisecondes
   */
  static async getRefreshInterval(): Promise<number> {
    const interval = await this.getSetting('refreshInterval');
    return interval * 60 * 1000; // Convertir en millisecondes
  }

  /**
   * Exporter les paramètres (pour sauvegarde/restauration)
   */
  static async exportSettings(): Promise<string> {
    const settings = await this.loadSettings();
    return JSON.stringify(settings, null, 2);
  }

  /**
   * Importer les paramètres (depuis une sauvegarde)
   */
  static async importSettings(settingsJson: string): Promise<void> {
    try {
      const settings = JSON.parse(settingsJson);
      // Valider que les paramètres sont valides
      const validatedSettings = { ...DEFAULT_SETTINGS, ...settings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(validatedSettings));
    } catch (error) {
      console.error('Erreur import paramètres:', error);
      throw new Error('Format de paramètres invalide');
    }
  }
}
