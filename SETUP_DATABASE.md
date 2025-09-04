# Configuration de la base de données NotifCar

## Étapes de configuration

### 1. Configuration Supabase

1. **Créer un projet Supabase** :
   - Aller sur [supabase.com](https://supabase.com)
   - Créer un nouveau projet
   - Noter l'URL et la clé API

2. **Configurer les variables d'environnement** :
   ```bash
   # Dans votre fichier .env ou .env.local
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 2. Exécuter le schéma SQL

1. **Ouvrir l'éditeur SQL Supabase** :
   - Aller dans votre projet Supabase
   - Cliquer sur "SQL Editor" dans le menu de gauche

2. **Exécuter le script** :
   - Copier le contenu du fichier `database/schema.sql`
   - Coller dans l'éditeur SQL
   - Cliquer sur "Run" pour exécuter

### 3. Vérifier la configuration

Le script va créer :
- ✅ Table `qr_codes` pour stocker les QR codes
- ✅ Table `vehicles` pour gérer les véhicules
- ✅ Table `notifications` pour l'historique des scans
- ✅ Bucket `notifcar-qr-codes` pour le stockage des fichiers
- ✅ Politiques RLS (Row Level Security) pour la sécurité
- ✅ Index pour optimiser les performances

### 4. Test de l'application

Une fois la base de données configurée :
1. **Démarrer l'application** : `npm start`
2. **Ajouter un véhicule** dans l'onglet "Véhicules"
3. **Générer un QR code** et cliquer sur "Sauvegarder"
4. **Vérifier dans Supabase** que les données sont bien sauvegardées

## Structure des données

### Table qr_codes
```sql
- id: TEXT (clé primaire)
- vehicle_id: TEXT (ID unique du véhicule)
- vehicle_name: TEXT (nom du véhicule)
- owner_id: TEXT (ID du propriétaire)
- qr_string: TEXT (code QR généré)
- qr_code_url: TEXT (URL du fichier dans le bucket)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Bucket notifcar-qr-codes
- Stockage des fichiers QR codes
- Structure : `qr-codes/{vehicle_id}_{timestamp}.txt`
- Accès public en lecture
- Upload authentifié

## Sécurité

- **RLS activé** : Chaque utilisateur ne peut voir que ses propres données
- **Politiques strictes** : Contrôle d'accès basé sur l'utilisateur authentifié
- **Validation des données** : Contrôles côté client et serveur

## Dépannage

### Erreur "bucket not found"
- Vérifier que le bucket `notifcar-qr-codes` a été créé
- Vérifier les permissions du bucket

### Erreur "table doesn't exist"
- Vérifier que le script SQL a été exécuté complètement
- Vérifier les noms de tables (sensible à la casse)

### Erreur d'authentification
- Vérifier les variables d'environnement
- Vérifier que l'utilisateur est bien connecté
