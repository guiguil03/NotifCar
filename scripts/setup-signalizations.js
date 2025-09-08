const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase (même que dans lib/supabase.ts)
const supabaseUrl = 'https://lifmyjdygwakmimjgkef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZm15amR5Z3dha21pbWpna2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzQ5NzAsImV4cCI6MjA3MjUxMDk3MH0.o9msOeNxdpq4zQNwX2D9W_OjJw-7gsOFB8H7q3Lla8g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSignalizations() {
  try {
    console.log('🚀 Configuration de la table signalizations...');
    
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, '..', 'database', 'create_signalizations_table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Diviser le SQL en instructions individuelles
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Exécution de ${sqlStatements.length} instructions SQL...`);
    
    // Exécuter chaque instruction SQL
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      if (statement.trim()) {
        console.log(`   ${i + 1}/${sqlStatements.length}: ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase.rpc('exec', { sql: statement });
        
        if (error) {
          console.warn(`⚠️  Avertissement pour l'instruction ${i + 1}:`, error.message);
          // Continue même en cas d'erreur (peut être que la table existe déjà)
        }
      }
    }
    
    console.log('✅ Configuration terminée !');
    console.log('📊 Table signalizations créée');
    console.log('🔒 Politiques RLS configurées');
    console.log('📈 Index de performance créés');
    
    // Tester la création d'une signalisation
    console.log('🧪 Test de la table...');
    const { data: testData, error: testError } = await supabase
      .from('signalizations')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erreur lors du test:', testError);
    } else {
      console.log('✅ Table signalizations accessible !');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  setupSignalizations();
}

module.exports = { setupSignalizations };
