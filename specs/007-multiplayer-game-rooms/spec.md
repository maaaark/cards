# Feature Specification: Multiplayer Game Rooms

**Feature Branch**: `007-multiplayer-game-rooms`  
**Created**: 2025-01-21  
**Status**: Draft  
**Input**: User description: "add multiplayer to this project. So if i create a new game, anyone with the link (like /game/ID_OF_THE_GAME) can join. All in the room can make changes on the playboard like rotating the cards and so on. But every player will have their own hand cards."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Share Game Room (Priority: P1)

A user wants to start a multiplayer card game and invite friends to join by sharing a URL.

**Why this priority**: This is the core entry point for multiplayer functionality. Without the ability to create and join games, no other multiplayer features are possible. This delivers immediate value by enabling basic game room creation and access.

**Independent Test**: Can be fully tested by creating a new game, copying the generated URL (e.g., `/game/abc123`), opening it in another browser/tab, and verifying both can access the same game room.

**Acceptance Scenarios**:

1. **Given** a user is on the game page, **When** they click "Create New Game", **Then** a new game room is created with a unique ID and they are redirected to `/game/{game_id}`
2. **Given** a user has a game URL (e.g., `/game/abc123`), **When** they visit that URL, **Then** they join the existing game room and see the current game state
3. **Given** a user creates a game room, **When** they share the URL with another user, **Then** the second user can join the same game room and both see each other in the player list

---

### User Story 2 - Real-Time Playfield Synchronization (Priority: P1)

All players in a game room can see and interact with shared cards on the playfield in real-time, including positions, rotations, and visibility changes.

**Why this priority**: Real-time synchronization is the fundamental value proposition of multiplayer. Without this, the game would just be multiple isolated experiences. This must be built early to validate the technical approach.

**Independent Test**: Can be tested independently by having two players join a game, one player moves/rotates a card on the playfield, and verifying the other player sees the change immediately (within 1 second).

**Acceptance Scenarios**:

1. **Given** two players are in the same game room, **When** Player A moves a card on the playfield, **Then** Player B sees the card move to the new position within 1 second
2. **Given** two players are in the same game room, **When** Player A rotates a card using Q/E keys, **Then** Player B sees the card rotation update within 1 second
3. **Given** multiple players are in the same game room, **When** Player A drags a card from their hand to the playfield, **Then** all other players see the card appear on the playfield (but cannot see Player A's remaining hand cards)

---

### User Story 3 - Private Hand Management (Priority: P1)

Each player has a private hand of cards visible only to them, while the shared playfield is visible to all players.

**Why this priority**: Private hands are essential for any meaningful card game mechanics. Without privacy, the game loses strategic value. This must be implemented as part of the MVP to ensure proper data isolation patterns.

**Independent Test**: Can be tested by having two players join a game, each imports a deck to their hand, and verifying neither player can see the other's hand cards (but both can see shared playfield cards).

**Acceptance Scenarios**:

1. **Given** a player has imported cards into their hand, **When** another player joins the game, **Then** the second player cannot see the first player's hand cards (only sees card count)
2. **Given** Player A has 5 cards in hand and Player B has 3 cards, **When** viewing the game, **Then** Player A sees their 5 cards fully visible and Player B's count as "3 cards", and vice versa for Player B
3. **Given** a player drags a card from their private hand to the playfield, **When** the card lands on the playfield, **Then** it becomes visible to all players in the room
4. **Given** a player attempts to import more than 20 cards, **When** they try to add to their hand, **Then** the system prevents exceeding the 20-card limit and shows an error message

---

### User Story 4 - Game Room Lifecycle Management (Priority: P2)

Game creators can manage their game rooms, including closing games when finished. Games handle player joins and limits gracefully.

**Why this priority**: While not critical for initial testing, lifecycle management prevents abandoned games from consuming resources and provides clarity on game ownership. This is important for production readiness but can be added after core multiplayer works.

**Independent Test**: Can be tested by creating a game, joining with multiple players, having the creator close the game, and verifying all players are notified and can no longer interact with the game.

**Acceptance Scenarios**:

1. **Given** a user creates a game room, **When** they view the game, **Then** they see a "Close Game" button (other players do not see this button)
2. **Given** a game creator clicks "Close Game", **When** they confirm the action, **Then** the game is marked as closed and all players are notified
3. **Given** a user visits a closed game URL, **When** the page loads, **Then** they see a message indicating the game is closed and cannot join
4. **Given** a game room has 4 players (max limit), **When** a 5th player attempts to join, **Then** they see an error message indicating the game is full
5. **Given** a game creator closes the game, **When** they confirm, **Then** all Realtime connections are cleaned up and no further state changes are broadcast

---

### User Story 5 - Player Reconnection (Priority: P2)

Players who disconnect or refresh their browser can rejoin the same game room without losing their place or hand cards.

**Why this priority**: Reconnection improves user experience by making the game more resilient to network issues or accidental refreshes. This is important for usability but not essential for initial development and testing.

**Independent Test**: Can be tested by joining a game, refreshing the browser, and verifying the player automatically rejoins with the same player ID, display name, and hand cards intact.

**Acceptance Scenarios**:

1. **Given** a player is in a game room, **When** they refresh their browser, **Then** they automatically rejoin the same game with their previous player ID and hand state preserved
2. **Given** a player closes their browser and returns within 24 hours, **When** they visit the same game URL, **Then** they rejoin as the same player (using session storage or local storage)
3. **Given** a player's connection drops temporarily, **When** the connection is restored, **Then** they automatically reconnect to the Realtime channel and receive the latest game state
4. **Given** a player has been offline for more than 24 hours, **When** they return to the game URL, **Then** they are assigned a new player ID (old session expired)

---

### User Story 6 - Player Presence Indicators (Priority: P3)

Players can see who else is currently active in the game room with real-time online/offline status indicators.

**Why this priority**: Presence indicators enhance social experience but are not critical for core gameplay. This is a polish feature that can be added after core multiplayer functionality is stable.

**Independent Test**: Can be tested by having two players join, one player closing their browser, and verifying the other player sees the first player's status change to "offline" within a few seconds.

**Acceptance Scenarios**:

1. **Given** multiple players are in a game room, **When** viewing the player list, **Then** each player sees online/offline status indicators for all other players
2. **Given** Player A is online in a game room, **When** Player B joins, **Then** Player A sees Player B's status change to "online" immediately
3. **Given** Player A closes their browser, **When** they disconnect, **Then** all other players see Player A's status change to "offline" within 5 seconds
4. **Given** a player is viewing the game, **When** another player goes offline, **Then** their card count remains visible but their status indicator shows "offline"

---

### Edge Cases

- **What happens when a player joins mid-game?** They see the current playfield state and other players' card counts, but start with an empty hand (must import their own deck).
- **What happens when the game creator leaves without closing the game?** The game remains open and accessible to other players; creator can rejoin and close later.
- **What happens when two players try to interact with the same card simultaneously?** Last write wins (handled by Supabase Realtime's conflict resolution); no locking mechanism in MVP.
- **What happens when a player's hand reaches 20 cards?** System prevents importing additional cards and shows an error message; player must move cards to playfield or discard to free space.
- **What happens when Realtime connection drops?** Client automatically attempts to reconnect; user sees connection status indicator; game state is restored on reconnection.
- **What happens when a player visits an invalid game ID?** They see an error message indicating the game does not exist with option to create a new game.
- **What happens to game data after 24 hours?** Games remain persistent indefinitely; only player sessions expire after 24 hours of inactivity (requiring new player ID on rejoin).
- **What happens when free tier Realtime message limit is exceeded?** Connections may be throttled; consider implementing message batching or debouncing to stay within limits.

## Requirements *(mandatory)*

### Functional Requirements

**Game Room Creation & Access**
- **FR-001**: System MUST generate unique, shareable game room IDs when a user creates a new game
- **FR-002**: System MUST support URL-based game access via `/game/{game_id}` route
- **FR-003**: System MUST allow multiple players to join the same game room using the shared URL
- **FR-004**: System MUST enforce a maximum of 4 concurrent players per game room
- **FR-005**: System MUST prevent players from joining full game rooms (show error message)
- **FR-006**: System MUST prevent players from joining closed game rooms (show error message)

**Player Identity & Management**
- **FR-007**: System MUST auto-assign unique player IDs to users joining a game room
- **FR-008**: System MUST support optional custom display names for players (default to "Player 1", "Player 2", etc.)
- **FR-009**: System MUST persist player identity across browser refreshes for the same game (using session storage)
- **FR-010**: System MUST expire player sessions after 24 hours of inactivity
- **FR-011**: System MUST track which player created the game room (creator role)

**Real-Time Playfield Synchronization**
- **FR-012**: System MUST broadcast playfield card position changes to all players in real-time (within 1 second)
- **FR-013**: System MUST broadcast playfield card rotation changes to all players in real-time (within 1 second)
- **FR-014**: System MUST synchronize card additions to playfield (from any player's hand) to all players
- **FR-015**: System MUST handle concurrent card interactions using last-write-wins conflict resolution
- **FR-016**: System MUST persist playfield state to Supabase PostgreSQL for game session recovery

**Private Hand Management**
- **FR-017**: System MUST maintain separate, private hand state for each player
- **FR-018**: System MUST enforce Row-Level Security (RLS) to prevent players from accessing other players' hand data
- **FR-019**: System MUST show other players' hand card counts without revealing card contents
- **FR-020**: System MUST enforce maximum 20 cards per player's hand
- **FR-021**: System MUST allow players to import decks into their private hand (JSON, TTS formats from feature 002)
- **FR-022**: System MUST allow players to drag cards from their hand to the shared playfield

**Game Lifecycle**
- **FR-023**: System MUST provide a "Close Game" action available only to the game creator
- **FR-024**: System MUST mark game rooms as closed when creator closes the game
- **FR-025**: System MUST notify all players when a game is closed
- **FR-026**: System MUST clean up Realtime connections when a game is closed
- **FR-027**: System MUST persist game rooms indefinitely (no automatic deletion in MVP)

**Player Presence**
- **FR-028**: System MUST track real-time online/offline status for all players in a game room
- **FR-029**: System MUST update presence indicators within 5 seconds of player connection/disconnection
- **FR-030**: System MUST maintain player list with display names and online status

**Reconnection & Resilience**
- **FR-031**: System MUST automatically reconnect Realtime subscriptions when connection drops
- **FR-032**: System MUST restore full game state (playfield + player's hand) on reconnection
- **FR-033**: System MUST show connection status indicator to users (connected/reconnecting/disconnected)

### Key Entities

- **GameRoom**: Represents a multiplayer game session with unique ID, creator ID, max player limit (4), current player list, playfield state, created timestamp, closed status
- **Player**: Represents a player in a game room with unique player ID, game room ID, optional display name, private hand state (array of cards), online status, last seen timestamp, is_creator flag
- **PlayfieldCard**: Represents a card on the shared playfield with card data (id, name, image_url from feature 001), position (x, y), rotation angle, visibility status
- **RealtimeChannel**: Represents a Supabase Realtime channel for game room communication with game_id as channel name, subscription for playfield state changes, broadcast for ephemeral events, presence for online players

## Success Criteria *(mandatory)*

### Measurable Outcomes

**User Experience**
- **SC-001**: Two players can create and join a game room within 10 seconds using a shared URL
- **SC-002**: Playfield card movements are visible to all players within 1 second (real-time sync latency)
- **SC-003**: Players can drag cards from hand to playfield with visual feedback matching existing drag-drop feature (004)
- **SC-004**: Card rotations sync across all players within 1 second matching existing rotation feature (006)
- **SC-005**: Hand card privacy is enforced - no player can see another player's hand contents via UI or browser dev tools

**Performance**
- **SC-006**: Game room pages maintain Lighthouse performance score 90+ in production build
- **SC-007**: Realtime message overhead stays within Supabase free tier limits (200k messages/month) for typical usage (4 players, 30-minute game sessions)
- **SC-008**: Initial game state loads within 2 seconds on 3G connection
- **SC-009**: Client-side bundle increase is under 50KB (parsed) for Realtime functionality

**Accessibility & UX Consistency**
- **SC-010**: All multiplayer UI elements (player list, create/join buttons) use consistent Tailwind styling matching existing components
- **SC-011**: Dark mode support works for all new multiplayer UI components
- **SC-012**: Player list and game status indicators are accessible via keyboard navigation
- **SC-013**: Screen readers can announce player join/leave events and connection status changes

**Resilience**
- **SC-014**: Players can reconnect after browser refresh without losing their hand cards or game state
- **SC-015**: System handles Realtime connection drops gracefully with automatic reconnection within 5 seconds
- **SC-016**: Game rooms remain functional when 1-2 players disconnect (remaining players can continue playing)
