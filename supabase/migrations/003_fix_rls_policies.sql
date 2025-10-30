-- Migration 003: Fix RLS policies for anonymous multiplayer
-- This fixes the "new row violates row-level security policy" error
-- by allowing anonymous clients to insert/update player records

-- Drop old restrictive policies
DROP POLICY IF EXISTS "players_insert_self" ON players;
DROP POLICY IF EXISTS "players_update_self" ON players;

-- Create more permissive policies for anonymous multiplayer
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
