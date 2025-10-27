-- Migration: Create game_sessions table
-- Description: Creates the main table for storing game session state with JSONB columns
-- Created: 2025-10-27

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(64) UNIQUE NOT NULL,
  
  -- Game state stored as JSONB for flexibility
  deck_state JSONB NOT NULL DEFAULT '{"cards": [], "originalCount": 0}'::jsonb,
  hand_state JSONB NOT NULL DEFAULT '{"cards": []}'::jsonb,
  playfield_state JSONB NOT NULL DEFAULT '{"cards": []}'::jsonb,
  
  -- Metadata
  deck_metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_session_id ON game_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_updated_at ON game_sessions(updated_at);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before updates
DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON game_sessions;
CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Function to cleanup old sessions (older than 7 days)
-- Can be called manually or via scheduled job
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM game_sessions
  WHERE updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE game_sessions IS 'Stores game session state including deck, hand, and playfield';
COMMENT ON COLUMN game_sessions.session_id IS 'Unique session identifier stored in browser localStorage';
COMMENT ON COLUMN game_sessions.deck_state IS 'JSONB object containing deck cards and metadata';
COMMENT ON COLUMN game_sessions.hand_state IS 'JSONB object containing hand cards';
COMMENT ON COLUMN game_sessions.playfield_state IS 'JSONB object containing playfield cards';
COMMENT ON COLUMN game_sessions.deck_metadata IS 'JSONB object containing original deck import information';
