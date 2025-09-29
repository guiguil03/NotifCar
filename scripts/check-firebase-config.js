#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration Firebase...\n');

let hasErrors = false;

// Vérifier les fichiers de configuration
const requiredFiles = [
  { file: 'google-services.json', platform: 'Android' },
  { file: 'GoogleService-Info.plist', platform: 'iOS' },
  { file: 'firebase.json', platform: 'Configuration' }
];

requiredFiles.forEach(({ file, platform }) => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${platform}: ${file} trouvé`);
  } else {
    console.log(`❌ ${platform}: ${file} manquant`);
    hasErrors = true;
  }
});

// Vérifier app.json
console.log('\n📱 Vérification app.json...');
try {
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  // Vérifier les plugins Firebase
  const plugins = appJson.expo.plugins || [];
  const hasFirebaseApp = plugins.includes('@react-native-firebase/app');
  const hasFirebaseMessaging = plugins.some(plugin => 
    Array.isArray(plugin) && plugin[0] === '@react-native-firebase/messaging'
  );
  
  if (hasFirebaseApp) {
    console.log('✅ Plugin @react-native-firebase/app configuré');
  } else {
    console.log('❌ Plugin @react-native-firebase/app manquant');
    hasErrors = true;
  }
  
  if (hasFirebaseMessaging) {
    console.log('✅ Plugin @react-native-firebase/messaging configuré');
  } else {
    console.log('❌ Plugin @react-native-firebase/messaging manquant');
    hasErrors = true;
  }
  
  // Vérifier les fichiers Google Services
  if (appJson.expo.android?.googleServicesFile) {
    console.log('✅ Android googleServicesFile configuré');
  } else {
    console.log('❌ Android googleServicesFile manquant dans app.json');
    hasErrors = true;
  }
  
  if (appJson.expo.ios?.googleServicesFile) {
    console.log('✅ iOS googleServicesFile configuré');
  } else {
    console.log('❌ iOS googleServicesFile manquant dans app.json');
    hasErrors = true;
  }
  
} catch (error) {
  console.log('❌ Erreur lors de la lecture de app.json:', error.message);
  hasErrors = true;
}

// Vérifier eas.json
console.log('\n🔧 Vérification eas.json...');
try {
  const easJsonPath = path.join(__dirname, '..', 'eas.json');
  const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
  
  const profiles = ['development', 'preview', 'production'];
  profiles.forEach(profile => {
    if (easJson.build[profile]?.env?.EXPO_PUBLIC_FIREBASE_VAPID_KEY) {
      if (easJson.build[profile].env.EXPO_PUBLIC_FIREBASE_VAPID_KEY === 'YOUR_VAPID_KEY_HERE') {
        console.log(`⚠️  ${profile}: Clé VAPID non configurée (placeholder)`);
        hasErrors = true;
      } else {
        console.log(`✅ ${profile}: Clé VAPID configurée`);
      }
    } else {
      console.log(`❌ ${profile}: Clé VAPID manquante`);
      hasErrors = true;
    }
  });
  
} catch (error) {
  console.log('❌ Erreur lors de la lecture de eas.json:', error.message);
  hasErrors = true;
}

// Vérifier les dépendances
console.log('\n📦 Vérification des dépendances...');
try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredDeps = [
    '@react-native-firebase/app',
    '@react-native-firebase/analytics',
    '@react-native-firebase/messaging',
    'firebase'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} installé (${packageJson.dependencies[dep]})`);
    } else {
      console.log(`❌ ${dep} manquant`);
      hasErrors = true;
    }
  });
  
} catch (error) {
  console.log('❌ Erreur lors de la lecture de package.json:', error.message);
  hasErrors = true;
}

// Résultat final
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Configuration incomplète. Veuillez corriger les erreurs ci-dessus.');
  console.log('\n📖 Consultez EAS_BUILD_GUIDE.md pour plus d\'informations.');
  process.exit(1);
} else {
  console.log('✅ Configuration Firebase complète ! Vous pouvez lancer le build.');
  console.log('\n🚀 Commandes suggérées :');
  console.log('   eas build --profile development --platform all');
  console.log('   eas build --profile preview --platform android');
}
console.log('='.repeat(50));
