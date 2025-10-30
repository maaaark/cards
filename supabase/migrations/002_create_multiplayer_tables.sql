-- Migration: 002_create_multiplayer_tables.sql
-- Purpose: Add multiplayer support with players table, game_sessions extensions, RLS policies

-- Step 1: Create players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL UNIQUE,
  display_name TEXT DEFAULT 'Player',
  is_creator BOOLEAN DEFAULT FALSE,
  hand_state JSONB DEFAULT '[]'::jsonb,
  is_online BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_players_player_id ON players(player_id);
CREATE INDEX idx_players_is_online ON players(game_id, is_online);

-- Step 2: Extend game_sessions table
ALTER TABLE game_sessions 
  ADD COLUMN max_players INTEGER DEFAULT 4,
  ADD COLUMN is_closed BOOLEAN DEFAULT FALSE,
  ADD COLUMN creator_player_id UUID,
  ADD COLUMN player_count INTEGER DEFAULT 0;

CREATE INDEX idx_game_sessions_is_closed ON game_sessions(is_closed);
CREATE INDEX idx_game_sessions_creator ON game_sessions(creator_player_id);

ALTER TABLE game_sessions 
  ADD CONSTRAINT check_player_count 
  CHECK (player_count >= 0 AND player_count <= max_players);

-- Step 3: Create update trigger for players.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_players_updated_at 
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Create player count trigger
CREATE OR REPLACE FUNCTION update_game_player_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE game_sessions 
    SET player_count = player_count + 1 
    WHERE id = NEW.game_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE game_sessions 
    SET player_count = player_count - 1 
    WHERE id = OLD.game_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_update_game_count
  AFTER INSERT OR DELETE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_game_player_count();

-- Step 5: Enable RLS on players table
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view players in games (needed for player list)
CREATE POLICY "players_select_all"
  ON players FOR SELECT
  USING (TRUE);

-- Allow anonymous clients to update player records
CREATE POLICY "players_update_own"
  ON players FOR UPDATE
  USING (TRUE);

-- Allow anonymous clients to insert player records (trust client-side player_id)
CREATE POLICY "players_insert_anonymous"
  ON players FOR INSERT
  WITH CHECK (TRUE);

-- Allow players to delete their own records when leaving
CREATE POLICY "players_delete_own"
  ON players FOR DELETE
  USING (TRUE);

-- Step 6: Enable RLS on game_sessions table (if not already enabled)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_sessions_select_all"
  ON game_sessions FOR SELECT
  USING (TRUE);

CREATE POLICY "game_sessions_update_playfield"
  ON game_sessions FOR UPDATE
  USING (
    id IN (
      SELECT game_id FROM players 
      WHERE player_id = current_setting('app.player_id', TRUE)::UUID
    )
  );

CREATE POLICY "game_sessions_insert_all"
  ON game_sessions FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "game_sessions_delete_by_creator"
  ON game_sessions FOR DELETE
  USING (
    creator_player_id = current_setting('app.player_id', TRUE)::UUID
  );
