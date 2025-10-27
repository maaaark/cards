# Tasks: Card Sandbox Playfield

**Input**: Design documents from `/specs/001-card-sandbox/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Note**: This project does NOT require test tasks. Focus on implementation, code quality, UX consistency, and performance.

**Organization**: Tasks are grouped by user story to enable independent implementation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `app/`, `app/components/`, `app/lib/`
- Paths shown below use Next.js App Router structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Install Supabase SDK: `npm install @supabase/supabase-js`
- [ ] T002 Install UUID library: `npm install uuid @types/uuid --save-dev`
- [ ] T003 [P] Install next-themes for dark mode: `npm install next-themes`
- [ ] T004 [P] Create environment variables file `.env.local` with Supabase URL and anon key
- [ ] T005 [P] Create `.env.local.example` template file in project root
- [ ] T006 Create Supabase project structure: `supabase/migrations/` directory
- [ ] T007 Create database migration file `supabase/migrations/001_create_game_sessions.sql` with game_sessions table schema
- [ ] T008 Run database migration in Supabase SQL Editor to create tables and triggers
- [ ] T009 Create directory structure: `app/game/`, `app/components/game/`, `app/components/ui/`, `app/lib/types/`, `app/lib/hooks/`, `app/lib/utils/`, `app/lib/supabase/`
- [ ] T010 [P] Copy type definitions from `specs/001-card-sandbox/contracts/game-state.ts` to `app/lib/types/game.ts`
- [ ] T011 [P] Create placeholder card back SVG in `public/card-back.svg`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T012 Configure Supabase client in `app/lib/supabase/client.ts` with environment variables
- [ ] T013 [P] Configure Tailwind dark mode in `tailwind.config.ts` with `darkMode: 'class'`
- [ ] T014 [P] Update root layout `app/layout.tsx` to include ThemeProvider from next-themes with `suppressHydrationWarning`
- [ ] T015 Create test deck generation utility in `app/lib/utils/deck.ts` with `generateTestDeck()` function
- [ ] T016 [P] Create deck validation utility in `app/lib/utils/deck.ts` with `validateDeckImport()` function
- [ ] T017 Create `useSupabase` hook in `app/lib/hooks/useSupabase.ts` with loadGameState, saveGameState, deleteGameState functions
- [ ] T018 Create `useGameState` hook in `app/lib/hooks/useGameState.ts` with state management, drawCard, playCard, importDeck, resetGame functions
- [ ] T019 Create session ID utility in `app/lib/utils/session.ts` to generate and manage localStorage session IDs
- [ ] T020 [P] Create reusable Button component in `app/components/ui/Button.tsx` with Tailwind styling and dark mode support
- [ ] T021 [P] Create FileUpload component in `app/components/ui/FileUpload.tsx` with drag-and-drop support and validation

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Playfield with Deck (Priority: P1) 🎯 MVP

**Goal**: Display a playfield with a visible card deck, establishing the basic visual structure

**Independent Test**: Load the page, visually confirm playfield area is displayed with card deck visible. Resize browser to verify responsive behavior.

### Implementation for User Story 1

- [ ] T022 [P] [US1] Create Card component in `app/components/game/Card.tsx` with TypeScript CardProps interface, aspect-[5/7] ratio, responsive sizing (w-20 sm:w-24 md:w-28 lg:w-32)
- [ ] T023 [P] [US1] Add dark mode support to Card component with `dark:` Tailwind utilities for background and text colors
- [ ] T024 [P] [US1] Add hover states to Card component with `hover:` utilities and transition effects
- [ ] T025 [P] [US1] Add ARIA labels to Card component with role and aria-label attributes
- [ ] T026 [P] [US1] Memoize Card component with `React.memo` for performance optimization
- [ ] T027 [P] [US1] Create Deck component in `app/components/game/Deck.tsx` with click handler, card back display, and remaining count badge
- [ ] T028 [P] [US1] Add dark mode support to Deck component with proper color schemes
- [ ] T029 [P] [US1] Add hover and disabled states to Deck component with visual feedback
- [ ] T030 [P] [US1] Add ARIA labels to Deck component (`aria-label="Draw card from deck"`)
- [ ] T031 [US1] Create Playfield component in `app/components/game/Playfield.tsx` with grid layout for cards, CSS Grid with responsive columns (grid-cols-4 md:grid-cols-6 lg:grid-cols-8)
- [ ] T032 [US1] Add Deck component to Playfield layout positioned in visible location
- [ ] T033 [US1] Add dark mode support to Playfield component with proper background colors
- [ ] T034 [US1] Add responsive design to Playfield with proper padding and gap spacing
- [ ] T035 [US1] Create game page `app/game/page.tsx` that renders Playfield component
- [ ] T036 [US1] Initialize game state in game page using `useGameState` hook with 20-card test deck
- [ ] T037 [US1] Add proper TypeScript types to game page component
- [ ] T038 [US1] Verify Lighthouse performance score 90+ for initial page load

**Checkpoint**: At this point, User Story 1 should be fully functional with playfield and deck visible, responsive design working, and dark mode supported

---

## Phase 4: User Story 2 - Draw Cards from Deck (Priority: P2)

**Goal**: Enable clicking on deck to draw cards into hand area at bottom of screen

**Independent Test**: Click deck, verify card appears in hand at bottom. Draw multiple cards, verify all visible. Resize browser, verify hand stays fixed at bottom.

### Implementation for User Story 2

- [ ] T039 [P] [US2] Create Hand component in `app/components/game/Hand.tsx` with fixed bottom positioning (fixed bottom-0 left-0 right-0)
- [ ] T040 [P] [US2] Add horizontal flexbox layout to Hand component with gap and overflow-x-auto for scrolling
- [ ] T041 [P] [US2] Add dark mode support to Hand component with proper background (bg-zinc-100 dark:bg-zinc-800)
- [ ] T042 [P] [US2] Add responsive padding and max-width to Hand component (p-4 max-w-screen-xl mx-auto)
- [ ] T043 [P] [US2] Add ARIA labels to Hand component with role="list" and aria-label="Your hand"
- [ ] T044 [US2] Implement drawCard function in `useGameState` hook to move first card from deck to hand
- [ ] T045 [US2] Add validation in drawCard to check if deck is empty before drawing
- [ ] T046 [US2] Add visual feedback animation when card is drawn (transition effects)
- [ ] T047 [US2] Connect Deck onClick handler to drawCard function from useGameState
- [ ] T048 [US2] Add Hand component to game page below Playfield
- [ ] T049 [US2] Pass hand state and drawCard function to appropriate components
- [ ] T050 [US2] Add empty state handling to Deck component when no cards remain (visual indication, disabled state)
- [ ] T051 [US2] Test rapid clicking on deck to ensure proper state management (debounce if needed)
- [ ] T052 [US2] Verify hand area remains fixed at bottom during scroll and resize
- [ ] T053 [US2] Verify response time <1s for draw card action

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - players can see playfield and draw cards into hand

---

## Phase 5: User Story 3 - Play Cards to Playfield (Priority: P3)

**Goal**: Enable clicking cards in hand to play them onto the playfield, removing them from hand

**Independent Test**: Draw cards, click card in hand, verify it appears on playfield and is removed from hand. Play multiple cards, verify all visible on playfield.

### Implementation for User Story 3

- [ ] T054 [US3] Implement playCard function in `useGameState` hook to move card from hand to playfield by cardId
- [ ] T055 [US3] Add validation in playCard to check if card exists in hand
- [ ] T056 [US3] Update Hand component to make cards clickable with onClick handler
- [ ] T057 [US3] Pass playCard function from useGameState to Hand component
- [ ] T058 [US3] Add Card click handler in Hand to call playCard with card.id
- [ ] T059 [US3] Add visual feedback to cards in hand showing they are clickable (cursor-pointer, hover effects)
- [ ] T060 [US3] Create PlayfieldCards section in Playfield component with grid layout for played cards
- [ ] T061 [US3] Update Playfield to render both deck and played cards in separate areas
- [ ] T062 [US3] Ensure played cards don't overlap deck or obscure UI elements (proper grid positioning)
- [ ] T063 [US3] Add transition animations when card moves from hand to playfield
- [ ] T064 [US3] Test playing multiple cards to verify layout handles 20+ cards without breaking
- [ ] T065 [US3] Add ARIA labels to playfield cards with appropriate role attributes
- [ ] T066 [US3] Verify cards maintain visual distinction between hand and playfield (different styling/borders)
- [ ] T067 [US3] Verify response time <1s for play card action
- [ ] T068 [US3] Test full flow: view playfield → draw cards → play cards within 30 seconds

**Checkpoint**: All user stories should now be independently functional - complete card gameplay working

---

## Phase 6: Session Persistence & Deck Import (Additional Features)

**Purpose**: Add session persistence via Supabase and JSON deck import functionality

- [ ] T069 [P] Implement Supabase save operations in `useSupabase` hook with debounced writes (500ms)
- [ ] T070 [P] Implement Supabase load operations in `useSupabase` hook with session ID lookup
- [ ] T071 Connect useGameState hook to useSupabase for auto-save on state changes
- [ ] T072 Load existing game state on page load if session exists in Supabase
- [ ] T073 Test browser refresh to verify game state persists (deck, hand, playfield all restored)
- [ ] T074 [P] Create DeckImport component in `app/components/game/DeckImport.tsx` with file upload UI
- [ ] T075 [P] Add JSON validation in DeckImport using `validateDeckImport()` utility
- [ ] T076 [P] Add error handling and user feedback for invalid JSON files
- [ ] T077 [P] Add file size limit validation (5MB maximum)
- [ ] T078 Implement lazy loading for DeckImport component using Next.js dynamic import
- [ ] T079 Connect DeckImport onImport handler to useGameState importDeck function
- [ ] T080 Add DeckImport button/UI to game page (modal or slide-out panel)
- [ ] T081 Test importing valid JSON deck to verify deck replacement and game reset
- [ ] T082 Test importing invalid JSON to verify error messages display
- [ ] T083 Verify imported deck does NOT persist to database (temporary only)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T084 [P] Add loading states to all async operations (Supabase loads/saves)
- [ ] T085 [P] Add error boundary component to handle React errors gracefully
- [ ] T086 [P] Add toast/notification system for user feedback (card drawn, card played, errors)
- [ ] T087 Accessibility audit: verify all interactive elements have ARIA labels and keyboard navigation
- [ ] T088 Accessibility audit: verify semantic HTML throughout (button, ul/li, proper heading hierarchy)
- [ ] T089 Accessibility audit: verify focus-visible styles on all interactive elements
- [ ] T090 Dark mode audit: verify all components have proper dark: utilities and contrast
- [ ] T091 Responsive design audit: test on mobile (375px), tablet (768px), desktop (1024px, 1920px)
- [ ] T092 Performance optimization: verify Card component is memoized and not re-rendering unnecessarily
- [ ] T093 Performance optimization: verify bundle size <200KB parsed JavaScript
- [ ] T094 Performance optimization: verify DeckImport is lazy loaded and not in initial bundle
- [ ] T095 Run Lighthouse audit in production build and verify 90+ score across all metrics
- [ ] T096 Code cleanup: remove console.logs, commented code, and unused imports
- [ ] T097 Code cleanup: ensure all components follow TypeScript strict mode (no `any` types)
- [ ] T098 [P] Add JSDoc comments to all exported functions and components
- [ ] T099 [P] Create README.md in app/components/game/ documenting component usage
- [ ] T100 Final validation: run through complete user flow from quickstart.md and verify all acceptance scenarios pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) AND User Story 1 completion (needs Card and Playfield components)
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) AND User Story 2 completion (needs Hand component and drawCard working)
- **Session & Import (Phase 6)**: Can start after Foundational (Phase 2) - can run parallel with user stories or after
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - foundation
- **User Story 2 (P2)**: Depends on User Story 1 (needs Playfield and Card components)
- **User Story 3 (P3)**: Depends on User Story 2 (needs Hand component)

### Within Each User Story

- Components marked [P] can be built in parallel
- Component integration tasks depend on individual components being complete
- Game page integration depends on all components for that story

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Within User Story 1: T022-T026 (Card), T027-T030 (Deck) can run in parallel
- Within User Story 2: T039-T043 (Hand) can be built while testing User Story 1
- Session & Import (Phase 6) can be developed in parallel with User Story 3

---

## Parallel Example: User Story 1

```bash
# Launch Card component tasks together:
Task: "Create Card component in app/components/game/Card.tsx with TypeScript CardProps interface"
Task: "Add dark mode support to Card component"
Task: "Add hover states to Card component"
Task: "Add ARIA labels to Card component"
Task: "Memoize Card component with React.memo"

# Launch Deck component tasks together (parallel with Card):
Task: "Create Deck component in app/components/game/Deck.tsx"
Task: "Add dark mode support to Deck component"
Task: "Add hover and disabled states to Deck component"
Task: "Add ARIA labels to Deck component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Load page, verify playfield and deck visible, test responsive design, check dark mode
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Validate visuals and responsiveness → Deploy/Demo (MVP!)
3. Add User Story 2 → Validate card drawing mechanics → Deploy/Demo
4. Add User Story 3 → Validate card playing mechanics → Deploy/Demo
5. Add Session Persistence → Validate state survives refresh
6. Add Deck Import → Validate JSON import
7. Polish → Final audit and optimization

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Playfield, Deck, Card components)
   - Developer B: User Story 2 (Hand component, drawCard logic) - starts after US1 components available
   - Developer C: Session Persistence & Deck Import (Phase 6)
3. Developer A → User Story 3 after completing User Story 1
4. All converge on Polish phase

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable
- Manual validation focuses on UX consistency, accessibility, and performance
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Task Summary

**Total Tasks**: 100
- Setup (Phase 1): 11 tasks
- Foundational (Phase 2): 10 tasks (BLOCKING)
- User Story 1 (Phase 3): 17 tasks
- User Story 2 (Phase 4): 15 tasks
- User Story 3 (Phase 5): 15 tasks
- Session & Import (Phase 6): 15 tasks
- Polish (Phase 7): 17 tasks

**Parallel Opportunities**: 35+ tasks marked with [P] can run in parallel within their phases

**Independent Test Criteria**:
- US1: Load page → see playfield and deck → resize browser
- US2: Click deck → cards appear in hand → hand stays at bottom
- US3: Click card in hand → appears on playfield → removed from hand

**Suggested MVP Scope**: Complete through Phase 3 (User Story 1) for initial demo - playfield with visible deck and responsive design
