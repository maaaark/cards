# Requirements Checklist: Multiplayer Game Rooms

**Feature**: 007-multiplayer-game-rooms  
**Branch**: `007-multiplayer-game-rooms`  
**Status**: Planning Complete, Ready for /speckit.tasks

This checklist tracks implementation progress against the functional requirements and success criteria defined in [spec.md](../spec.md).

---

## Functional Requirements (33 total)

### Game Room Creation & Access (6 requirements)

- [ ] **FR-001**: System MUST generate unique, shareable game room IDs when a user creates a new game
- [ ] **FR-002**: System MUST support URL-based game access via `/game/{game_id}` route
- [ ] **FR-003**: System MUST allow multiple players to join the same game room using the shared URL
- [ ] **FR-004**: System MUST enforce a maximum of 4 concurrent players per game room
- [ ] **FR-005**: System MUST prevent players from joining full game rooms (show error message)
- [ ] **FR-006**: System MUST prevent players from joining closed game rooms (show error message)

### Player Identity & Management (5 requirements)

- [ ] **FR-007**: System MUST auto-assign unique player IDs to users joining a game room
- [ ] **FR-008**: System MUST support optional custom display names for players (default to "Player 1", "Player 2", etc.)
- [ ] **FR-009**: System MUST persist player identity across browser refreshes for the same game (using session storage)
- [ ] **FR-010**: System MUST expire player sessions after 24 hours of inactivity
- [ ] **FR-011**: System MUST track which player created the game room (creator role)

### Real-Time Playfield Synchronization (5 requirements)

- [ ] **FR-012**: System MUST broadcast playfield card position changes to all players in real-time (within 1 second)
- [ ] **FR-013**: System MUST broadcast playfield card rotation changes to all players in real-time (within 1 second)
- [ ] **FR-014**: System MUST synchronize card additions to playfield (from any player's hand) to all players
- [ ] **FR-015**: System MUST handle concurrent card interactions using last-write-wins conflict resolution
- [ ] **FR-016**: System MUST persist playfield state to Supabase PostgreSQL for game session recovery

### Private Hand Management (6 requirements)

- [ ] **FR-017**: System MUST maintain separate, private hand state for each player
- [ ] **FR-018**: System MUST enforce Row-Level Security (RLS) to prevent players from accessing other players' hand data
- [ ] **FR-019**: System MUST show other players' hand card counts without revealing card contents
- [ ] **FR-020**: System MUST enforce maximum 20 cards per player's hand
- [ ] **FR-021**: System MUST allow players to import decks into their private hand (JSON, TTS formats from feature 002)
- [ ] **FR-022**: System MUST allow players to drag cards from their hand to the shared playfield

### Game Lifecycle (5 requirements)

- [ ] **FR-023**: System MUST provide a "Close Game" action available only to the game creator
- [ ] **FR-024**: System MUST mark game rooms as closed when creator closes the game
- [ ] **FR-025**: System MUST notify all players when a game is closed
- [ ] **FR-026**: System MUST clean up Realtime connections when a game is closed
- [ ] **FR-027**: System MUST persist game rooms indefinitely (no automatic deletion in MVP)

### Player Presence (3 requirements)

- [ ] **FR-028**: System MUST track real-time online/offline status for all players in a game room
- [ ] **FR-029**: System MUST update presence indicators within 5 seconds of player connection/disconnection
- [ ] **FR-030**: System MUST maintain player list with display names and online status

### Reconnection & Resilience (3 requirements)

- [ ] **FR-031**: System MUST automatically reconnect Realtime subscriptions when connection drops
- [ ] **FR-032**: System MUST restore full game state (playfield + player's hand) on reconnection
- [ ] **FR-033**: System MUST show connection status indicator to users (connected/reconnecting/disconnected)

---

## Success Criteria (16 total)

### User Experience (5 criteria)

- [ ] **SC-001**: Two players can create and join a game room within 10 seconds using a shared URL
- [ ] **SC-002**: Playfield card movements are visible to all players within 1 second (real-time sync latency)
- [ ] **SC-003**: Players can drag cards from hand to playfield with visual feedback matching existing drag-drop feature (004)
- [ ] **SC-004**: Card rotations sync across all players within 1 second matching existing rotation feature (006)
- [ ] **SC-005**: Hand card privacy is enforced - no player can see another player's hand contents via UI or browser dev tools

### Performance (4 criteria)

- [ ] **SC-006**: Game room pages maintain Lighthouse performance score 90+ in production build
- [ ] **SC-007**: Realtime message overhead stays within Supabase free tier limits (200k messages/month) for typical usage (4 players, 30-minute game sessions)
- [ ] **SC-008**: Initial game state loads within 2 seconds on 3G connection
- [ ] **SC-009**: Client-side bundle increase is under 50KB (parsed) for Realtime functionality

### Accessibility & UX Consistency (4 criteria)

- [ ] **SC-010**: All multiplayer UI elements (player list, create/join buttons) use consistent Tailwind styling matching existing components
- [ ] **SC-011**: Dark mode support works for all new multiplayer UI components
- [ ] **SC-012**: Player list and game status indicators are accessible via keyboard navigation
- [ ] **SC-013**: Screen readers can announce player join/leave events and connection status changes

### Resilience (3 criteria)

- [ ] **SC-014**: Players can reconnect after browser refresh without losing their hand cards or game state
- [ ] **SC-015**: System handles Realtime connection drops gracefully with automatic reconnection within 5 seconds
- [ ] **SC-016**: Game rooms remain functional when 1-2 players disconnect (remaining players can continue playing)

---

## User Stories Validation (6 stories)

### Priority 1 (Critical - MVP)

- [ ] **US-001**: Create and Share Game Room
  - Can create game with unique ID
  - Can share URL and join from another browser
  - Both players appear in player list

- [ ] **US-002**: Real-Time Playfield Synchronization
  - Card movements sync within 1 second
  - Card rotations sync within 1 second
  - Dragging from hand to playfield works

- [ ] **US-003**: Private Hand Management
  - Each player sees only their own hand cards
  - Other players only see card counts
  - 20-card limit enforced

### Priority 2 (Important - Production Readiness)

- [ ] **US-004**: Game Room Lifecycle Management
  - Creator sees "Close Game" button
  - Closing game notifies all players
  - Closed games reject new joins
  - Full games reject new joins

- [ ] **US-005**: Player Reconnection
  - Browser refresh preserves player ID and hand
  - Connection drops auto-reconnect
  - Connection status indicator visible

### Priority 3 (Nice-to-Have - Polish)

- [ ] **US-006**: Player Presence Indicators
  - Online/offline status displayed for all players
  - Status updates within 5 seconds of disconnect
  - Offline players still show card counts

---

## Edge Cases Validated (8 scenarios)

- [ ] Player joins mid-game (sees current state, starts with empty hand)
- [ ] Creator leaves without closing (game remains open)
- [ ] Two players interact with same card simultaneously (last-write-wins)
- [ ] Player reaches 20-card hand limit (import blocked with error)
- [ ] Realtime connection drops (auto-reconnect with status indicator)
- [ ] Invalid game ID visited (error message with create game option)
- [ ] Player session expires after 24 hours (new player ID on rejoin)
- [ ] Free tier message limit approached (debouncing keeps usage within limit)

---

## Constitution Compliance (4 principles)

- [ ] **Type Safety & Code Quality**
  - All types defined in `contracts/multiplayer-types.ts`
  - No `any` types used
  - TypeScript strict mode passes

- [ ] **Component-First Architecture**
  - Reusable components: PlayerList, ConnectionStatus, JoinGameForm
  - Hooks: useRealtimeGameRoom, usePlayerSession, usePresence
  - Clear separation of concerns

- [ ] **UX Consistency**
  - Tailwind classes for all UI elements
  - Dark mode support verified
  - Responsive design tested
  - Accessibility standards met (WCAG 2.1 Level AA)

- [ ] **Performance Requirements**
  - Lighthouse score 90+ in production
  - Bundle size < 50KB increase
  - Code splitting for Realtime client
  - Image optimization (if new images added)

---

## Testing Checklist (Manual Testing)

### Multi-Tab Testing

- [ ] Open two browser tabs, create game in Tab 1, join from Tab 2
- [ ] Verify both tabs show 2 online players
- [ ] Move card in Tab 1, verify immediate update in Tab 2
- [ ] Rotate card in Tab 2, verify immediate update in Tab 1
- [ ] Import deck in Tab 1, verify Tab 2 only sees card count
- [ ] Close game in Tab 1 (creator), verify Tab 2 notified

### Reconnection Testing

- [ ] Refresh Tab 1, verify auto-rejoin with same player ID
- [ ] Kill network in Tab 1, verify "Reconnecting" status
- [ ] Restore network, verify auto-reconnect within 5 seconds
- [ ] Close tab and reopen within 5 minutes, verify rejoin works

### Edge Case Testing

- [ ] Join game with 4 players, attempt 5th join (expect "Game Full" error)
- [ ] Visit `/game/invalid-id`, expect "Game Not Found" error
- [ ] Visit closed game URL, expect "Game Closed" error
- [ ] Import 21 cards to hand, expect error preventing exceeding limit

### Performance Testing

- [ ] Run Lighthouse audit in production build
- [ ] Verify performance score 90+
- [ ] Check bundle size (should be < 50KB increase)
- [ ] Test 3G connection speed (initial load < 2 seconds)

### Accessibility Testing

- [ ] Navigate join form with keyboard only (Tab, Enter)
- [ ] Verify screen reader announces player joins/leaves
- [ ] Check color contrast ratios for player list
- [ ] Test dark mode for all multiplayer components

---

## Documentation Checklist

- [x] **spec.md**: Complete with 6 user stories, 33 FRs, 16 success criteria
- [x] **research.md**: Supabase Realtime analysis, architectural decisions
- [x] **data-model.md**: Database schema, RLS policies, migration script
- [x] **contracts/multiplayer-types.ts**: TypeScript type definitions
- [x] **quickstart.md**: 30-minute setup guide with testing steps
- [x] **plan.md**: Implementation plan with milestones
- [ ] **tasks.md**: Task breakdown (generated by /speckit.tasks)
- [ ] **IMPLEMENTATION-SUMMARY.md**: Post-implementation summary (created after completion)

---

## Completion Criteria

This feature is considered **COMPLETE** when:

1. ✅ All 33 functional requirements are implemented and verified
2. ✅ All 16 success criteria pass manual testing
3. ✅ All 6 user stories are independently testable and work as specified
4. ✅ All 8 edge cases are handled gracefully
5. ✅ Constitution compliance verified (4 principles)
6. ✅ Multi-tab testing passes (6 scenarios)
7. ✅ Reconnection testing passes (4 scenarios)
8. ✅ Performance testing passes Lighthouse audit (90+ score)
9. ✅ Accessibility testing passes (keyboard nav, screen reader, dark mode)
10. ✅ Implementation summary document created

**Next Step**: Run `/speckit.tasks` to generate detailed task breakdown in tasks.md
