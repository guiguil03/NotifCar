const fs = require('fs');
const path = require('path');

console.log('🔔 Configuration des notifications NotifCar...\n');

// 1. Vérifier si expo-device est installé
try {
  require('expo-device');
  console.log('✅ expo-device est installé');
} catch (error) {
  console.log('❌ expo-device manquant. Installation...');
  require('child_process').execSync('npx expo install expo-device', { stdio: 'inherit' });
  console.log('✅ expo-device installé');
}

// 2. Vérifier si expo-notifications est installé
try {
  require('expo-notifications');
  console.log('✅ expo-notifications est installé');
} catch (error) {
  console.log('❌ expo-notifications manquant. Installation...');
  require('child_process').execSync('npx expo install expo-notifications', { stdio: 'inherit' });
  console.log('✅ expo-notifications installé');
}

// 3. Lire app.json
const appJsonPath = path.join(__dirname, '..', 'app.json');
let appConfig = {};

try {
  appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  console.log('✅ app.json lu');
} catch (error) {
  console.log('❌ Erreur lecture app.json:', error.message);
  process.exit(1);
}

// 4. Vérifier la configuration des notifications
if (!appConfig.expo.extra?.eas?.projectId || appConfig.expo.extra.eas.projectId === 'your-project-id-here') {
  console.log('⚠️  Project ID manquant dans app.json');
  console.log('📝 Pour obtenir ton Project ID:');
  console.log('   1. npx eas login');
  console.log('   2. npx eas init');
  console.log('   3. Copie le Project ID dans app.json');
} else {
  console.log('✅ Project ID configuré:', appConfig.expo.extra.eas.projectId);
}

// 5. Vérifier les plugins de notifications
const hasNotificationPlugin = appConfig.expo.plugins?.some(plugin => 
  typeof plugin === 'string' ? plugin === 'expo-notifications' : plugin[0] === 'expo-notifications'
);

if (!hasNotificationPlugin) {
  console.log('⚠️  Plugin expo-notifications manquant dans app.json');
} else {
  console.log('✅ Plugin expo-notifications configuré');
}

// 6. Instructions finales
console.log('\n🚀 Prochaines étapes:');
console.log('   1. Exécute le script SQL: database/setup_notifications.sql');
console.log('   2. Configure ton Project ID Expo dans app.json');
console.log('   3. Teste les notifications avec: npx expo start');
console.log('\n✨ Configuration terminée !');
