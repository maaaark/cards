# Research: Multiplayer Game Rooms Implementation

**Feature**: 007-multiplayer-game-rooms  
**Created**: 2025-01-21  
**Status**: Draft

## Technology Stack Analysis

### Supabase Realtime Overview

Supabase Realtime provides three key features for multiplayer applications:

1. **Postgres Changes (Database Subscriptions)**
   - Listen to INSERT, UPDATE, DELETE events on database tables
   - Real-time notifications when game state changes
   - Best for: Persistent state synchronization (playfield updates, player metadata)
   - Latency: ~100-300ms
   - Use case: Syncing playfield card positions/rotations across clients

2. **Broadcast Channels**
   - Low-latency ephemeral messaging between clients
   - Messages are not persisted to database
   - Best for: Transient events (cursor positions, typing indicators, temporary animations)
   - Latency: ~50-100ms
   - Use case: Real-time card drag previews (if needed), instant feedback events

3. **Presence Tracking**
   - Track which users are currently online in a channel
   - Automatic heartbeat and timeout detection
   - Best for: Player online/offline status, active user counts
   - Latency: ~100ms for join/leave, 30s timeout detection
   - Use case: Player list with online indicators

### Free Tier Constraints

**Supabase Free Tier Limits** (as of 2025):
- **Realtime Messages**: 200,000 messages/month
- **Concurrent Connections**: 200 max
- **Database**: 500MB storage
- **Bandwidth**: 2GB egress/month

**Message Budget Calculation**:
- Typical game session: 4 players, 30 minutes
- Card interactions: ~60 moves/rotations per session (1 per 30 seconds avg)
- Presence heartbeats: 4 players × 2 per minute × 30 min = 240 messages
- State updates: 60 × 4 players receiving = 240 messages
- **Total per session**: ~480 messages
- **Monthly capacity**: 200k / 480 = ~416 game sessions/month

**Optimization Strategies**:
- Debounce rapid card movements (e.g., only sync position every 100ms during drag)
- Batch multiple state changes into single messages when possible
- Use Broadcast for ephemeral events (don't persist drag previews)
- Implement connection pooling and cleanup on game close

### Row-Level Security (RLS) for Private Hands

Supabase PostgreSQL supports RLS policies to enforce data access control at the database level.

**Implementation Pattern**:
```sql
-- Enable RLS on players table
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Policy: Players can only read their own hand_state
CREATE POLICY "Players can read own hand"
  ON players FOR SELECT
  USING (
    auth.uid() = player_id OR 
    (SELECT is_authenticated FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Players can only update their own hand_state
CREATE POLICY "Players can update own hand"
  ON players FOR UPDATE
  USING (auth.uid() = player_id);
```

**Session-Based Alternative** (for anonymous multiplayer without auth):
- Store `player_id` in session storage on client
- Server validates requests using session tokens
- RLS policies check `session_player_id` claim in JWT
- More complex than authenticated users, but supports anonymous play

**Recommendation**: Start with session-based approach for MVP (no user auth required), migrate to Supabase Auth later if needed.

### Real-Time Synchronization Architecture

**Option 1: Database-First Sync** (Postgres Changes)
- Client updates database via Supabase client
- Database triggers Realtime broadcast to all subscribers
- All clients receive update and refresh state
- **Pros**: Single source of truth (database), consistent state, works with reconnection
- **Cons**: Higher latency (~200ms round-trip), more database writes

**Option 2: Broadcast-First Sync** (Broadcast + Background Persist)
- Client broadcasts state change to channel immediately
- All clients update local state instantly
- Background job persists to database asynchronously
- **Pros**: Ultra-low latency (~50ms), optimistic UI updates
- **Cons**: Risk of state divergence, complex conflict resolution

**Recommendation**: Use **Option 1 (Database-First)** for MVP:
- Simplest implementation
- Guaranteed consistency
- Easier debugging and state recovery
- Latency (~200ms) is acceptable for card game interactions
- Migrate to hybrid approach later if latency becomes issue

### Conflict Resolution

**Scenario**: Two players move the same card simultaneously.

**Strategies**:
1. **Last-Write-Wins** (LWW)
   - Database timestamp determines winning update
   - Simplest to implement
   - Acceptable for card game (no critical business logic)
   - **Recommended for MVP**

2. **Optimistic Locking** (Version Numbers)
   - Each state change increments version number
   - Conflicting update rejected if version mismatch
   - Requires retry logic and user notification
   - More complex, better for collaborative editing

3. **Operational Transformation (OT)**
   - Complex algorithm to merge concurrent operations
   - Overkill for card game mechanics
   - Not recommended

**Implementation**: Use Postgres `updated_at` timestamp with LWW. Supabase Realtime handles this automatically.

## Implementation Patterns

### Supabase Realtime Client Setup

```typescript
// app/lib/hooks/useRealtimeGameRoom.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeGameRoom(gameId: string) {
  const supabase = createClient();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create channel for this game room
    const gameChannel = supabase.channel(`game:${gameId}`, {
      config: {
        broadcast: { self: false }, // Don't echo own messages
        presence: { key: 'player_id' },
      },
    });

    // Subscribe to playfield state changes
    gameChannel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${gameId}`,
      }, (payload) => {
        // Update local playfield state
        console.log('Playfield updated:', payload.new);
      })
      .on('presence', { event: 'sync' }, () => {
        // Update player presence list
        const state = gameChannel.presenceState();
        console.log('Online players:', state);
      })
      .subscribe();

    setChannel(gameChannel);

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(gameChannel);
    };
  }, [gameId]);

  return { channel };
}
```

### Player Session Management

```typescript
// app/lib/utils/player-session.ts
export function getOrCreatePlayerId(gameId: string): string {
  const sessionKey = `player_id:${gameId}`;
  
  // Check for existing session
  let playerId = sessionStorage.getItem(sessionKey);
  
  if (!playerId) {
    // Generate new UUID for this player
    playerId = crypto.randomUUID();
    sessionStorage.setItem(sessionKey, playerId);
  }
  
  return playerId;
}

export function clearPlayerSession(gameId: string): void {
  sessionStorage.removeItem(`player_id:${gameId}`);
}
```

### Presence Tracking

```typescript
// Track player presence in game room
async function trackPresence(channel: RealtimeChannel, playerId: string, displayName: string) {
  await channel.track({
    player_id: playerId,
    display_name: displayName,
    online_at: new Date().toISOString(),
  });
}

// Get current online players
function getOnlinePlayers(channel: RealtimeChannel) {
  const state = channel.presenceState();
  return Object.values(state).flat();
}
```

## Architectural Decisions

### Decision 1: Anonymous vs Authenticated Multiplayer

**Context**: Should players be required to authenticate (Supabase Auth) or can they play anonymously?

**Options**:
- **A. Require Authentication**: Use Supabase Auth with email/password or OAuth
- **B. Anonymous Play**: Generate session-based player IDs without authentication

**Decision**: **B. Anonymous Play** for MVP

**Rationale**:
- Lower barrier to entry (share link and play immediately)
- Simpler implementation (no auth UI, password reset, etc.)
- Matches user request ("anyone with the link can join")
- Can migrate to authenticated users later for persistent profiles
- Session storage provides adequate reconnection for 24-hour window

### Decision 2: Database Schema Approach

**Context**: How to structure game room and player data?

**Options**:
- **A. Single Table**: Store players as JSONB array in `game_sessions` table
- **B. Separate Tables**: Create dedicated `players` table with foreign key to `game_sessions`

**Decision**: **B. Separate Tables**

**Rationale**:
- Better data normalization and query performance
- Easier to implement RLS policies for private hands (row-level player data)
- Simpler Realtime subscriptions (subscribe to player row changes)
- Scales better if player data grows (e.g., add stats, preferences)
- Aligns with relational database best practices

### Decision 3: Reconnection Strategy

**Context**: How should players reconnect after disconnect or refresh?

**Options**:
- **A. Session Storage Only**: Store player_id in sessionStorage, expires on tab close
- **B. Local Storage**: Persist player_id in localStorage for long-term reconnection
- **C. Cookie-Based**: Use HTTP-only cookies for secure session management

**Decision**: **A. Session Storage** for MVP, with 24-hour server-side expiration

**Rationale**:
- sessionStorage is sufficient for single-session gameplay
- Clears automatically on tab close (prevents stale sessions)
- Simpler than cookie management
- Can upgrade to localStorage later if cross-session persistence is desired
- Server expires players after 24 hours of inactivity regardless

### Decision 4: Message Optimization

**Context**: How to stay within 200k messages/month free tier limit?

**Options**:
- **A. No Optimization**: Send every state change immediately
- **B. Debounce**: Rate-limit rapid updates (e.g., only sync position every 100ms)
- **C. Batch**: Combine multiple changes into single messages

**Decision**: **B. Debounce** for drag operations, immediate for discrete actions (rotate, drop)

**Rationale**:
- Drag operations generate high-frequency events (dozens per second)
- Debouncing to 100ms reduces messages by ~90% with negligible UX impact
- Discrete actions (rotate with Q/E, drop card) are low-frequency, send immediately
- Simple to implement with standard debounce utilities
- Can add batching later if needed, but likely unnecessary

## Open Questions & Risks

### Open Questions

1. **Q: Should we implement player kick/ban functionality for game creators?**
   - **Impact**: Prevents disruptive players but adds complexity
   - **Recommendation**: Defer to future iteration (P3 priority)

2. **Q: Should games have a time-to-live (TTL) or expire after inactivity?**
   - **Impact**: Reduces database growth but may lose player data
   - **Recommendation**: No TTL for MVP, revisit based on database usage

3. **Q: Should we show real-time cursor positions for other players?**
   - **Impact**: Enhances collaboration UX but increases message count significantly
   - **Recommendation**: Defer to P3 (nice-to-have, high message cost)

### Technical Risks

**Risk 1: Free Tier Message Limit Exceeded**
- **Likelihood**: Medium (depends on user adoption)
- **Impact**: Connections throttled or blocked
- **Mitigation**: Implement message debouncing, monitor usage with Supabase dashboard, add usage warnings

**Risk 2: State Divergence from Race Conditions**
- **Likelihood**: Low (LWW handles most cases)
- **Impact**: Players see inconsistent game state temporarily
- **Mitigation**: Database-first sync ensures eventual consistency, add client-side reconciliation logic

**Risk 3: Reconnection Complexity**
- **Likelihood**: Medium (network issues, browser quirks)
- **Impact**: Players lose connection and cannot rejoin easily
- **Mitigation**: Automatic reconnection with exponential backoff, clear UI indicators, session recovery logic

**Risk 4: RLS Policy Misconfiguration**
- **Likelihood**: Low (well-documented pattern)
- **Impact**: Players could access other players' hands (critical security issue)
- **Mitigation**: Thorough testing with multiple accounts, code review of RLS policies, unit tests for database queries

## References

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Postgres Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Presence Tracking](https://supabase.com/docs/guides/realtime/presence)
- [Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Supabase Pricing & Limits](https://supabase.com/pricing)
- [Last-Write-Wins Conflict Resolution](https://en.wikipedia.org/wiki/Eventual_consistency#Conflict_resolution)
