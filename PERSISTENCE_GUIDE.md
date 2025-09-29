# 🔄 Guide de Persistance - NotifCar

## ✅ Ce qui a été configuré

### 1. 🔐 Persistance de session Supabase
- **Auto-refresh des tokens** : Les tokens sont automatiquement rafraîchis
- **Stockage sécurisé** : Sessions sauvegardées dans AsyncStorage/localStorage
- **Flow PKCE** : Authentification plus sécurisée
- **Gestion multi-plateforme** : Web et mobile

### 2. 📱 Stockage offline intelligent
- **Cache avec expiration** : Données automatiquement nettoyées
- **Véhicules utilisateur** : Sauvegardés localement (24h)
- **Signalisations récentes** : Cache 12h
- **Conversations** : Cache 24h
- **Préférences** : Persistantes

### 3. 🌐 Synchronisation réseau
- **Détection connectivité** : Automatique web/mobile
- **Actions en attente** : Sauvegardées si hors ligne
- **Retry automatique** : 3 tentatives maximum
- **Rafraîchissement session** : Avant expiration

## 🚀 Comment utiliser

### Dans vos composants

#### Accéder aux données utilisateur persistantes
```tsx
import { useAuth } from '@/contexts/AuthContext';

function MonComposant() {
  const { user, session, isInitialized, refreshSession } = useAuth();
  
  // user et session sont automatiquement restaurés
  if (!isInitialized) {
    return <Loading />;
  }
  
  return <VotreContenu />;
}
```

#### Utiliser le stockage offline
```tsx
import { OfflineStorage } from '@/lib/offlineStorage';

// Sauvegarder des données
await OfflineStorage.saveUserVehicles(vehicles);

// Récupérer des données
const vehicles = await OfflineStorage.getUserVehicles();

// Sauvegarder avec expiration
await OfflineStorage.setItem('my_data', data, 6); // Expire après 6h
```

#### Gérer la connectivité
```tsx
import { useNetworkSync } from '@/hooks/useNetworkSync';

function MonComposant() {
  const { networkState, queueAction, syncPendingActions } = useNetworkSync();
  
  const handleAction = async () => {
    if (networkState.isOnline) {
      // Action directe
      await faireQuelqueChose();
    } else {
      // Mettre en attente
      await queueAction('create_signalization', { data: 'example' });
    }
  };
  
  return (
    <View>
      {!networkState.isOnline && (
        <Text>📶 Mode hors ligne - Actions en attente</Text>
      )}
    </View>
  );
}
```

## 🔧 Fonctionnalités automatiques

### ✅ Sessions utilisateur
- **Connexion automatique** au redémarrage de l'app
- **Rafraîchissement** automatique des tokens
- **Nettoyage** des sessions expirées

### ✅ Données offline
- **Cache intelligent** avec expiration
- **Nettoyage automatique** des données obsolètes
- **Synchronisation** dès que la connexion revient

### ✅ Actions différées
- **Sauvegarde** des actions hors ligne
- **Retry automatique** avec backoff
- **Suppression** après 3 échecs

## 📊 Monitoring

### Vérifier l'état de la persistance
```tsx
import { OfflineStorage } from '@/lib/offlineStorage';

// Taille du cache
const { used, keys } = await OfflineStorage.getStorageSize();
console.log(`Cache: ${used} bytes, ${keys} clés`);

// Nettoyer si nécessaire
await OfflineStorage.cleanupExpired();

// Vider complètement (en cas de problème)
await OfflineStorage.clearAll();
```

### Analytics automatiques
Les événements suivants sont automatiquement trackés :
- `session_restored` : Session restaurée au démarrage
- `app_session_restored` : App redémarrée avec données
- `user_logout` : Déconnexion utilisateur

## 🐛 Debugging

### Logs utiles
```javascript
// Dans la console du navigateur ou logs mobile
// Vérifier l'état de la session
console.log('Session state:', { user, session, isInitialized });

// Vérifier le cache
const vehicles = await OfflineStorage.getUserVehicles();
console.log('Cached vehicles:', vehicles);

// Vérifier la connectivité
console.log('Network state:', networkState);
```

### Problèmes courants

#### 1. Session non restaurée
- **Cause** : Données corrompues ou expirées
- **Solution** : Vider le cache et se reconnecter

#### 2. Données non synchronisées
- **Cause** : Problème réseau ou token expiré
- **Solution** : Forcer le rafraîchissement avec `refreshSession()`

#### 3. App lente au démarrage
- **Cause** : Trop de données en cache
- **Solution** : Nettoyer avec `OfflineStorage.cleanupExpired()`

## 🎯 Bonnes pratiques

### 1. Gérer les états de chargement
```tsx
function MonComposant() {
  const { loading, isInitialized } = useAuth();
  
  if (loading || !isInitialized) {
    return <LoadingScreen />;
  }
  
  // Composant prêt
}
```

### 2. Vérifier la connectivité
```tsx
const { networkState } = useNetworkSync();

// Afficher l'état hors ligne
{!networkState.isOnline && <OfflineBanner />}
```

### 3. Utiliser le cache intelligemment
```tsx
// Charger depuis le cache d'abord
const cachedData = await OfflineStorage.getItem('my_data');
if (cachedData) {
  setData(cachedData);
}

// Puis rafraîchir depuis le serveur
if (networkState.isOnline) {
  const freshData = await fetchFromServer();
  setData(freshData);
  await OfflineStorage.setItem('my_data', freshData, 12);
}
```

## 📱 Test de la persistance

### 1. Test de session
1. **Connectez-vous**
2. **Fermez l'app complètement**
3. **Rouvrez** → Vous devriez être toujours connecté

### 2. Test hors ligne
1. **Désactivez le réseau**
2. **Utilisez l'app** → Données en cache disponibles
3. **Réactivez le réseau** → Synchronisation automatique

### 3. Test expiration
1. **Attendez l'expiration du cache** (ou modifiez les durées)
2. **Vérifiez le nettoyage** automatique

## 🎉 Résultat

Votre app NotifCar maintenant :
- ✅ **Garde la session** entre les redémarrages
- ✅ **Fonctionne hors ligne** avec les données en cache
- ✅ **Synchronise automatiquement** quand la connexion revient
- ✅ **Gère intelligemment** le stockage local
- ✅ **Rafraîchit automatiquement** les tokens

**Votre app est maintenant persistante ! 🚀**
