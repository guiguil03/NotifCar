# Configuration de la table signalizations

## 🚀 Instructions manuelles

Pour créer la table `signalizations` dans Supabase, suivez ces étapes :

### 1. Ouvrir Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous à votre projet
3. Allez dans l'onglet **SQL Editor**

### 2. Exécuter le SQL
Copiez et collez le contenu du fichier `database/create_signalizations_table.sql` dans l'éditeur SQL et exécutez-le.

### 3. Vérifier la création
Après exécution, vous devriez voir :
- ✅ Table `signalizations` créée
- ✅ Fonctions RPC créées :
  - `create_signalization()`
  - `get_user_signalizations()`
  - `get_received_signalizations()`
- ✅ Politiques RLS configurées
- ✅ Index de performance créés

### 4. Tester
Une fois la table créée, vous pouvez tester l'application !

## 🔧 Alternative : Script automatique

Si vous préférez, vous pouvez aussi exécuter le script Node.js qui va essayer de créer la table :

```bash
node scripts/setup-signalizations.js
```

Mais il est recommandé d'utiliser l'interface web de Supabase pour plus de contrôle.
