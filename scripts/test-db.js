// Script de test pour vérifier la connexion à la base de données
// À exécuter avec: node scripts/test-db.js

const { createClient } = require('@supabase/supabase-js');

// Remplacez par vos vraies clés Supabase
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🔍 Test de connexion à la base de données...');
  
  try {
    // Test 1: Vérifier la structure de la table vehicles
    console.log('\n1. Vérification de la structure de la table vehicles...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'vehicles');
    
    if (tableError) {
      console.error('❌ Erreur récupération structure table:', tableError);
    } else {
      console.log('✅ Structure de la table vehicles:');
      tableInfo.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }

    // Test 2: Vérifier les buckets de stockage
    console.log('\n2. Vérification des buckets de stockage...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Erreur récupération buckets:', bucketError);
    } else {
      console.log('✅ Buckets disponibles:');
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (public: ${bucket.public})`);
      });
    }

    // Test 3: Test d'insertion d'un véhicule de test
    console.log('\n3. Test d\'insertion d\'un véhicule de test...');
    const testVehicle = {
      id: 'TEST_' + Date.now(),
      name: 'Véhicule de test',
      brand: 'Test Brand',
      model: 'Test Model',
      year: 2024,
      license_plate: 'TEST-123',
      color: 'Rouge',
      notes: 'Véhicule de test pour vérification',
      owner_id: 'test-user-id',
      qr_code_id: null,
    };

    const { data: insertData, error: insertError } = await supabase
      .from('vehicles')
      .insert(testVehicle)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erreur insertion véhicule:', insertError);
    } else {
      console.log('✅ Véhicule de test inséré avec succès:', insertData);
      
      // Nettoyer le véhicule de test
      await supabase
        .from('vehicles')
        .delete()
        .eq('id', testVehicle.id);
      console.log('🧹 Véhicule de test supprimé');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testDatabase();
