const { execSync } = require('child_process');

try {
  // Obtenir le Project ID depuis EAS
  const projectId = execSync('npx eas project:info --json', { encoding: 'utf8' });
  const info = JSON.parse(projectId);
  
  if (info.id) {
    console.log('Project ID trouvé:', info.id);
    console.log('Remplace "your-project-id-here" dans lib/notificationService.ts par:', info.id);
  } else {
    console.log('Aucun Project ID trouvé. Crée un projet EAS avec: npx eas init');
  }
} catch (error) {
  console.log('Erreur lors de la récupération du Project ID:');
  console.log('1. Installe EAS CLI: npm install -g @expo/eas-cli');
  console.log('2. Connecte-toi: eas login');
  console.log('3. Initialise le projet: eas init');
  console.log('4. Relance ce script: node scripts/get-project-id.js');
}
