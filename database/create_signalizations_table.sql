-- Créer la table signalizations pour stocker les données du formulaire
CREATE TABLE IF NOT EXISTS signalizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Utilisateur qui fait la signalisation
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Véhicule concerné
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  
  -- Données du formulaire
  reason_type VARCHAR(50) NOT NULL, -- 'stationnement_genant', 'probleme_technique', 'accident', 'vehicule_abandonne', 'autre'
  custom_reason TEXT, -- Si reason_type = 'autre'
  vehicle_issue TEXT, -- Problème observé sur le véhicule
  urgency_level VARCHAR(20) NOT NULL DEFAULT 'normal', -- 'urgent', 'important', 'normal'
  custom_message TEXT, -- Message personnalisé
  
  -- Statut de la signalisation
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'resolved', 'closed'
  
  -- Conversation liée (optionnelle)
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_signalizations_reporter_id ON signalizations(reporter_id);
CREATE INDEX IF NOT EXISTS idx_signalizations_vehicle_id ON signalizations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_signalizations_created_at ON signalizations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signalizations_status ON signalizations(status);

-- RLS (Row Level Security)
ALTER TABLE signalizations ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs peuvent voir leurs propres signalisations
CREATE POLICY "Users can view their own signalizations" ON signalizations
  FOR SELECT USING (auth.uid() = reporter_id);

-- Politique : les propriétaires de véhicules peuvent voir les signalisations de leurs véhicules
CREATE POLICY "Vehicle owners can view signalizations of their vehicles" ON signalizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = signalizations.vehicle_id 
      AND vehicles.owner_id = auth.uid()
    )
  );

-- Politique : les utilisateurs peuvent créer des signalisations
CREATE POLICY "Users can create signalizations" ON signalizations
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Politique : les utilisateurs peuvent mettre à jour leurs signalisations
CREATE POLICY "Users can update their own signalizations" ON signalizations
  FOR UPDATE USING (auth.uid() = reporter_id);

-- Politique : les propriétaires de véhicules peuvent mettre à jour les signalisations de leurs véhicules
CREATE POLICY "Vehicle owners can update signalizations of their vehicles" ON signalizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = signalizations.vehicle_id 
      AND vehicles.owner_id = auth.uid()
    )
  );

-- Fonction pour créer une signalisation
CREATE OR REPLACE FUNCTION create_signalization(
  p_vehicle_id UUID,
  p_reason_type VARCHAR(50),
  p_custom_reason TEXT DEFAULT NULL,
  p_vehicle_issue TEXT DEFAULT NULL,
  p_urgency_level VARCHAR(20) DEFAULT 'normal',
  p_custom_message TEXT DEFAULT NULL,
  p_conversation_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  signalization_id UUID;
BEGIN
  INSERT INTO signalizations (
    reporter_id,
    vehicle_id,
    reason_type,
    custom_reason,
    vehicle_issue,
    urgency_level,
    custom_message,
    conversation_id
  ) VALUES (
    auth.uid(),
    p_vehicle_id,
    p_reason_type,
    p_custom_reason,
    p_vehicle_issue,
    p_urgency_level,
    p_custom_message,
    p_conversation_id
  ) RETURNING id INTO signalization_id;
  
  RETURN signalization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les signalisations d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_signalizations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  reporter_id UUID,
  vehicle_id UUID,
  reason_type VARCHAR(50),
  custom_reason TEXT,
  vehicle_issue TEXT,
  urgency_level VARCHAR(20),
  custom_message TEXT,
  status VARCHAR(20),
  conversation_id UUID,
  -- Informations du véhicule
  vehicle_brand VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_license_plate VARCHAR(20),
  -- Informations du rapporteur
  reporter_display_name VARCHAR(100),
  reporter_email VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.created_at,
    s.reporter_id,
    s.vehicle_id,
    s.reason_type,
    s.custom_reason,
    s.vehicle_issue,
    s.urgency_level,
    s.custom_message,
    s.status,
    s.conversation_id,
    v.brand as vehicle_brand,
    v.model as vehicle_model,
    v.license_plate as vehicle_license_plate,
    p.display_name as reporter_display_name,
    p.email as reporter_email
  FROM signalizations s
  LEFT JOIN vehicles v ON v.id = s.vehicle_id
  LEFT JOIN profiles p ON p.id = s.reporter_id
  WHERE s.reporter_id = p_user_id
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les signalisations reçues (pour les propriétaires de véhicules)
CREATE OR REPLACE FUNCTION get_received_signalizations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  reporter_id UUID,
  vehicle_id UUID,
  reason_type VARCHAR(50),
  custom_reason TEXT,
  vehicle_issue TEXT,
  urgency_level VARCHAR(20),
  custom_message TEXT,
  status VARCHAR(20),
  conversation_id UUID,
  -- Informations du véhicule
  vehicle_brand VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_license_plate VARCHAR(20),
  -- Informations du rapporteur
  reporter_display_name VARCHAR(100),
  reporter_email VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.created_at,
    s.reporter_id,
    s.vehicle_id,
    s.reason_type,
    s.custom_reason,
    s.vehicle_issue,
    s.urgency_level,
    s.custom_message,
    s.status,
    s.conversation_id,
    v.brand as vehicle_brand,
    v.model as vehicle_model,
    v.license_plate as vehicle_license_plate,
    p.display_name as reporter_display_name,
    p.email as reporter_email
  FROM signalizations s
  LEFT JOIN vehicles v ON v.id = s.vehicle_id
  LEFT JOIN profiles p ON p.id = s.reporter_id
  WHERE v.owner_id = p_user_id
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
