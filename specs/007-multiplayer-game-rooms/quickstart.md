# Quickstart: Multiplayer Game Rooms

**Feature**: 007-multiplayer-game-rooms  
**Created**: 2025-01-21  
**Prerequisites**: Completed features 001-006, Supabase project configured

## Setup Overview

This quickstart guides you through setting up multiplayer game rooms with Supabase Realtime in approximately 30 minutes.

**What you'll build**:
- Game room creation with shareable URLs
- Real-time playfield synchronization across players
- Private hand management with Row-Level Security
- Player presence tracking (online/offline indicators)
- Automatic reconnection after network interruptions

**Tech stack**:
- Next.js 16+ (App Router)
- React 19+
- TypeScript 5+ (strict mode)
- Supabase Realtime (Postgres Changes, Broadcast, Presence)
- Tailwind CSS 4+

---

## Step 1: Database Migration (5 min)

Apply the multiplayer schema migration to add `players` table and extend `game_sessions`.

### 1.1 Create Migration File

```bash
# From project root
cd supabase/migrations
```

Create file `002_create_multiplayer_tables.sql` with the following content:

```sql
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

-- Step 3: Create triggers
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

CREATE OR REPLACE FUNCTION update_game_player_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE game_sessions SET player_count = player_count + 1 WHERE id = NEW.game_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE game_sessions SET player_count = player_count - 1 WHERE id = OLD.game_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_update_game_count
  AFTER INSERT OR DELETE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_game_player_count();

-- Step 4: Enable RLS on players table
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

-- Step 5: Enable RLS on game_sessions (if not already enabled)
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
```

### 1.2 Apply Migration

**Option A: Supabase CLI** (recommended)
```bash
npx supabase db push
```

**Option B: Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Paste migration SQL
3. Click "Run"

### 1.3 Verify Tables

Run this query in SQL Editor to confirm:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('players', 'game_sessions');
```

Expected output: 2 rows (`players`, `game_sessions`)

---

## Step 2: TypeScript Types (5 min)

Update type definitions to support multiplayer entities.

### 2.1 Extend Database Types

Edit `app/lib/types/database.ts`:

```typescript
// Add to existing file
export interface Player {
  id: string;
  game_id: string;
  player_id: string;
  display_name: string;
  is_creator: boolean;
  hand_state: Card[];
  is_online: boolean;
  last_seen: string;
  joined_at: string;
  updated_at: string;
}

export interface GameSession {
  id: string;
  playfield_state: PlayfieldCard[];
  max_players: number;
  is_closed: boolean;
  creator_player_id: string | null;
  player_count: number;
  created_at: string;
  updated_at: string;
}
```

### 2.2 Create Realtime Types

Create new file `app/lib/types/multiplayer.ts`:

```typescript
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceState {
  player_id: string;
  display_name: string;
  online_at: string;
}

export type ConnectionStatus = 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'disconnected';

export interface GameRoomState {
  session: GameSession;
  currentPlayer: Player;
  otherPlayers: Player[];
  connectionStatus: ConnectionStatus;
}
```

---

## Step 3: Player Session Management (5 min)

Create utilities for managing player identity via sessionStorage.

### 3.1 Create Session Utility

Create `app/lib/utils/player-session.ts`:

```typescript
/**
 * Get or create player ID for the current browser session.
 * Player ID is stored in sessionStorage and expires when tab closes.
 */
export function getOrCreatePlayerId(gameId: string): string {
  const sessionKey = `player_id:${gameId}`;
  let playerId = sessionStorage.getItem(sessionKey);
  
  if (!playerId) {
    playerId = crypto.randomUUID();
    sessionStorage.setItem(sessionKey, playerId);
  }
  
  return playerId;
}

/**
 * Clear player session (e.g., when leaving game).
 */
export function clearPlayerSession(gameId: string): void {
  sessionStorage.removeItem(`player_id:${gameId}`);
}

/**
 * Get display name for player (stored separately).
 */
export function getDisplayName(gameId: string): string {
  return sessionStorage.getItem(`display_name:${gameId}`) || 'Player';
}

/**
 * Set display name for player.
 */
export function setDisplayName(gameId: string, name: string): void {
  sessionStorage.setItem(`display_name:${gameId}`, name);
}
```

---

## Step 4: Realtime Hook (10 min)

Create a React hook to manage Realtime subscriptions for a game room.

### 4.1 Create Realtime Hook

Create `app/lib/hooks/useRealtimeGameRoom.ts`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { GameSession, Player } from '@/lib/types/database';

export function useRealtimeGameRoom(gameId: string, playerId: string) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [playfield, setPlayfield] = useState<GameSession['playfield_state']>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    
    // Create Realtime channel for this game
    const gameChannel = supabase.channel(`game:${gameId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: playerId },
      },
    });

    // Subscribe to playfield updates
    gameChannel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${gameId}`,
      }, (payload) => {
        const updated = payload.new as GameSession;
        setPlayfield(updated.playfield_state);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = gameChannel.presenceState();
        const playerIds = Object.keys(state);
        setOnlinePlayers(playerIds);
      })
      .subscribe();

    setChannel(gameChannel);

    return () => {
      supabase.removeChannel(gameChannel);
    };
  }, [gameId, playerId]);

  return { channel, playfield, onlinePlayers };
}
```

---

## Step 5: Game Room Page (5 min)

Create the game room page component with join logic.

### 5.1 Create Dynamic Route

Create `app/game/[id]/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getOrCreatePlayerId } from '@/lib/utils/player-session';
import { useRealtimeGameRoom } from '@/lib/hooks/useRealtimeGameRoom';
import type { GameSession, Player } from '@/lib/types/database';

export default function GameRoomPage() {
  const params = useParams();
  const gameId = params.id as string;
  const [playerId] = useState(() => getOrCreatePlayerId(gameId));
  const [session, setSession] = useState<GameSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { playfield, onlinePlayers } = useRealtimeGameRoom(gameId, playerId);

  useEffect(() => {
    async function joinGame() {
      const supabase = createClient();
      
      // Fetch game session
      const { data: gameData, error: gameError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', gameId)
        .single();
      
      if (gameError || !gameData) {
        setError('Game not found');
        return;
      }
      
      if (gameData.is_closed) {
        setError('Game is closed');
        return;
      }
      
      if (gameData.player_count >= gameData.max_players) {
        setError('Game is full');
        return;
      }
      
      setSession(gameData);
      
      // Join as player
      await supabase.from('players').insert({
        game_id: gameId,
        player_id: playerId,
        display_name: 'Player',
        is_creator: false,
      });
    }
    
    joinGame();
  }, [gameId, playerId]);

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!session) {
    return <div className="p-4">Loading game...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Game Room: {gameId}</h1>
      <p>Online players: {onlinePlayers.length}</p>
      <p>Cards on playfield: {playfield.length}</p>
    </div>
  );
}
```

---

## Step 6: Testing Locally (5 min)

Test multiplayer functionality with multiple browser tabs.

### 6.1 Start Development Server

```bash
npm run dev
```

### 6.2 Create a Game

1. Visit `http://localhost:3000/game`
2. Click "Create New Game"
3. Note the generated game ID (e.g., `abc123`)

### 6.3 Join from Another Tab

1. Open a new browser tab (or incognito window)
2. Visit `http://localhost:3000/game/abc123`
3. Both tabs should show "Online players: 2"

### 6.4 Test Playfield Sync

1. In Tab 1: Drag a card to the playfield
2. In Tab 2: Verify the card appears immediately
3. In Tab 2: Rotate the card with Q/E keys
4. In Tab 1: Verify rotation updates

### 6.5 Test Hand Privacy

1. In Tab 1: Import a deck into your hand
2. In Tab 2: Verify you cannot see Tab 1's hand cards
3. Verify Tab 2 only sees "Player has X cards"

---

## Common Issues & Solutions

### Issue: "Game not found" error

**Cause**: Game ID doesn't exist in database  
**Solution**: Create a new game first, or check game_sessions table in Supabase Dashboard

### Issue: RLS policies block queries

**Cause**: `app.player_id` session variable not set  
**Solution**: Ensure Supabase client sets session config:
```typescript
await supabase.rpc('set_config', {
  name: 'app.player_id',
  value: playerId,
  is_local: false,
});
```

### Issue: Realtime updates not received

**Cause**: Channel not subscribed properly  
**Solution**: 
1. Check Supabase Dashboard → Realtime Inspector
2. Verify channel status is "connected"
3. Check browser console for Realtime errors
4. Ensure Realtime is enabled in Supabase project settings

### Issue: Hand size exceeds 20 cards

**Cause**: No validation on deck import  
**Solution**: Add client-side validation:
```typescript
if (hand.length + newCards.length > 20) {
  alert('Hand size cannot exceed 20 cards');
  return;
}
```

---

## Next Steps

After completing this quickstart:

1. **Implement Game Creation UI** (feature 007 task 1)
   - Add "Create Game" button on main page
   - Redirect to `/game/{id}` after creation

2. **Add Player Display Names** (feature 007 task 2)
   - Prompt for custom name on join
   - Show names in player list

3. **Build Player List Component** (feature 007 task 3)
   - Show all players with online/offline indicators
   - Display card counts for other players

4. **Add Connection Status Indicator** (feature 007 task 4)
   - Show "Connected", "Reconnecting", "Disconnected" states
   - Auto-reconnect on network recovery

5. **Implement Game Close Logic** (feature 007 task 5)
   - Add "Close Game" button for creator
   - Notify all players when game closes

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│  Browser Tab 1 (Player A)                                   │
│  ┌────────────────────────┐                                 │
│  │ React Component        │                                 │
│  │ useRealtimeGameRoom()  │                                 │
│  └───────────┬────────────┘                                 │
│              │ WebSocket                                     │
└──────────────┼───────────────────────────────────────────────┘
               │
         ┌─────▼──────┐
         │ Supabase   │
         │ Realtime   │◄───── Postgres Changes
         │ Server     │◄───── Broadcast Events
         │            │◄───── Presence Tracking
         └─────┬──────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│  Browser Tab 2 (Player B)                                   │
│  ┌────────────────────────┐                                 │
│  │ React Component        │                                 │
│  │ useRealtimeGameRoom()  │                                 │
│  └────────────────────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow**:
1. Player A moves a card → UPDATE `game_sessions.playfield_state`
2. Postgres triggers Realtime broadcast → `postgres_changes` event
3. Player B's subscription receives event → UI updates

**Privacy Enforcement**:
- Player A's hand: RLS policy allows SELECT on own `players` row
- Player B cannot SELECT Player A's `hand_state` column
- Both see `playfield_state` (no RLS on game_sessions SELECT)

---

## Performance Benchmarks

**Target Metrics** (per success criteria):
- ✅ Game room creation: < 10 seconds
- ✅ Playfield sync latency: < 1 second
- ✅ Initial state load: < 2 seconds (3G)
- ✅ Lighthouse score: 90+ (production)
- ✅ Bundle size impact: < 50KB (Realtime client)

**Free Tier Capacity**:
- ~416 game sessions/month (30 min each, 4 players)
- 200 concurrent connections
- 500MB database storage

---

## Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Row-Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Presence Tracking Tutorial](https://supabase.com/docs/guides/realtime/presence)
- [Feature Spec](./spec.md)
- [Data Model](./data-model.md)
- [Type Contracts](./contracts/multiplayer-types.ts)
