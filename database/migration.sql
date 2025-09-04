-- Migration pour ajouter les colonnes manquantes à la table vehicles
-- À exécuter dans Supabase SQL Editor

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$ 
BEGIN
    -- Ajouter la colonne brand si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vehicles' AND column_name = 'brand') THEN
        ALTER TABLE vehicles ADD COLUMN brand TEXT;
    END IF;
    
    -- Ajouter la colonne model si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vehicles' AND column_name = 'model') THEN
        ALTER TABLE vehicles ADD COLUMN model TEXT;
    END IF;
    
    -- Ajouter la colonne year si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vehicles' AND column_name = 'year') THEN
        ALTER TABLE vehicles ADD COLUMN year INTEGER;
    END IF;
    
    -- Ajouter la colonne color si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vehicles' AND column_name = 'color') THEN
        ALTER TABLE vehicles ADD COLUMN color TEXT;
    END IF;
    
    -- Ajouter la colonne notes si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vehicles' AND column_name = 'notes') THEN
        ALTER TABLE vehicles ADD COLUMN notes TEXT;
    END IF;
    
    -- Renommer plate_number en license_plate si nécessaire
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'vehicles' AND column_name = 'plate_number') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'vehicles' AND column_name = 'license_plate') THEN
        ALTER TABLE vehicles RENAME COLUMN plate_number TO license_plate;
    END IF;
END $$;

-- Mettre à jour les contraintes NOT NULL pour les colonnes obligatoires
ALTER TABLE vehicles ALTER COLUMN brand SET NOT NULL;
ALTER TABLE vehicles ALTER COLUMN model SET NOT NULL;
ALTER TABLE vehicles ALTER COLUMN year SET NOT NULL;
ALTER TABLE vehicles ALTER COLUMN license_plate SET NOT NULL;

-- Mettre à jour les valeurs par défaut pour les colonnes existantes
UPDATE vehicles 
SET 
    brand = COALESCE(brand, 'Marque inconnue'),
    model = COALESCE(model, 'Modèle inconnu'),
    year = COALESCE(year, EXTRACT(YEAR FROM NOW())::INTEGER),
    license_plate = COALESCE(license_plate, 'XX-XXX-XX')
WHERE 
    brand IS NULL OR model IS NULL OR year IS NULL OR license_plate IS NULL;

-- Créer le bucket QRCodec s'il n'existe pas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('QRCodec', 'QRCodec', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques pour le bucket QRCodec
DO $$
BEGIN
    -- Supprimer les anciennes politiques si elles existent
    DROP POLICY IF EXISTS "Public read access for QR codes" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload QR codes" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own QR codes" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own QR codes" ON storage.objects;
    
    -- Créer les nouvelles politiques
    CREATE POLICY "Public read access for QR codes" ON storage.objects
      FOR SELECT USING (bucket_id = 'QRCodec');

    CREATE POLICY "Authenticated users can upload QR codes" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'QRCodec' 
        AND auth.role() = 'authenticated'
      );

    CREATE POLICY "Users can update their own QR codes" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'QRCodec' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );

    CREATE POLICY "Users can delete their own QR codes" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'QRCodec' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
END $$;
