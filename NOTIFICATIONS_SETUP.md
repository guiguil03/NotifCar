# 🔔 Configuration des Notifications NotifCar

## ✅ Modules Installés
- `expo-device` - Détection du type d'appareil
- `expo-notifications` - Gestion des notifications push

## 🚀 Configuration Requise

### 1. Project ID Expo
Pour que les notifications push fonctionnent, tu dois configurer ton Project ID Expo :

```bash
# 1. Installer EAS CLI (si pas déjà fait)
npm install -g @expo/eas-cli

# 2. Se connecter à Expo
npx eas login

# 3. Initialiser le projet
npx eas init

# 4. Copier le Project ID affiché dans app.json
```

Puis remplace `"your-project-id-here"` dans `app.json` par ton vrai Project ID.

### 2. Base de Données
Exécute le script SQL dans Supabase :

```sql
-- Copie le contenu de database/setup_notifications.sql
-- et exécute-le dans l'éditeur SQL de Supabase
```

### 3. Configuration des Permissions

#### iOS
Ajoute dans `app.json` :
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    }
  }
}
```

#### Android
Les permissions sont automatiquement ajoutées par le plugin `expo-notifications`.

## 🧪 Test des Notifications

### 1. Démarrer l'app
```bash
npx expo start
```

### 2. Tester les notifications locales
Les notifications locales fonctionnent immédiatement.

### 3. Tester les notifications push
- Scanne un QR code
- Envoie un message
- L'autre utilisateur devrait recevoir une notification

## 🔧 Dépannage

### Erreur "Unable to resolve expo-device"
```bash
npx expo install expo-device
```

### Erreur "Project ID not found"
1. Vérifie que tu as un Project ID valide dans `app.json`
2. Relance l'app après modification

### Notifications ne s'affichent pas
1. Vérifie les permissions dans les paramètres de l'appareil
2. Vérifie que le script SQL a été exécuté
3. Vérifie les logs de la console

## 📱 Fonctionnalités

### Notifications Automatiques
- ✅ Nouveau message reçu
- ✅ Informations de l'expéditeur
- ✅ Navigation vers la conversation
- ✅ Gestion des erreurs

### Notifications Locales
- ✅ Feedback immédiat
- ✅ Sons personnalisés
- ✅ Icônes personnalisées

### Gestion Avancée
- ✅ Tokens automatiques
- ✅ Nettoyage des tokens expirés
- ✅ Sécurité RLS
- ✅ Performance optimisée

## 🎯 Prochaines Étapes

1. **Configure ton Project ID** dans `app.json`
2. **Exécute le script SQL** dans Supabase
3. **Teste l'application** avec les notifications
4. **Personnalise** les sons et icônes si souhaité

## 📞 Support

Si tu rencontres des problèmes :
1. Vérifie les logs de la console
2. Vérifie la configuration des permissions
3. Vérifie que tous les modules sont installés
4. Vérifie que le script SQL a été exécuté

---

**✨ Ton app NotifCar est maintenant prête avec un système de notifications complet !**
