# Tasks: Multiplayer Game Rooms

**Input**: Design documents from `/specs/007-multiplayer-game-rooms/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/multiplayer-types.ts

**Note**: This project does NOT require test tasks. Focus on implementation, code quality, UX consistency, and performance per constitution principles.

**Organization**: Tasks are grouped by user story (6 stories: 3 P1, 2 P2, 1 P3) to enable independent implementation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema and type definitions that all user stories will need

- [ ] T001 Create database migration file at supabase/migrations/002_create_multiplayer_tables.sql with players table, game_sessions extensions, RLS policies, and triggers per data-model.md
- [ ] T002 Apply migration using Supabase CLI (npx supabase db push) and verify tables created successfully
- [ ] T003 [P] Extend app/lib/types/database.ts with Player and GameSession interfaces per contracts/multiplayer-types.ts
- [ ] T004 [P] Create app/lib/types/multiplayer.ts with PresenceState, ConnectionStatus, GameRoomState, and GameRoomAction types per contracts/multiplayer-types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and session management that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create app/lib/utils/player-session.ts with getOrCreatePlayerId, clearPlayerSession, getDisplayName, and setDisplayName functions using sessionStorage per quickstart.md
- [ ] T006 Create app/lib/utils/game-room.ts with createGameRoom, validateGameAccess, and canJoinGame helper functions with error handling
- [ ] T007 Modify app/lib/hooks/useSupabase.ts to add setPlayerIdContext function that configures app.player_id session variable for RLS policies
- [ ] T008 Test player ID generation and persistence across browser refreshes manually with console logs

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Share Game Room (Priority: P1) 🎯 MVP

**Goal**: Enable game room creation with shareable URLs and basic join flow so two players can access the same game

**Independent Test**: Create a new game, copy URL, open in another browser tab, verify both tabs can access same game room

### Implementation for User Story 1

- [ ] T009 [P] [US1] Create app/components/game/GameRoomLobby.tsx with "Create New Game" button component using Tailwind styling and Button component
- [ ] T010 [P] [US1] Create app/lib/hooks/useGameRoom.ts with createGame function that INSERTs into game_sessions table and returns game ID
- [ ] T011 [US1] Implement createGame handler in GameRoomLobby that creates game, stores creator player_id, and redirects to /game/{id} route
- [ ] T012 [US1] Create app/game/[id]/page.tsx dynamic route with game ID parameter extraction and basic page structure
- [ ] T013 [US1] Implement joinGame logic in game/[id]/page.tsx that validates game exists, checks is_closed and player_count, displays error messages if cannot join
- [ ] T014 [US1] Add player INSERT logic in game/[id]/page.tsx that creates player record with player_id from sessionStorage and is_creator flag for first player
- [ ] T015 [US1] Create app/components/game/PlayerList.tsx component that displays all players with display_name and player_count, using Tailwind grid layout
- [ ] T016 [US1] Add responsive styling to GameRoomLobby and PlayerList using Tailwind breakpoints (sm:, md:, lg:)
- [ ] T017 [US1] Implement dark mode support for GameRoomLobby and PlayerList using Tailwind dark: variants
- [ ] T018 [US1] Add keyboard navigation support for "Create Game" button and accessibility ARIA labels
- [ ] T019 [US1] Verify multi-tab test: create game in Tab 1, join with URL in Tab 2, verify both see game room

**Checkpoint**: At this point, two players can create and join games via shareable URLs with consistent UX

---

## Phase 4: User Story 2 - Real-Time Playfield Synchronization (Priority: P1)

**Goal**: Enable real-time synchronization of card positions and rotations across all players in a game room

**Independent Test**: Two players in same game, one moves/rotates a card, other sees update within 1 second

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create app/lib/hooks/useRealtimeGameRoom.ts with Realtime channel setup, postgres_changes subscription for game_sessions table, and playfield state management per quickstart.md
- [ ] T021 [P] [US2] Create app/lib/hooks/usePresence.ts with Presence tracking logic (track, sync events) and online players state management
- [ ] T022 [US2] Integrate useRealtimeGameRoom hook into game/[id]/page.tsx to subscribe to playfield updates on component mount
- [ ] T023 [US2] Modify app/lib/hooks/useGameState.ts to use Supabase client for playfield UPDATE operations instead of local-only state
- [ ] T024 [US2] Add debouncing to card drag operations in app/components/game/Playfield.tsx at 100ms intervals to optimize Realtime message usage
- [ ] T025 [US2] Update Playfield component to listen for Realtime playfield updates and re-render with new card positions
- [ ] T026 [US2] Update app/components/game/Card.tsx rotation handler to trigger playfield UPDATE when Q/E keys pressed
- [ ] T027 [US2] Create app/components/game/ConnectionStatus.tsx indicator component showing connection status (connecting, connected, reconnecting, disconnected) with Tailwind styling
- [ ] T028 [US2] Add ConnectionStatus component to game/[id]/page.tsx layout with responsive positioning
- [ ] T029 [US2] Implement dark mode support for ConnectionStatus using Tailwind dark: variants and appropriate status colors
- [ ] T030 [US2] Add ARIA live region to ConnectionStatus for screen reader announcements of connection state changes
- [ ] T031 [US2] Verify multi-tab test: move card in Tab 1, verify Tab 2 sees update within 1 second; rotate card in Tab 2, verify Tab 1 sees rotation

**Checkpoint**: At this point, playfield synchronization works in real-time with <1 second latency and proper connection indicators

---

## Phase 5: User Story 3 - Private Hand Management (Priority: P1)

**Goal**: Each player has private hand cards visible only to them, enforced by RLS policies at database level

**Independent Test**: Two players join game, each imports deck to hand, verify neither can see other's cards (only card counts)

### Implementation for User Story 3

- [ ] T032 [P] [US3] Create app/lib/hooks/usePlayerHand.ts with loadHand, updateHand, and addCardsToHand functions that query/update players.hand_state column
- [ ] T033 [P] [US3] Modify app/components/game/Hand.tsx to load current player's hand from database using usePlayerHand hook instead of local state
- [ ] T034 [US3] Implement hand_state UPDATE operation in usePlayerHand with player_id validation to ensure RLS policies enforced
- [ ] T035 [US3] Add hand size validation (max 20 cards) to addCardsToHand function with error message display using Tailwind alert styling
- [ ] T036 [US3] Update PlayerList component to display other players' card counts (computed from hand_state length) without revealing card contents
- [ ] T037 [US3] Modify DeckImport component to use usePlayerHand.addCardsToHand when importing decks, persisting to database
- [ ] T038 [US3] Update Hand component drag-to-playfield logic to remove card from hand_state and add to playfield_state in single transaction
- [ ] T039 [US3] Add responsive styling to Hand component card grid using Tailwind breakpoints for different screen sizes
- [ ] T040 [US3] Implement dark mode support for Hand component cards and error messages
- [ ] T041 [US3] Add keyboard navigation for hand cards (Tab to focus, Space/Enter to select) with ARIA labels
- [ ] T042 [US3] Verify multi-tab test: import deck in Tab 1, verify Tab 2 only sees "Player has X cards" without card images/names

**Checkpoint**: At this point, private hands work with RLS enforcement, 20-card limit, and no data leakage to other players

---

## Phase 6: User Story 4 - Game Room Lifecycle Management (Priority: P2)

**Goal**: Game creators can close games, and system handles player limits and closed game access gracefully

**Independent Test**: Create game as creator, join with other players, close game, verify all notified and new joins blocked

### Implementation for User Story 4

- [ ] T043 [P] [US4] Create app/components/game/CloseGameButton.tsx component that displays only for creator (using is_creator flag) with confirmation dialog
- [ ] T044 [P] [US4] Create app/lib/hooks/useGameLifecycle.ts with closeGame function that UPDATEs game_sessions.is_closed and cleans up Realtime channels
- [ ] T045 [US4] Implement closeGame handler that marks game as closed, broadcasts notification to all players via Realtime, and redirects creator
- [ ] T046 [US4] Add Realtime subscription in game/[id]/page.tsx to listen for is_closed updates and display "Game Closed" message to all players
- [ ] T047 [US4] Update joinGame logic in game/[id]/page.tsx to check is_closed flag and display error message "Game is closed" with Tailwind styling
- [ ] T048 [US4] Update joinGame logic to check player_count >= max_players and display error message "Game is full (4/4 players)" with Tailwind styling
- [ ] T049 [US4] Add channel cleanup logic to useRealtimeGameRoom that calls supabase.removeChannel when component unmounts or game closes
- [ ] T050 [US4] Create app/components/game/GameErrorMessage.tsx reusable component for displaying error states (closed, full, not found) with consistent styling
- [ ] T051 [US4] Add responsive layout for CloseGameButton and error messages using Tailwind breakpoints
- [ ] T052 [US4] Implement dark mode support for CloseGameButton and GameErrorMessage components
- [ ] T053 [US4] Add keyboard accessibility for CloseGameButton (Space/Enter to trigger) and ARIA labels for error states
- [ ] T054 [US4] Verify creator can close game, all players notified, new joins blocked, and 5th player cannot join full game

**Checkpoint**: At this point, game lifecycle management works with proper permissions, limits, and user notifications

---

## Phase 7: User Story 5 - Player Reconnection (Priority: P2)

**Goal**: Players can reconnect after browser refresh or network interruption without losing their game state

**Independent Test**: Join game, refresh browser, verify auto-rejoin with same player_id, display_name, and hand cards intact

### Implementation for User Story 5

- [ ] T055 [P] [US5] Modify game/[id]/page.tsx to check for existing player_id in sessionStorage on mount and attempt rejoin if found
- [ ] T056 [P] [US5] Create app/lib/hooks/useReconnection.ts with reconnectPlayer function that validates session, checks 24-hour expiry, and restores state
- [ ] T057 [US5] Add exponential backoff reconnection logic to useRealtimeGameRoom when channel disconnects (retry intervals: 1s, 2s, 5s, 10s, 30s)
- [ ] T058 [US5] Update ConnectionStatus component to show "Reconnecting..." state with animated indicator during auto-reconnect attempts
- [ ] T059 [US5] Implement session recovery in useReconnection that fetches latest game_sessions and players data after reconnection succeeds
- [ ] T060 [US5] Add player session expiry check (24 hours) in useReconnection and assign new player_id if expired, showing informational message
- [ ] T061 [US5] Update usePlayerHand to restore hand_state from database after reconnection using player_id lookup
- [ ] T062 [US5] Add connection status change notifications (toast or banner) when transitioning between connected/reconnecting/disconnected states
- [ ] T063 [US5] Implement responsive styling for reconnection UI elements using Tailwind breakpoints
- [ ] T064 [US5] Add dark mode support for reconnection indicators and status messages
- [ ] T065 [US5] Add ARIA live region announcements for connection status changes for screen readers
- [ ] T066 [US5] Verify browser refresh preserves player_id and hand; verify network disconnect triggers auto-reconnect within 5 seconds

**Checkpoint**: At this point, reconnection works reliably with proper session management and user feedback

---

## Phase 8: User Story 6 - Player Presence Indicators (Priority: P3)

**Goal**: Display real-time online/offline status indicators for all players in the game room

**Independent Test**: Two players join, one closes browser, verify other sees status change to "offline" within 5 seconds

### Implementation for User Story 6

- [ ] T067 [P] [US6] Modify usePresence hook to track online_at timestamp and maintain presence state for all players in game room
- [ ] T068 [P] [US6] Update PlayerList component to display online/offline status indicators (green dot for online, gray for offline) using Tailwind styling
- [ ] T069 [US6] Add presence heartbeat mechanism in usePresence with 30-second intervals to maintain online status
- [ ] T070 [US6] Implement presence sync event handler in usePresence to update is_online flags in local state when players join/leave
- [ ] T071 [US6] Add visual animations to presence indicators (fade in/out, pulse for online) using Tailwind animations
- [ ] T072 [US6] Update PlayerList to show last_seen timestamp for offline players in human-readable format (e.g., "offline 5 minutes ago")
- [ ] T073 [US6] Implement responsive layout for presence indicators that works on mobile (smaller dots, compact layout)
- [ ] T074 [US6] Add dark mode support for presence indicators with appropriate online/offline colors (green-400/gray-500 for dark mode)
- [ ] T075 [US6] Add ARIA labels for presence indicators (e.g., "Player 1 is online") for screen readers
- [ ] T076 [US6] Verify multi-tab test: close Tab 1, verify Tab 2 shows offline status within 5 seconds; reopen Tab 1, verify online status restored

**Checkpoint**: At this point, presence indicators provide clear real-time awareness of player online/offline status

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple user stories and production readiness

- [ ] T077 [P] Add loading states to all components (Playfield, Hand, PlayerList) with Tailwind skeleton loaders while data fetches
- [ ] T078 [P] Create app/components/game/JoinGameForm.tsx component for display name input on first join with Tailwind form styling
- [ ] T079 [P] Implement error boundary in game/[id]/page.tsx to catch and display Realtime connection errors gracefully
- [ ] T080 Add multiplayer-specific CSS animations to app/globals.css for card movements, presence indicators, and connection status
- [ ] T081 Optimize Realtime client code splitting using Next.js dynamic imports to reduce initial bundle size
- [ ] T082 Add console logging for Realtime events during development (removable via environment variable for production)
- [ ] T083 Implement display name editing functionality in PlayerList (click name to edit, save to players.display_name column)
- [ ] T084 Add game room URL copy-to-clipboard button with success toast notification using Tailwind
- [ ] T085 Verify accessibility with keyboard-only navigation through all components (Tab, Enter, Space, Escape keys)
- [ ] T086 Run Lighthouse audit on production build and verify performance score 90+, document any optimizations needed
- [ ] T087 Verify dark mode consistency across all multiplayer components (Playfield, Hand, PlayerList, ConnectionStatus, modals)
- [ ] T088 Test responsive design on mobile (iPhone SE), tablet (iPad), and desktop (1920px) to ensure proper layout
- [ ] T089 Execute all manual test scenarios from quickstart.md and verify all pass
- [ ] T090 Update .github/copilot-instructions.md with multiplayer technologies and patterns

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed) after Phase 2
  - Or sequentially in priority order: US1 (P1) → US2 (P1) → US3 (P1) → US4 (P2) → US5 (P2) → US6 (P3)
- **Polish (Phase 9)**: Depends on US1, US2, US3 (P1 stories) being complete for MVP

### User Story Dependencies

- **US1 (Create/Join)**: Can start after Foundational - No dependencies on other stories
- **US2 (Realtime Sync)**: Can start after Foundational - Integrates with US1 but independently testable
- **US3 (Private Hands)**: Can start after Foundational - Integrates with US1/US2 but independently testable
- **US4 (Lifecycle)**: Can start after Foundational - Extends US1 functionality but independently testable
- **US5 (Reconnection)**: Can start after Foundational - Enhances US2 reliability but independently testable
- **US6 (Presence)**: Can start after Foundational - Adds to US1 PlayerList but independently testable

### Within Each User Story

- Type definitions before hooks
- Hooks before components
- Core implementation before integration with existing features
- Responsive/dark mode/accessibility after functional implementation
- Multi-tab testing validates story completion

### Parallel Opportunities Within Phases

**Phase 1 (Setup)**:
- T003 (database types) and T004 (multiplayer types) can run in parallel

**Phase 2 (Foundational)**:
- All tasks sequential due to dependencies

**Phase 3 (US1)**:
- T009 (GameRoomLobby) and T010 (useGameRoom) can run in parallel
- T016 (responsive), T017 (dark mode), T018 (accessibility) can run in parallel after T015

**Phase 4 (US2)**:
- T020 (useRealtimeGameRoom) and T021 (usePresence) can run in parallel
- T027 (ConnectionStatus) can run in parallel with T024-T026

**Phase 5 (US3)**:
- T032 (usePlayerHand) and T033 (Hand modifications) can run in parallel initially

**Phase 6 (US4)**:
- T043 (CloseGameButton) and T044 (useGameLifecycle) can run in parallel

**Phase 7 (US5)**:
- T055 (rejoin logic) and T056 (useReconnection) can run in parallel

**Phase 8 (US6)**:
- T067 (presence tracking) and T068 (presence indicators) can run in parallel

**Phase 9 (Polish)**:
- T077 (loading states), T078 (JoinGameForm), T079 (error boundary) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Can be developed simultaneously by different developers:
Developer A: T009 - Create GameRoomLobby.tsx component
Developer B: T010 - Create useGameRoom.ts hook

# After functional implementation, polish tasks can run in parallel:
Developer A: T016 - Add responsive styling
Developer B: T017 - Implement dark mode
Developer C: T018 - Add keyboard accessibility
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3 Only)

1. Complete Phase 1: Setup (database + types) - **~1 hour**
2. Complete Phase 2: Foundational (utilities + session management) - **~2 hours**
3. Complete Phase 3: User Story 1 (create/join game rooms) - **~4 hours**
4. Complete Phase 4: User Story 2 (real-time sync) - **~4 hours**
5. Complete Phase 5: User Story 3 (private hands) - **~4 hours**
6. **STOP and VALIDATE**: Manual testing with quickstart.md scenarios
7. Run Lighthouse audit (target: 90+ score)
8. Deploy/demo MVP (15 hours total for P1 features)

### Incremental Delivery (Add P2 Features)

1. Complete MVP (Phases 1-5) → Foundation ready with core multiplayer
2. Add Phase 6: User Story 4 (game lifecycle) - **~3 hours** → Validate → Deploy
3. Add Phase 7: User Story 5 (reconnection) - **~4 hours** → Validate → Deploy
4. Each P2 story adds robustness without breaking P1 stories

### Full Feature (Add P3 Polish)

1. Complete MVP + P2 (Phases 1-7) → Production-ready core
2. Add Phase 8: User Story 6 (presence indicators) - **~3 hours** → Validate
3. Add Phase 9: Polish (loading, errors, optimizations) - **~4 hours** → Validate
4. Final Lighthouse audit and accessibility verification
5. Deploy complete feature (29 hours total for all stories)

### Parallel Team Strategy

With 3 developers after Foundational phase completes:

1. Team completes Setup + Foundational together (Phases 1-2)
2. Once Foundational is done, parallel development:
   - **Developer A**: Phase 3 (US1 - Create/Join)
   - **Developer B**: Phase 4 (US2 - Realtime Sync)  
   - **Developer C**: Phase 5 (US3 - Private Hands)
3. Stories integrate naturally (all use same Realtime channels, database schema)
4. Daily integration testing ensures no conflicts
5. After P1 complete, proceed with P2/P3 sequentially or in parallel

---

## Notes

- **[P] tasks** = different files, no dependencies within phase
- **[Story] label** maps task to specific user story for traceability
- **Each user story** should be independently completable and testable
- **No test tasks** per project constitution (focus on manual validation)
- **Constitution compliance**: All tasks follow Type Safety, Component-First, UX Consistency, Performance principles
- **Manual validation** focuses on UX consistency, accessibility, dark mode, and performance
- **Commit** after each task or logical group of related tasks
- **Stop at checkpoints** to validate story independently with multi-tab testing
- **Time estimates**: Setup ~1h, Foundational ~2h, each P1 story ~4h, each P2 story ~3-4h, P3 ~3h, Polish ~4h
