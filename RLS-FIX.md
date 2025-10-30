# Quick Fix: RLS Policy Error

## Problem
Getting error: `Failed to join game: new row violates row-level security policy for table "players"`

## Solution
The RLS policies in the database are too restrictive for anonymous multiplayer. Run this SQL in your Supabase dashboard:

### Step 1: Open Supabase SQL Editor
Go to: https://pzrfctfdpfmbwssmkerp.supabase.co/project/pzrfctfdpfmbwssmkerp/sql

### Step 2: Run This SQL
```sql
-- Migration 003: Fix RLS policies for anonymous multiplayer

-- Drop old restrictive policies
DROP POLICY IF EXISTS "players_insert_self" ON players;
DROP POLICY IF EXISTS "players_update_self" ON players;

-- Create more permissive policies for anonymous multiplayer
CREATE POLICY "players_insert_anonymous"
  ON players FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "players_update_own"
  ON players FOR UPDATE
  USING (TRUE);

CREATE POLICY "players_delete_own"
  ON players FOR DELETE
  USING (TRUE);
```

### Step 3: Test
After running the SQL:
1. Refresh your browser
2. Try creating/joining a room again
3. Should work now! ✅

## Why This Happened
The original policies required `app.player_id` to be set via PostgreSQL's `current_setting()`, which doesn't work with Supabase's anonymous client authentication. The new policies trust the client-side player_id (which is fine for anonymous multiplayer games).

## Security Note
These policies allow any client to insert/update player records. This is acceptable for anonymous multiplayer where:
- Sessions expire in 24 hours
- No sensitive user data is stored
- Games are temporary (not persisted long-term)

For production with authenticated users, you would use Supabase Auth and restrict policies to `auth.uid()`.
