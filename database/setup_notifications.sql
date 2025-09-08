-- Créer la table pour les tokens de notification
CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_notification_tokens_user_id ON notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_token ON notification_tokens(token);

-- RLS (Row Level Security)
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir et modifier leurs propres tokens
CREATE POLICY "Users can manage their own notification tokens" ON notification_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Fonction pour nettoyer les tokens expirés
CREATE OR REPLACE FUNCTION cleanup_expired_notification_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_tokens 
  WHERE updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le token d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_notification_token(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  SELECT notification_tokens.token INTO token
  FROM notification_tokens
  WHERE user_id = p_user_id
  ORDER BY updated_at DESC
  LIMIT 1;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour envoyer une notification (simulation)
CREATE OR REPLACE FUNCTION send_notification(
  p_recipient_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
  token TEXT;
BEGIN
  -- Récupérer le token du destinataire
  SELECT get_user_notification_token(p_recipient_id) INTO token;
  
  IF token IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Ici tu pourrais intégrer avec un service de notification externe
  -- Pour l'instant, on retourne TRUE pour simuler le succès
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;