# Guide de test de l'authentification Notifcar

## 🧪 **Test de l'authentification**

### **Étape 1 : Premier lancement**
1. Lancez l'application
2. Vous devriez voir l'écran de chargement avec le logo Notifcar
3. Puis être redirigé vers l'écran d'authentification

### **Étape 2 : Test d'inscription**
1. Sur l'écran d'authentification, assurez-vous d'être en mode "Créer un compte"
2. Remplissez les champs :
   - **Nom complet** : Votre nom
   - **Email** : votre-email@example.com
   - **Mot de passe** : un mot de passe sécurisé (min 6 caractères)
3. Cliquez sur "Créer le compte"
4. Vous devriez voir un message de succès
5. Vérifiez votre email pour confirmer l'inscription

### **Étape 3 : Test de connexion**
1. Après avoir confirmé votre email, revenez à l'app
2. Passez en mode "Connexion"
3. Entrez vos identifiants :
   - **Email** : votre-email@example.com
   - **Mot de passe** : votre mot de passe
4. Cliquez sur "Se connecter"
5. Vous devriez être redirigé vers la page d'accueil de l'application

### **Étape 4 : Test de déconnexion**
1. Allez dans l'onglet "Profil"
2. Cliquez sur "Se déconnecter"
3. Confirmez la déconnexion
4. Vous devriez être redirigé vers l'écran d'authentification

### **Étape 5 : Test de persistance**
1. Fermez complètement l'application
2. Relancez l'application
3. Si vous étiez connecté, vous devriez être directement redirigé vers l'app
4. Si vous n'étiez pas connecté, vous devriez voir l'écran d'authentification

## 🔧 **Dépannage**

### **Problème : "Invalid login credentials"**
- Vérifiez que votre email est correct
- Vérifiez que votre mot de passe est correct
- Assurez-vous d'avoir confirmé votre email après l'inscription

### **Problème : "Email not confirmed"**
- Vérifiez votre boîte email (et les spams)
- Cliquez sur le lien de confirmation
- Revenez à l'app et essayez de vous connecter

### **Problème : Redirection qui ne fonctionne pas**
- Vérifiez la console pour les logs
- Redémarrez l'application
- Vérifiez que Supabase est bien configuré

## 📱 **Fonctionnalités testées**

- ✅ Écran de chargement initial
- ✅ Redirection vers l'authentification si non connecté
- ✅ Formulaire d'inscription
- ✅ Formulaire de connexion
- ✅ Redirection vers l'app après connexion
- ✅ Affichage des informations utilisateur dans le profil
- ✅ Déconnexion
- ✅ Persistance de session
- ✅ Protection des routes

## 🎯 **Prochaines étapes**

Une fois l'authentification testée et fonctionnelle :
1. Configuration des tables Supabase pour les véhicules
2. Intégration des données utilisateur avec les véhicules
3. Système de notifications en temps réel
4. Gestion des profils utilisateur
