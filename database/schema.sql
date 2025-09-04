-- Schéma de base de données pour NotifCar
-- À exécuter dans Supabase SQL Editor

-- Table des QR codes
CREATE TABLE IF NOT EXISTS qr_codes (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  vehicle_name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  qr_string TEXT NOT NULL,
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_qr_codes_owner_id ON qr_codes(owner_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_vehicle_id ON qr_codes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON qr_codes(created_at);

-- Table des véhicules (optionnelle, pour une gestion plus complète)
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  license_plate TEXT NOT NULL,
  color TEXT,
  notes TEXT,
  owner_id TEXT NOT NULL,
  qr_code_id TEXT REFERENCES qr_codes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour la table véhicules
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_qr_code_id ON vehicles(qr_code_id);

-- Table des notifications (pour l'historique des scans)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  scanner_id TEXT NOT NULL,
  message TEXT,
  notification_type TEXT DEFAULT 'scan',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les notifications
CREATE INDEX IF NOT EXISTS idx_notifications_vehicle_id ON notifications(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scanner_id ON notifications(scanner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Politique RLS (Row Level Security)
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques pour qr_codes
CREATE POLICY "Users can view their own QR codes" ON qr_codes
  FOR SELECT USING (auth.uid()::text = owner_id);

CREATE POLICY "Users can insert their own QR codes" ON qr_codes
  FOR INSERT WITH CHECK (auth.uid()::text = owner_id);

CREATE POLICY "Users can update their own QR codes" ON qr_codes
  FOR UPDATE USING (auth.uid()::text = owner_id);

CREATE POLICY "Users can delete their own QR codes" ON qr_codes
  FOR DELETE USING (auth.uid()::text = owner_id);

-- Politiques pour vehicles
CREATE POLICY "Users can view their own vehicles" ON vehicles
  FOR SELECT USING (auth.uid()::text = owner_id);

CREATE POLICY "Users can insert their own vehicles" ON vehicles
  FOR INSERT WITH CHECK (auth.uid()::text = owner_id);

CREATE POLICY "Users can update their own vehicles" ON vehicles
  FOR UPDATE USING (auth.uid()::text = owner_id);

CREATE POLICY "Users can delete their own vehicles" ON vehicles
  FOR DELETE USING (auth.uid()::text = owner_id);

-- Politiques pour notifications
CREATE POLICY "Users can view notifications for their vehicles" ON notifications
  FOR SELECT USING (
    vehicle_id IN (
      SELECT vehicle_id FROM qr_codes WHERE owner_id = auth.uid()::text
    )
  );

CREATE POLICY "Anyone can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Créer le bucket pour les QR codes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('QRCodec', 'QRCodec', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour le bucket QRCodec
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
