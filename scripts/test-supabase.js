const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase (même que dans lib/supabase.ts)
const supabaseUrl = 'https://lifmyjdygwakmimjgkef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZm15amR5Z3dha21pbWpna2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzQ5NzAsImV4cCI6MjA3MjUxMDk3MH0.o9msOeNxdpq4zQNwX2D9W_OjJw-7gsOFB8H7q3Lla8g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    console.log('🧪 Test de connexion à Supabase...');
    
    // Tester la connexion
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('✅ Connexion Supabase OK');
    
    // Tester si la table signalizations existe
    console.log('🔍 Vérification de la table signalizations...');
    const { data: signalizationsData, error: signalizationsError } = await supabase
      .from('signalizations')
      .select('count')
      .limit(1);
    
    if (signalizationsError) {
      console.log('❌ Table signalizations n\'existe pas encore');
      console.log('📝 Erreur:', signalizationsError.message);
      console.log('');
      console.log('🚀 Pour créer la table, allez sur Supabase SQL Editor et exécutez :');
      console.log('   Le contenu du fichier database/create_signalizations_table.sql');
    } else {
      console.log('✅ Table signalizations existe !');
    }
    
    // Tester les autres tables
    console.log('🔍 Vérification des autres tables...');
    
    const tables = ['vehicles', 'profiles', 'conversations', 'messages'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: OK`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testSupabase();
