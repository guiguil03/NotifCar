# 🧪 Guide de Test du Système de Chat

## 📋 Comment tester le système de chat NotifCar

### **1. Méthode de Test Rapide (Recommandée)**

#### **Étape 1 : Accéder au mode test**
1. Ouvrez l'application NotifCar
2. Allez dans l'onglet **"Scanner"**
3. En bas de l'écran, vous verrez un bouton vert **"Test Chat"**
4. Appuyez sur ce bouton

#### **Étape 2 : Créer une conversation de test**
1. Dans le modal qui s'ouvre, vous avez deux options :
   - **"Test Auto (Recommandé)"** : Crée automatiquement une conversation de test
   - **"Créer Conversation Test"** : Personnalisez le message et l'ID véhicule

2. Appuyez sur **"Test Auto (Recommandé)"**

#### **Étape 3 : Tester le chat**
1. Allez dans l'onglet **"Messages"**
2. Vous devriez voir une nouvelle conversation de test
3. Appuyez sur cette conversation pour l'ouvrir
4. Envoyez des messages pour tester le système
5. Testez les boutons de statut (Résolu/Fermé)

---

### **2. Méthode de Test avec QR Code Réel**

#### **Étape 1 : Générer un QR Code**
1. Allez dans l'onglet **"Véhicules"**
2. Ajoutez un véhicule ou sélectionnez-en un existant
3. Appuyez sur **"Générer QR"** ou **"Voir QR"**
4. Sauvegardez l'image du QR code

#### **Étape 2 : Scanner le QR Code**
1. Allez dans l'onglet **"Scanner"**
2. Scannez le QR code que vous venez de générer
3. Un modal s'ouvrira pour envoyer un message
4. Tapez un message de test et appuyez sur **"Envoyer"**

#### **Étape 3 : Vérifier la conversation**
1. Allez dans l'onglet **"Messages"**
2. Vous devriez voir la nouvelle conversation
3. Testez l'envoi de messages

---

### **3. Test avec Deux Utilisateurs (Test Complet)**

#### **Étape 1 : Créer un deuxième compte**
1. Déconnectez-vous de l'application
2. Créez un nouveau compte avec un autre email
3. Connectez-vous avec ce nouveau compte

#### **Étape 2 : Ajouter un véhicule**
1. Ajoutez un véhicule dans l'onglet **"Véhicules"**
2. Générez un QR code pour ce véhicule

#### **Étape 3 : Scanner depuis le premier compte**
1. Reconnectez-vous avec votre premier compte
2. Scannez le QR code généré par le deuxième compte
3. Envoyez un message

#### **Étape 4 : Vérifier la communication**
1. Reconnectez-vous avec le deuxième compte
2. Allez dans l'onglet **"Messages"**
3. Vous devriez voir la conversation
4. Répondez au message

---

### **4. Fonctionnalités à Tester**

#### **✅ Interface de Chat**
- [ ] Affichage des conversations dans la liste
- [ ] Ouverture d'une conversation
- [ ] Envoi de messages
- [ ] Réception de messages en temps réel
- [ ] Affichage des timestamps
- [ ] Distinction visuelle entre vos messages et ceux des autres

#### **✅ Gestion des Statuts**
- [ ] Marquer une conversation comme "Résolue"
- [ ] Marquer une conversation comme "Fermée"
- [ ] Affichage des badges de statut
- [ ] Compteur de messages non lus

#### **✅ Notifications et Temps Réel**
- [ ] Mise à jour automatique des conversations
- [ ] Apparition des nouveaux messages sans rechargement
- [ ] Marquage automatique des messages comme lus

#### **✅ Intégration QR Code**
- [ ] Scan d'un QR code valide
- [ ] Ouverture du modal de message
- [ ] Création automatique de conversation
- [ ] Validation des QR codes invalides

---

### **5. Dépannage**

#### **❌ Problème : "Aucune conversation"**
- **Solution** : Utilisez le bouton "Test Chat" pour créer une conversation de test

#### **❌ Problème : "Impossible d'envoyer le message"**
- **Solution** : Vérifiez votre connexion internet et réessayez

#### **❌ Problème : QR Code non reconnu**
- **Solution** : Assurez-vous que le QR code a été généré par l'application NotifCar

#### **❌ Problème : Messages ne s'affichent pas**
- **Solution** : Rafraîchissez la liste des conversations en tirant vers le bas

---

### **6. Base de Données**

Pour vérifier que les données sont bien sauvegardées, vous pouvez :

1. **Aller dans Supabase Dashboard**
2. **Vérifier les tables** :
   - `conversations` : Liste des conversations
   - `messages` : Messages échangés
   - `conversation_participants` : Participants aux conversations

---

### **7. Logs de Debug**

Pour voir les logs de l'application :
1. Ouvrez les outils de développement
2. Regardez la console pour les messages de debug
3. Les erreurs apparaîtront avec le préfixe "Erreur chat:" ou "Erreur conversation:"

---

## 🎯 Résultat Attendu

Après avoir suivi ce guide, vous devriez avoir :
- ✅ Une conversation de test fonctionnelle
- ✅ La possibilité d'envoyer et recevoir des messages
- ✅ Un système de chat entièrement opérationnel
- ✅ L'intégration QR Code → Chat fonctionnelle

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que la base de données est correctement configurée
2. Assurez-vous que les tables `conversations` et `messages` existent
3. Vérifiez que les politiques RLS sont activées
4. Consultez les logs de l'application pour plus de détails
