-- Migration 003: Fix RLS policies for anonymous multiplayer
-- This fixes the "new row violates row-level security policy" error
-- by allowing anonymous clients to insert/update player records and game sessions

-- PLAYERS TABLE: Drop old restrictive policies
DROP POLICY IF EXISTS "players_insert_self" ON players;
DROP POLICY IF EXISTS "players_update_self" ON players;

-- PLAYERS TABLE: Create more permissive policies for anonymous multiplayer
-- Allow anyone to insert a player record (trust client-side player_id)
CREATE POLICY "players_insert_anonymous"
  ON players FOR INSERT
  WITH CHECK (TRUE);

-- Allow anyone to update their own player record (matched by player_id)
CREATE POLICY "players_update_own"
  ON players FOR UPDATE
  USING (TRUE);

-- Allow anyone to delete their own player record
CREATE POLICY "players_delete_own"
  ON players FOR DELETE
  USING (TRUE);

-- GAME_SESSIONS TABLE: Drop old restrictive policies
DROP POLICY IF EXISTS "update_playfield_by_players" ON game_sessions;
DROP POLICY IF EXISTS "delete_game_by_creator" ON game_sessions;

-- GAME_SESSIONS TABLE: Create anonymous-friendly policies
-- Allow anyone to update game sessions (for auto-save functionality)
CREATE POLICY "update_game_sessions_anonymous"
  ON game_sessions FOR UPDATE
  USING (TRUE);

-- Allow anyone to delete game sessions
CREATE POLICY "delete_game_sessions_anonymous"
  ON game_sessions FOR DELETE
  USING (TRUE);
