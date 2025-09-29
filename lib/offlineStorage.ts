import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface StoredData {
  data: any;
  timestamp: number;
  expiry?: number;
}

export class OfflineStorage {
  private static prefix = 'notifcar_';

  // Sauvegarder des données avec expiration optionnelle
  static async setItem(key: string, data: any, expiryHours?: number): Promise<void> {
    try {
      const storedData: StoredData = {
        data,
        timestamp: Date.now(),
        expiry: expiryHours ? Date.now() + (expiryHours * 60 * 60 * 1000) : undefined,
      };

      const value = JSON.stringify(storedData);
      
      if (Platform.OS === 'web') {
        localStorage.setItem(this.prefix + key, value);
      } else {
        await AsyncStorage.setItem(this.prefix + key, value);
      }
    } catch (error) {
      console.error('Erreur sauvegarde offline:', error);
    }
  }

  // Récupérer des données
  static async getItem(key: string): Promise<any | null> {
    try {
      const value = Platform.OS === 'web'
        ? localStorage.getItem(this.prefix + key)
        : await AsyncStorage.getItem(this.prefix + key);

      if (!value) return null;

      const storedData: StoredData = JSON.parse(value);

      // Vérifier l'expiration
      if (storedData.expiry && Date.now() > storedData.expiry) {
        await this.removeItem(key);
        return null;
      }

      return storedData.data;
    } catch (error) {
      console.error('Erreur lecture offline:', error);
      return null;
    }
  }

  // Supprimer des données
  static async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(this.prefix + key);
      } else {
        await AsyncStorage.removeItem(this.prefix + key);
      }
    } catch (error) {
      console.error('Erreur suppression offline:', error);
    }
  }

  // Nettoyer toutes les données expirées
  static async cleanupExpired(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
        
        for (const key of keys) {
          const value = localStorage.getItem(key);
          if (value) {
            const storedData: StoredData = JSON.parse(value);
            if (storedData.expiry && Date.now() > storedData.expiry) {
              localStorage.removeItem(key);
            }
          }
        }
      } else {
        const keys = await AsyncStorage.getAllKeys();
        const relevantKeys = keys.filter(key => key.startsWith(this.prefix));
        
        for (const key of relevantKeys) {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            const storedData: StoredData = JSON.parse(value);
            if (storedData.expiry && Date.now() > storedData.expiry) {
              await AsyncStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur nettoyage données expirées:', error);
    }
  }

  // Sauvegarder les véhicules de l'utilisateur
  static async saveUserVehicles(vehicles: any[]): Promise<void> {
    await this.setItem('user_vehicles', vehicles, 24); // Expire après 24h
  }

  // Récupérer les véhicules de l'utilisateur
  static async getUserVehicles(): Promise<any[] | null> {
    return await this.getItem('user_vehicles');
  }

  // Sauvegarder les signalisations récentes
  static async saveRecentSignalizations(signalizations: any[]): Promise<void> {
    await this.setItem('recent_signalizations', signalizations, 12); // Expire après 12h
  }

  // Récupérer les signalisations récentes
  static async getRecentSignalizations(): Promise<any[] | null> {
    return await this.getItem('recent_signalizations');
  }

  // Sauvegarder les conversations
  static async saveConversations(conversations: any[]): Promise<void> {
    await this.setItem('conversations', conversations, 24); // Expire après 24h
  }

  // Récupérer les conversations
  static async getConversations(): Promise<any[] | null> {
    return await this.getItem('conversations');
  }

  // Sauvegarder les préférences utilisateur
  static async saveUserPreferences(preferences: any): Promise<void> {
    await this.setItem('user_preferences', preferences); // Pas d'expiration
  }

  // Récupérer les préférences utilisateur
  static async getUserPreferences(): Promise<any | null> {
    return await this.getItem('user_preferences');
  }

  // Obtenir la taille du stockage utilisé
  static async getStorageSize(): Promise<{ used: number; keys: number }> {
    try {
      if (Platform.OS === 'web') {
        const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
        let totalSize = 0;
        
        for (const key of keys) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
        
        return { used: totalSize, keys: keys.length };
      } else {
        const keys = await AsyncStorage.getAllKeys();
        const relevantKeys = keys.filter(key => key.startsWith(this.prefix));
        let totalSize = 0;
        
        for (const key of relevantKeys) {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
        
        return { used: totalSize, keys: relevantKeys.length };
      }
    } catch (error) {
      console.error('Erreur calcul taille stockage:', error);
      return { used: 0, keys: 0 };
    }
  }

  // Vider tout le cache
  static async clearAll(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
        for (const key of keys) {
          localStorage.removeItem(key);
        }
      } else {
        const keys = await AsyncStorage.getAllKeys();
        const relevantKeys = keys.filter(key => key.startsWith(this.prefix));
        await AsyncStorage.multiRemove(relevantKeys);
      }
    } catch (error) {
      console.error('Erreur vidage cache:', error);
    }
  }
}
