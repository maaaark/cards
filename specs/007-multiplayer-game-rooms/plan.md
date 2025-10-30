# Implementation Plan: Multiplayer Game Rooms

**Branch**: `007-multiplayer-game-rooms` | **Date**: 2025-01-21 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/007-multiplayer-game-rooms/spec.md`

## Summary

**Primary Requirement**: Enable multiplayer card game sessions where players can create shareable game rooms via URLs (e.g., `/game/{id}`), join existing games, and interact in real-time with a shared playfield while maintaining private hands.

**Technical Approach**:
- **Supabase Realtime** for WebSocket-based real-time synchronization (Postgres Changes subscriptions, Broadcast channels, Presence tracking)
- **Database-First Sync**: All state changes persist to PostgreSQL first, then broadcast via Realtime (guarantees consistency, ~200ms latency)
- **Row-Level Security (RLS)**: Enforce hand privacy at database level (players can only query their own `hand_state`)
- **Session-Based Identity**: Anonymous multiplayer using client-generated UUIDs stored in sessionStorage (24-hour expiry)
- **Last-Write-Wins Conflict Resolution**: Simplest approach for card game mechanics (acceptable for MVP)

## Technical Context

**Language/Version**: TypeScript 5+ with strict mode enabled  
**Primary Dependencies**: 
  - Next.js 16.0.0 (App Router, React Server/Client Components)
  - React 19.2.0 (hooks-based state management)
  - Supabase JS SDK 2.76.1 (`@supabase/supabase-js`)
  - Tailwind CSS 4+ (styling, dark mode)

**Storage**: Supabase PostgreSQL (500MB free tier)
  - `game_sessions` table (existing, extended with multiplayer columns)
  - `players` table (new, with hand_state JSONB + RLS policies)
  - Realtime subscriptions on both tables

**Testing**: 
  - Manual testing with multiple browser tabs/incognito windows
  - Constitution check via `.specify/scripts/powershell/check-constitution.ps1`
  - No automated tests (per constitution - project excludes test tasks)

**Target Platform**: Web (browsers with WebSocket support, Chrome 90+, Firefox 88+, Safari 14+)

**Project Type**: Web application (Next.js frontend + Supabase backend)

**Performance Goals**:
  - Realtime sync latency < 1 second (SC-002, SC-004)
  - Initial game state load < 2 seconds on 3G (SC-008)
  - Lighthouse performance score 90+ in production (SC-006)
  - Client bundle increase < 50KB for Realtime functionality (SC-009)
  - Stay within 200k Realtime messages/month (free tier, SC-007)

**Constraints**:
  - Maximum 4 concurrent players per game (FR-004)
  - Maximum 20 cards per player hand (FR-020)
  - 24-hour player session expiry (FR-010)
  - Anonymous users (no authentication required)
  - Free tier limits: 200 concurrent connections, 500MB database, 2GB bandwidth/month

**Scale/Scope**:
  - ~416 game sessions/month (30 min each, 4 players, within free tier message limits)
  - 6 user stories (3 P1, 2 P2, 1 P3)
  - 33 functional requirements
  - 16 success criteria
  - Estimated implementation: 3-5 days for P1 features

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The following principles from `.specify/memory/constitution.md` MUST be verified:

- ✅ **Type Safety & Code Quality**: 
  - All multiplayer types defined in `contracts/multiplayer-types.ts` with strict typing
  - Database types extended in `app/lib/types/database.ts`
  - Realtime types use Supabase SDK's built-in types (`RealtimeChannel`, etc.)
  - No `any` types permitted (session variables validated with UUIDs)

- ✅ **Component-First Architecture**: 
  - New components: `GameRoomLobby`, `PlayerList`, `ConnectionStatus`, `JoinGameForm`
  - Hooks: `useRealtimeGameRoom`, `usePlayerSession`, `usePresence`
  - Utilities: `player-session.ts` (sessionStorage management)
  - Existing components reused: `Playfield`, `Hand`, `Card` (from features 001-006)

- ✅ **UX Consistency**: 
  - Tailwind classes for all UI elements (player list, status indicators, error messages)
  - Dark mode support for multiplayer components (using Tailwind's `dark:` variants)
  - Responsive design: player list collapses on mobile, playfield scales appropriately
  - Accessibility: keyboard navigation for join form, screen reader announcements for player events, ARIA labels for connection status

- ✅ **Performance Requirements**: 
  - Realtime client loaded via dynamic import (code splitting, SC-009)
  - Debounce card drag events to 100ms (reduce message frequency, SC-007)
  - Use cached `player_count` field instead of COUNT(*) queries
  - Presence heartbeats at 30s intervals (optimize message usage)
  - Lighthouse score verified in production build (SC-006)

**Violations**: None

## Project Structure

### Documentation (this feature)

```text
specs/007-multiplayer-game-rooms/
├── plan.md              # This file (implementation plan)
├── research.md          # Supabase Realtime analysis, architectural decisions
├── data-model.md        # Database schema, RLS policies, migrations
├── quickstart.md        # 30-min setup guide with testing steps
├── spec.md              # Feature specification (6 user stories, 33 FRs, 16 success criteria)
└── contracts/
    └── multiplayer-types.ts  # TypeScript type definitions
```

### Source Code (repository root)

```text
app/
├── game/
│   ├── page.tsx                         # Main game page (create game UI)
│   └── [id]/
│       └── page.tsx                     # NEW: Dynamic game room page (join logic)
├── components/
│   ├── game/
│   │   ├── Card.tsx                     # Existing (reused)
│   │   ├── Deck.tsx                     # Existing (reused)
│   │   ├── Hand.tsx                     # Existing (reused)
│   │   ├── Playfield.tsx                # Existing (reused)
│   │   ├── GameRoomLobby.tsx            # NEW: Game creation + join UI
│   │   ├── PlayerList.tsx               # NEW: Display all players with status
│   │   ├── ConnectionStatus.tsx         # NEW: Realtime connection indicator
│   │   └── JoinGameForm.tsx             # NEW: Display name input on join
│   └── ui/
│       ├── Button.tsx                   # Existing (reused)
│       └── ThemeToggle.tsx              # Existing (reused)
├── lib/
│   ├── hooks/
│   │   ├── useGameState.ts              # MODIFIED: Add Realtime subscriptions
│   │   ├── useSupabase.ts               # MODIFIED: Add player CRUD + RLS setup
│   │   ├── useRealtimeGameRoom.ts       # NEW: Realtime channel management
│   │   ├── usePlayerSession.ts          # NEW: SessionStorage player ID management
│   │   └── usePresence.ts               # NEW: Presence tracking logic
│   ├── utils/
│   │   ├── player-session.ts            # NEW: Player ID + display name helpers
│   │   └── game-room.ts                 # NEW: Game creation, join validation
│   ├── types/
│   │   ├── database.ts                  # MODIFIED: Add Player, extend GameSession
│   │   └── multiplayer.ts               # NEW: PresenceState, ConnectionStatus, GameRoomState
│   └── supabase/
│       └── client.ts                    # Existing (reused)
└── globals.css                          # Existing (may add multiplayer-specific styles)

supabase/
└── migrations/
    ├── 001_create_game_sessions.sql     # Existing (from feature 001)
    └── 002_create_multiplayer_tables.sql # NEW: players table + RLS policies + triggers
```

**Structure Decision**: Web application structure (Next.js App Router). All multiplayer code lives in `app/` directory following Next.js conventions. New components colocated with existing game components. Database migrations in `supabase/migrations/` for version control and reproducibility.

## Phase 0: Research

### Objectives
- [x] Analyze Supabase Realtime capabilities (Postgres Changes, Broadcast, Presence)
- [x] Evaluate free tier constraints (200k messages/month, 200 connections)
- [x] Design RLS policies for hand privacy
- [x] Choose synchronization strategy (Database-First vs Broadcast-First)
- [x] Define reconnection and conflict resolution patterns

### Deliverable: research.md

**Key Findings**:
1. **Supabase Realtime Architecture**: Three features available (Postgres Changes for persistent state, Broadcast for ephemeral events, Presence for online tracking). Latency ~100-300ms for Postgres Changes, ~50-100ms for Broadcast.

2. **Free Tier Budget**: ~416 game sessions/month (4 players, 30 min each) with typical message load. Debouncing required for drag operations to stay within limits.

3. **RLS Implementation**: Session-based approach using `current_setting('app.player_id')` for anonymous multiplayer. Separate policies for own vs others' data.

4. **Architectural Decisions**:
   - **Decision 1**: Anonymous play (no auth required) for lower barrier to entry
   - **Decision 2**: Separate `players` table (better normalization, easier RLS)
   - **Decision 3**: SessionStorage for reconnection (24-hour server expiry)
   - **Decision 4**: Debounce drag operations to 100ms (reduce messages by ~90%)

5. **Risks**:
   - Free tier message limit exceeded (mitigation: debouncing + usage monitoring)
   - State divergence from race conditions (mitigation: Database-First sync, LWW)
   - Reconnection complexity (mitigation: auto-reconnect with exponential backoff)
   - RLS misconfiguration (mitigation: thorough testing, code review)

**Full Research**: [research.md](./research.md)

## Phase 1: Design

### Objectives
- [x] Define database schema (`players` table, extend `game_sessions`)
- [x] Design RLS policies for hand privacy
- [x] Create TypeScript type contracts (Player, GameSession, PresenceState, etc.)
- [x] Document data flow diagrams (join, playfield update, hand update)
- [x] Write migration script with triggers and indexes

### Deliverables

#### 1. data-model.md

**Database Schema**:
- **New Table**: `players` (id, game_id, player_id, display_name, is_creator, hand_state JSONB, is_online, last_seen, joined_at, updated_at)
- **Modified Table**: `game_sessions` (add max_players, is_closed, creator_player_id, player_count)
- **Indexes**: Fast lookups on game_id, player_id, is_online, is_closed
- **Triggers**: Auto-update `player_count` on INSERT/DELETE, update `updated_at` timestamp

**RLS Policies**:
- `players_select_own`: Players can read own full record
- `players_update_own`: Players can update own hand and presence
- `players_insert_self`: Players can insert themselves on join
- `game_sessions_select_all`: Public read access for join validation
- `game_sessions_update_playfield`: Players in game can update playfield
- `game_sessions_insert_all`: Anyone can create games
- `game_sessions_delete_by_creator`: Only creator can close game

**Data Flow Diagrams**:
1. Player Join Flow (10 steps: check sessionStorage → validate game → INSERT player → subscribe Realtime → track Presence)
2. Playfield Update Flow (8 steps: drag card → UPDATE database → Realtime broadcast → other clients update)
3. Private Hand Update Flow (8 steps: import deck → UPDATE own player → RLS blocks others → only self receives confirmation)

**Migration Script**: Complete SQL for `002_create_multiplayer_tables.sql` (83 lines)

**Full Data Model**: [data-model.md](./data-model.md)

#### 2. contracts/multiplayer-types.ts

**Type Definitions**:
- `Player`: Database entity with hand_state JSONB
- `GameSession`: Extended with multiplayer metadata
- `PlayfieldCard`: Card with position and rotation
- `Card`: Base card entity (in hands/decks)
- `GameRoomChannel`: Realtime channel wrapper
- `PresenceState`: Online player tracking
- `PlayfieldUpdatePayload`: Realtime event payload
- `PlayerUpdatePayload`: Realtime event payload
- `GameRoomState`: Client-side aggregated state
- `ConnectionStatus`: 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
- `PlayerDisplayData`: Public player info (excludes hand_state)
- `GameRoomAction`: State reducer actions (20 action types)
- `MultiplayerError`: Typed error union (8 error types)
- `MULTIPLAYER_CONSTRAINTS`: Validation constants (max hand size, player limit, timeouts)

**Full Contracts**: [contracts/multiplayer-types.ts](./contracts/multiplayer-types.ts)

#### 3. quickstart.md

**Setup Steps**:
1. Database Migration (5 min) - Apply SQL, verify tables
2. TypeScript Types (5 min) - Extend database.ts, create multiplayer.ts
3. Player Session Management (5 min) - Create player-session.ts utility
4. Realtime Hook (10 min) - Create useRealtimeGameRoom.ts
5. Game Room Page (5 min) - Create app/game/[id]/page.tsx
6. Testing Locally (5 min) - Multi-tab testing guide

**Testing Scenarios**:
- Create game + join from another tab
- Verify playfield sync (drag card in Tab 1, see in Tab 2)
- Test hand privacy (import deck in Tab 1, verify Tab 2 can't see cards)

**Common Issues**: Game not found, RLS blocks queries, Realtime not connecting, hand size exceeded

**Architecture Diagram**: Browser tabs ↔ Supabase Realtime ↔ Postgres (with RLS enforcement)

**Full Quickstart**: [quickstart.md](./quickstart.md)

## Phase 2: Task Breakdown

**Generated by**: `/speckit.tasks` command (next step after this plan is approved)

**Expected Output**: `tasks.md` with 15-25 actionable implementation tasks, grouped by:
1. **Database Setup** (1-2 tasks): Apply migration, verify RLS policies
2. **Type Definitions** (2-3 tasks): Extend database types, create multiplayer types
3. **Core Utilities** (3-4 tasks): Player session management, game room helpers
4. **Realtime Hooks** (4-5 tasks): useRealtimeGameRoom, usePlayerSession, usePresence
5. **UI Components** (5-7 tasks): GameRoomLobby, PlayerList, ConnectionStatus, JoinGameForm
6. **Integration** (3-4 tasks): Wire up hooks to components, test flows
7. **Polish** (2-3 tasks): Error handling, loading states, accessibility

**Not Included** (per constitution): Test tasks, CI/CD tasks, deployment tasks

## Implementation Sequence

### Milestone 1: Core Infrastructure (P1 - Days 1-2)

**Goal**: Database + player sessions working locally

1. Apply database migration (`002_create_multiplayer_tables.sql`)
2. Verify RLS policies with manual SQL queries
3. Extend `app/lib/types/database.ts` with Player + GameSession
4. Create `app/lib/utils/player-session.ts` (sessionStorage helpers)
5. Create `app/lib/utils/game-room.ts` (create game, join validation)
6. Test player ID persistence across refreshes

**Validation**: Can create game in Supabase Dashboard, manually INSERT player row, verify RLS blocks other player's hand_state

### Milestone 2: Realtime Sync (P1 - Days 2-3)

**Goal**: Real-time playfield updates working between two tabs

1. Create `app/lib/hooks/useRealtimeGameRoom.ts` (channel setup + subscriptions)
2. Create `app/lib/hooks/usePresence.ts` (track online players)
3. Modify `app/lib/hooks/useGameState.ts` to use Realtime subscriptions
4. Modify `app/lib/hooks/useSupabase.ts` to set RLS session config
5. Test Realtime channel connection with console logs

**Validation**: Open two tabs, move card in Tab 1, see update in Tab 2 within 1 second

### Milestone 3: UI Components (P1 - Day 3)

**Goal**: Join flow + player list fully functional

1. Create `app/game/[id]/page.tsx` (dynamic route with join logic)
2. Create `app/components/game/PlayerList.tsx` (display all players + card counts)
3. Create `app/components/game/ConnectionStatus.tsx` (Realtime status indicator)
4. Create `app/components/game/JoinGameForm.tsx` (display name input)
5. Wire up components to Realtime hooks

**Validation**: Multi-tab testing - create game, join from incognito window, see both players in list

### Milestone 4: Lifecycle Management (P2 - Day 4)

**Goal**: Creator can close games, reconnection works

1. Add "Close Game" button (creator-only, visible via `is_creator` flag)
2. Implement game close logic (UPDATE game_sessions.is_closed, notify players)
3. Add reconnection logic to useRealtimeGameRoom (exponential backoff)
4. Add session recovery on refresh (detect existing player_id, restore state)
5. Handle edge cases (full game, closed game, invalid game ID)

**Validation**: Close game as creator, verify other players notified; refresh browser, verify auto-rejoin

### Milestone 5: Polish (P2-P3 - Day 5)

**Goal**: Production-ready UX

1. Add presence indicators (online/offline dots in player list)
2. Add error messages (game full, closed, not found)
3. Add loading states (joining game, connecting to Realtime)
4. Verify accessibility (keyboard nav, ARIA labels, screen reader)
5. Verify dark mode styling for all multiplayer components
6. Run Lighthouse audit (target 90+ score)

**Validation**: Pass all 16 success criteria from spec.md

## Complexity Tracking

> **No violations** - all constitution principles followed

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | N/A        | N/A                                 |

---

## Next Steps

1. **Review this plan** - Verify all user stories from spec.md are covered
2. **Run `/speckit.tasks`** - Generate detailed task breakdown in tasks.md
3. **Start Milestone 1** - Apply database migration and test locally
4. **Iterative development** - Complete milestones in sequence, testing at each step
5. **Final validation** - Verify all 16 success criteria before merging to main

**Estimated Timeline**: 3-5 days (P1 features), additional 1-2 days for P2-P3 polish
