-- Création de la table pour stocker les tokens FCM
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_updated_at ON fcm_tokens(updated_at);

-- RLS (Row Level Security)
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir/modifier leurs propres tokens
CREATE POLICY "Users can view their own FCM tokens" ON fcm_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own FCM tokens" ON fcm_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own FCM tokens" ON fcm_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own FCM tokens" ON fcm_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_fcm_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour la mise à jour automatique
CREATE TRIGGER update_fcm_tokens_updated_at
    BEFORE UPDATE ON fcm_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_fcm_tokens_updated_at();
