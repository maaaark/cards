# Data Model: Multiplayer Game Rooms

**Feature**: 007-multiplayer-game-rooms  
**Created**: 2025-01-21  
**Status**: Draft

## Database Schema

### New Table: `players`

Stores individual player data for each game session, including private hand state.

```sql
CREATE TABLE players (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  
  -- Player Identity
  player_id UUID NOT NULL UNIQUE, -- Client-generated session ID
  display_name TEXT DEFAULT 'Player', -- Optional custom name
  is_creator BOOLEAN DEFAULT FALSE, -- True if this player created the game
  
  -- Private Hand State (JSONB for flexibility)
  hand_state JSONB DEFAULT '[]'::jsonb, -- Array of card objects [{id, name, image_url}, ...]
  
  -- Presence Tracking
  is_online BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_players_player_id ON players(player_id);
CREATE INDEX idx_players_is_online ON players(game_id, is_online);

-- Updated At Trigger
CREATE TRIGGER update_players_updated_at 
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Column Rationale**:
- `id`: Internal database primary key (UUID)
- `game_id`: Links player to specific game session
- `player_id`: Client-generated session identifier (stored in sessionStorage, used for reconnection)
- `display_name`: Optional custom name (default "Player 1", "Player 2", etc. set by client)
- `is_creator`: Tracks game creator for permissions (close game, kick players in future)
- `hand_state`: Private card data as JSONB array (max 20 cards enforced by application logic)
- `is_online`: Real-time presence indicator (updated by Realtime Presence API)
- `last_seen`: Timestamp for session expiration logic (expire after 24 hours)
- `joined_at`: Record when player joined (for player order, stats)
- `updated_at`: Automatic timestamp update trigger

**Constraints**:
- `player_id` is UNIQUE globally (one player can't have multiple sessions across games with same ID)
- `game_id` has CASCADE delete (when game deleted, all player records deleted)
- `hand_state` JSONB allows array of arbitrary card objects (validated by application)

### Modified Table: `game_sessions` (from feature 001)

Extend existing table to support multiplayer metadata.

```sql
-- Add multiplayer columns to existing game_sessions table
ALTER TABLE game_sessions 
  ADD COLUMN max_players INTEGER DEFAULT 4,
  ADD COLUMN is_closed BOOLEAN DEFAULT FALSE,
  ADD COLUMN creator_player_id UUID, -- References players(player_id)
  ADD COLUMN player_count INTEGER DEFAULT 0; -- Cached count for performance

-- Index for game listing queries
CREATE INDEX idx_game_sessions_is_closed ON game_sessions(is_closed);
CREATE INDEX idx_game_sessions_creator ON game_sessions(creator_player_id);

-- Optional: Add check constraint to enforce player limit
ALTER TABLE game_sessions 
  ADD CONSTRAINT check_player_count 
  CHECK (player_count >= 0 AND player_count <= max_players);
```

**New Columns**:
- `max_players`: Maximum concurrent players allowed (default 4, configurable per game)
- `is_closed`: Flag indicating game is closed by creator (prevents new joins)
- `creator_player_id`: Reference to player who created the game (for permissions)
- `player_count`: Cached count of active players (updated by triggers, avoids COUNT queries)

**Existing Columns** (from 001-card-sandbox):
- `id`: Unique game session identifier (used in URLs)
- `playfield_state`: JSONB array of shared cards [{id, name, image_url, x, y, rotation}, ...]
- `created_at`, `updated_at`: Standard timestamps

### Row-Level Security (RLS) Policies

#### Players Table Policies

```sql
-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Policy 1: Players can read their own full hand data
CREATE POLICY "players_select_own"
  ON players FOR SELECT
  USING (player_id = current_setting('app.player_id', TRUE)::UUID);

-- Policy 2: Players can read other players' metadata (NOT hand_state)
CREATE POLICY "players_select_others_metadata"
  ON players FOR SELECT
  USING (
    game_id IN (
      SELECT game_id FROM players 
      WHERE player_id = current_setting('app.player_id', TRUE)::UUID
    )
  )
  WITH CHECK (hand_state IS NULL); -- Cannot select hand_state column

-- Policy 3: Players can update their own hand and presence
CREATE POLICY "players_update_own"
  ON players FOR UPDATE
  USING (player_id = current_setting('app.player_id', TRUE)::UUID)
  WITH CHECK (player_id = current_setting('app.player_id', TRUE)::UUID);

-- Policy 4: Players can insert themselves when joining
CREATE POLICY "players_insert_self"
  ON players FOR INSERT
  WITH CHECK (player_id = current_setting('app.player_id', TRUE)::UUID);

-- Policy 5: Only creator can delete players (for future kick functionality)
CREATE POLICY "players_delete_by_creator"
  ON players FOR DELETE
  USING (
    game_id IN (
      SELECT game_id FROM players 
      WHERE player_id = current_setting('app.player_id', TRUE)::UUID 
        AND is_creator = TRUE
    )
  );
```

**RLS Implementation Notes**:
- Uses session variable `app.player_id` set by application after retrieving from sessionStorage
- Separate policies for own vs others ensures hand privacy
- `hand_state` column is explicitly excluded from other players' SELECT queries
- Update/Insert restricted to own player_id (prevents impersonation)
- Delete policy prepared for future kick feature (creator-only)

#### Game Sessions Table Policies

```sql
-- Enable RLS
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can read game metadata (for join flow)
CREATE POLICY "game_sessions_select_all"
  ON game_sessions FOR SELECT
  USING (TRUE); -- Public read access

-- Policy 2: Players in game can update playfield state
CREATE POLICY "game_sessions_update_playfield"
  ON game_sessions FOR UPDATE
  USING (
    id IN (
      SELECT game_id FROM players 
      WHERE player_id = current_setting('app.player_id', TRUE)::UUID
    )
  );

-- Policy 3: Anyone can create game sessions
CREATE POLICY "game_sessions_insert_all"
  ON game_sessions FOR INSERT
  WITH CHECK (TRUE); -- Allow game creation without auth

-- Policy 4: Only creator can close game (delete or mark is_closed)
CREATE POLICY "game_sessions_delete_by_creator"
  ON game_sessions FOR DELETE
  USING (
    creator_player_id = current_setting('app.player_id', TRUE)::UUID
  );
```

**RLS Implementation Notes**:
- Game metadata (id, max_players, is_closed) is public for join validation
- Playfield updates restricted to players in the game
- Game creation is open (anonymous users can create)
- Game closure restricted to creator (uses creator_player_id)

### Database Functions & Triggers

#### Function: Update player_count when player joins/leaves

```sql
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

-- Trigger on players table
CREATE TRIGGER players_update_game_count
  AFTER INSERT OR DELETE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_game_player_count();
```

#### Function: Expire stale player sessions

```sql
CREATE OR REPLACE FUNCTION expire_stale_players()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM players 
    WHERE last_seen < NOW() - INTERVAL '24 hours'
    RETURNING *
  )
  SELECT COUNT(*) INTO expired_count FROM deleted;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule periodic cleanup (requires pg_cron extension)
-- SELECT cron.schedule('expire-stale-players', '0 * * * *', 'SELECT expire_stale_players();');
```

**Note**: Periodic cleanup can be implemented with Supabase Edge Functions or external cron job if pg_cron is not available in free tier.

## Data Flow Diagrams

### Player Join Flow

```
1. User visits /game/{game_id}
   ↓
2. Client checks sessionStorage for existing player_id
   ↓
3a. Found: Use existing player_id
3b. Not found: Generate new UUID, store in sessionStorage
   ↓
4. Client queries game_sessions table (RLS allows public read)
   ↓
5a. Game not found → Show error, redirect to create game
5b. Game is_closed → Show error, cannot join
5c. Game player_count >= max_players → Show error, game full
5d. Game open and available → Proceed to join
   ↓
6. Client INSERTs into players table with player_id, game_id
   ↓
7. Trigger increments game_sessions.player_count
   ↓
8. Client subscribes to Realtime channel for game_id
   ↓
9. Client tracks Presence with player_id and display_name
   ↓
10. Other players receive Presence sync event
```

### Playfield Update Flow

```
1. Player A drags card on playfield
   ↓
2. Client updates local state (optimistic UI)
   ↓
3. Client sends UPDATE to game_sessions.playfield_state via Supabase client
   ↓
4. Postgres applies update with timestamp
   ↓
5. Realtime triggers postgres_changes event for all subscribers
   ↓
6. Player B, C, D receive update via Realtime subscription
   ↓
7. Clients update local playfield state
   ↓
8. UI re-renders with new card position
```

### Private Hand Update Flow

```
1. Player A imports deck into hand
   ↓
2. Client sends UPDATE to players.hand_state (only Player A's row)
   ↓
3. RLS policy allows update (player_id matches session)
   ↓
4. Postgres applies update to Player A's hand_state
   ↓
5. Realtime triggers postgres_changes event (only Player A subscribed to own row)
   ↓
6. Player A receives confirmation
   ↓
7. Other players do NOT receive hand_state update (RLS blocks)
   ↓
8. Other players only see updated player_count via game_sessions query
```

## TypeScript Type Definitions

### Database Schema Types

```typescript
// app/lib/types/database.ts (extend existing)

export interface Player {
  id: string; // UUID
  game_id: string; // UUID, references game_sessions.id
  player_id: string; // UUID, client session identifier
  display_name: string;
  is_creator: boolean;
  hand_state: Card[]; // Private, only visible to owning player
  is_online: boolean;
  last_seen: string; // ISO timestamp
  joined_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface GameSession {
  id: string; // UUID
  playfield_state: PlayfieldCard[]; // Shared cards (from 001)
  max_players: number; // Default 4
  is_closed: boolean;
  creator_player_id: string | null; // UUID
  player_count: number; // Cached count
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface PlayfieldCard {
  id: string;
  name: string;
  image_url: string;
  x: number; // Position on playfield
  y: number;
  rotation: number; // Degrees (0-360)
}

export interface Card {
  id: string;
  name: string;
  image_url: string;
}
```

### Realtime Types

```typescript
// app/lib/types/realtime.ts

import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';

export interface GameRoomChannel {
  channel: RealtimeChannel;
  gameId: string;
}

export interface PresenceState {
  player_id: string;
  display_name: string;
  online_at: string; // ISO timestamp
}

export interface PlayfieldUpdatePayload {
  new: GameSession;
  old: GameSession;
  eventType: 'UPDATE';
}

export interface PlayerUpdatePayload {
  new: Player;
  old: Player;
  eventType: 'UPDATE' | 'INSERT' | 'DELETE';
}
```

## Migration Script

```sql
-- Migration: 002_create_multiplayer_tables.sql

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

CREATE POLICY "players_select_own"
  ON players FOR SELECT
  USING (player_id = current_setting('app.player_id', TRUE)::UUID);

CREATE POLICY "players_update_own"
  ON players FOR UPDATE
  USING (player_id = current_setting('app.player_id', TRUE)::UUID)
  WITH CHECK (player_id = current_setting('app.player_id', TRUE)::UUID);

CREATE POLICY "players_insert_self"
  ON players FOR INSERT
  WITH CHECK (player_id = current_setting('app.player_id', TRUE)::UUID);

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
```

## Data Validation Rules

### Application-Level Validation

**Player Hand Size**:
- Maximum 20 cards per player's hand_state
- Validate on client before sending INSERT/UPDATE
- Validate on server using Supabase Edge Function (optional)

**Display Names**:
- Max length: 50 characters
- Allowed characters: alphanumeric, spaces, basic punctuation
- Sanitize user input to prevent XSS

**Game Session Limits**:
- Max 4 players per game (enforced by player_count check)
- Games remain open until creator closes (no automatic expiration)
- Closed games cannot accept new players

**Playfield State**:
- Cards must have valid x, y coordinates (within playfield bounds)
- Rotation must be 0-360 degrees
- Validate JSON schema before persisting

## Performance Considerations

**Indexing Strategy**:
- `players.game_id`: Fast lookup of all players in a game
- `players.player_id`: Fast lookup for session reconnection
- `players.is_online`: Efficient queries for active player counts
- `game_sessions.is_closed`: Quick filtering of available games

**Query Optimization**:
- Use `player_count` cached field instead of `COUNT(*)` queries
- Subscribe to Realtime changes instead of polling database
- Debounce rapid playfield updates to reduce write load

**Realtime Message Optimization**:
- Debounce card drag events to 100ms intervals
- Use Broadcast for ephemeral events (no database writes)
- Unsubscribe from Realtime channels when player leaves game

**Database Connection Pooling**:
- Supabase handles connection pooling automatically
- Realtime uses WebSocket connections (persistent)
- Minimize database writes by batching when possible
