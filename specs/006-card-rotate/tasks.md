# Tasks: Card Tap/Rotate

**Input**: Design documents from `/specs/006-card-rotate/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/card-rotate.ts, quickstart.md

**Note**: This project does NOT require automated test tasks. Focus on implementation, code quality, UX consistency, and performance validation through manual testing.

**Organization**: Tasks are grouped by user story to enable independent implementation of each story (US1=P1, US2=P2, US3=P1).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and type system foundation

- [x] T001 Verify branch `006-card-rotate` is checked out and up to date
- [x] T002 Review plan.md, spec.md, data-model.md, and quickstart.md for context
- [x] T003 Ensure existing features 001-004 are working (drag-drop, hover preview)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type definitions and utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 [P] Extend `Playfield` interface with `rotations: Map<string, number>` in `app/lib/types/game.ts`
- [ ] T005 [P] Update `GameSessionRow` interface to include `rotations: Record<string, number>` in playfield_state JSONB in `app/lib/types/game.ts`
- [ ] T006 [P] Create rotation utility functions (normalizeRotation, calculateNextRotation, validateRotationState) in `app/lib/utils/rotation.ts`
- [ ] T007 Create useCardRotation hook with getRotation, rotateCard, setRotation, clearRotation methods in `app/lib/hooks/useCardRotation.ts`
- [ ] T008 [P] Update useGameState hook to initialize rotations Map in playfield state in `app/lib/hooks/useGameState.ts`
- [ ] T009 [P] Update useSupabase hook to serialize/deserialize rotations Map ↔ Object in `app/lib/hooks/useSupabase.ts`
- [ ] T010 Update CardProps interface to include optional `rotation?: number` prop in `app/lib/types/game.ts`

**Checkpoint**: Foundation ready - rotation state management infrastructure complete, user story implementation can now begin

---

## Phase 3: User Story 1 - Basic Card Tapping (Priority: P1) 🎯 MVP

**Goal**: Enable clockwise rotation of cards with 'E' key, providing core tap functionality

**Independent Test**: Hover any card on playfield and press 'E' → card rotates 90° clockwise with smooth animation. Press 'E' four times → card returns to 0° (full rotation cycle).

### Implementation for User Story 1

- [ ] T011 [US1] Update Card component to accept rotation prop and apply CSS transform `rotate(${rotation}deg)` in `app/components/game/Card.tsx`
- [ ] T012 [US1] Add Tailwind transition classes (`transition-transform duration-300 ease-in-out`) to Card component for smooth rotation animation in `app/components/game/Card.tsx`
- [ ] T013 [US1] Combine rotation transform with existing drag offset transform (translate + rotate) in Card component inline styles in `app/components/game/Card.tsx`
- [ ] T014 [US1] Update Playfield component to get rotation for each card using useCardRotation.getRotation() in `app/components/game/Playfield.tsx`
- [ ] T015 [US1] Pass rotation prop to Card components in Playfield in `app/components/game/Playfield.tsx`
- [ ] T016 [US1] Add global keydown event listener in game page for 'E' key (clockwise rotation) in `app/game/page.tsx`
- [ ] T017 [US1] Implement preventDefault() for 'E' key to block browser default behavior in `app/game/page.tsx`
- [ ] T018 [US1] Get hovered card ID from CardPreviewContext.previewState.cardId in keyboard handler in `app/game/page.tsx`
- [ ] T019 [US1] Call useCardRotation.rotateCard(cardId, 90) when 'E' pressed on hovered card in `app/game/page.tsx`
- [ ] T020 [US1] Add 'use client' directive to game page if not already present in `app/game/page.tsx`

**Manual Validation for US1**:
- [ ] T021 [US1] Test: Hover card on playfield and press 'E' → rotates 90° clockwise
- [ ] T022 [US1] Test: Press 'E' four times → card completes 360° cycle (0° → 90° → 180° → 270° → 0°)
- [ ] T023 [US1] Test: Rotation animation takes 200-300ms (smooth, not instant)
- [ ] T024 [US1] Test: 'E' key does NOT trigger browser quick find or other default actions
- [ ] T025 [US1] Test: Pressing 'E' without hovering any card → no rotation occurs
- [ ] T026 [US1] Test: Rotation state persists on browser refresh (Supabase auto-save)
- [ ] T027 [US1] Test: Rotation works on cards in hand (if applicable)
- [ ] T028 [US1] Test: Dark mode rotation animation renders correctly

**Checkpoint**: User Story 1 (Basic Card Tapping) is fully functional with smooth animations and browser event prevention

---

## Phase 4: User Story 2 - Counter-Clockwise Untapping (Priority: P2)

**Goal**: Enable counter-clockwise rotation with 'Q' key for reversing taps and corrections

**Independent Test**: Hover any card and press 'Q' → card rotates 90° counter-clockwise. Press 'Q' on a tapped (90°) card → returns to upright (0°).

### Implementation for User Story 2

- [ ] T029 [US2] Add keydown listener for 'Q' key (counter-clockwise rotation) in game page keyboard handler in `app/game/page.tsx`
- [ ] T030 [US2] Implement preventDefault() for 'Q' key to block browser default behavior in `app/game/page.tsx`
- [ ] T031 [US2] Call useCardRotation.rotateCard(cardId, -90) when 'Q' pressed on hovered card in `app/game/page.tsx`

**Manual Validation for US2**:
- [ ] T032 [US2] Test: Hover card and press 'Q' → rotates 90° counter-clockwise (270° position)
- [ ] T033 [US2] Test: Press 'Q' on card at 90° → returns to 0° (upright)
- [ ] T034 [US2] Test: Press 'Q' four times → card completes reverse 360° cycle (0° → 270° → 180° → 90° → 0°)
- [ ] T035 [US2] Test: 'Q' key does NOT trigger browser default actions
- [ ] T036 [US2] Test: Combine Q and E keys (e.g., E, E, Q) → correct cumulative rotation (90° + 90° - 90° = 90°)
- [ ] T037 [US2] Test: Rapid alternating Q/E key presses → animations remain smooth without glitches

**Checkpoint**: User Story 2 (Counter-Clockwise Untapping) works independently and integrates smoothly with US1

---

## Phase 5: User Story 3 - Keyboard Event Handling (Priority: P1)

**Goal**: Ensure keyboard events only fire when hovering cards and prevent all browser defaults

**Independent Test**: Press Q/E without hovering → no rotation. Press Q/E while hovering card → rotation only, no browser actions.

### Implementation for User Story 3

- [ ] T038 [US3] Add null check for hoveredCardId in keyboard handler (early return if no card hovered) in `app/game/page.tsx`
- [ ] T039 [US3] Add case-insensitive key matching ('e' OR 'E', 'q' OR 'Q') in keyboard handler in `app/game/page.tsx`
- [ ] T040 [US3] Verify event.preventDefault() is called before rotateCard() in both Q and E handlers in `app/game/page.tsx`
- [ ] T041 [US3] Add cleanup function to remove keydown listener on component unmount in `app/game/page.tsx`

**Manual Validation for US3**:
- [ ] T042 [US3] Test: Press Q/E without hovering any card → no rotation occurs, no errors in console
- [ ] T043 [US3] Test: Press Q/E while hovering card → only rotation occurs, NO browser quick find dialog
- [ ] T044 [US3] Test: Press Q/E with modifier keys (Ctrl+E, Shift+Q) → appropriate behavior (either ignore or rotate based on design decision)
- [ ] T045 [US3] Test: Navigate away from game page → keydown listener properly cleaned up (no memory leaks)
- [ ] T046 [US3] Test: Both uppercase and lowercase keys work ('q'/'Q', 'e'/'E')

**Checkpoint**: User Story 3 (Keyboard Event Handling) ensures robust event handling with proper browser integration

---

## Phase 6: State Persistence & Edge Cases

**Purpose**: Ensure rotation state persists correctly and handle all edge cases from spec

- [ ] T047 [P] Update useGameState.moveCardToHand to clear rotation state when card moves from playfield to hand in `app/lib/hooks/useGameState.ts`
- [ ] T048 [P] Update useGameState.discardCard to clear rotation state when card is discarded in `app/lib/hooks/useGameState.ts`
- [ ] T049 [P] Update useGameState.resetGame to clear all rotation state (empty Map) in `app/lib/hooks/useGameState.ts`
- [ ] T050 [P] Update useGameState.importDeck to clear all rotation state on new deck import in `app/lib/hooks/useGameState.ts`
- [ ] T051 Verify rotation state is included in Supabase auto-save debouncing (500ms) in `app/lib/hooks/useGameState.ts`

**Edge Case Validation**:
- [ ] T052 Test: Rapidly press E/Q 20+ times in 1 second → no visual glitches, all rotations applied (>10 rotations/sec requirement)
- [ ] T053 Test: Press E and Q simultaneously → one wins, no errors (graceful handling)
- [ ] T054 Test: Start rotation animation, press opposite key mid-animation → smooth transition to new target angle
- [ ] T055 Test: Rotate card, move mouse away during animation → animation completes (rotation not interrupted)
- [ ] T056 Test: Overlapping cards with hover → only top card (by z-index) rotates
- [ ] T057 Test: Rotate card, drag it to new position → rotation persists during and after drag
- [ ] T058 Test: Rotate card, trigger hover preview (ALT key) → preview shows rotated card at current angle
- [ ] T059 Test: Rotate card on playfield, drag back to hand → rotation cleared, card returns to 0° if played again
- [ ] T060 Test: Import new deck → all rotation state cleared, new cards start at 0°

---

## Phase 7: Performance & UX Polish

**Purpose**: Optimize performance and ensure constitutional compliance

- [ ] T061 Verify Card component is properly memoized (React.memo) to prevent unnecessary re-renders in `app/components/game/Card.tsx`
- [ ] T062 Run Chrome DevTools Performance profiler: measure key press to visual update (<50ms requirement)
- [ ] T063 Verify rotation animation duration is 300ms using browser DevTools slow motion
- [ ] T064 Test rapid rotation throughput: alternate Q/E for 5 seconds, count successful rotations (>50 = passing >10/sec)
- [ ] T065 Run `npm run build` and verify bundle size increase is <2KB (rotation.ts + hook changes)
- [ ] T066 Test with Chrome, Firefox, Safari, Edge → rotation animations work consistently across browsers
- [ ] T067 Verify dark mode rotation animations and transforms render correctly
- [ ] T068 Verify rotation works with keyboard navigation (accessible via tab + space/enter for card focus)
- [ ] T069 Run Lighthouse audit on game page → verify performance score remains 90+
- [ ] T070 Add ARIA live region for screen readers announcing rotation state (optional accessibility enhancement)

---

## Phase 8: Documentation & Finalization

**Purpose**: Document implementation and validate completeness

- [ ] T071 Update feature branch README or docs with keyboard shortcuts (Q/E for rotation)
- [ ] T072 Run through all acceptance scenarios from spec.md (User Stories 1-3)
- [ ] T073 Run through full testing checklist from quickstart.md (24 test items)
- [ ] T074 Verify Constitution Check compliance: TypeScript strict mode, component-first architecture, UX consistency, performance
- [ ] T075 Code review: Check for any `any` types, verify all functions have proper TypeScript signatures
- [ ] T076 Final smoke test: Import deck → draw cards → rotate on playfield → refresh browser → verify persistence
- [ ] T077 Commit all changes with descriptive messages referencing feature 006-card-rotate
- [ ] T078 Update `.github/copilot-instructions.md` if any new patterns emerged (already done by planning phase)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately ✅
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories ⚠️
- **User Story 1 (Phase 3)**: Depends on Foundational - MVP story, implement first 🎯
- **User Story 3 (Phase 5)**: Actually part of US1 implementation - P1 priority, interleaved with Phase 3
- **User Story 2 (Phase 4)**: Depends on Foundational - Independent of US1, can be done in parallel if desired
- **State Persistence (Phase 6)**: Depends on any user story being implemented
- **Performance (Phase 7)**: Depends on core implementation (Phases 3-6)
- **Documentation (Phase 8)**: Depends on all implementation phases

### User Story Dependencies

- **User Story 1 (P1)**: Core clockwise rotation - Foundation only ✅ INDEPENDENT
- **User Story 2 (P2)**: Counter-clockwise rotation - Foundation only ✅ INDEPENDENT  
- **User Story 3 (P1)**: Event handling - Actually integrated into US1/US2 implementation (not separate)

### Suggested Execution Order

**Sequential (Single Developer)**:
1. Phase 1: Setup (T001-T003)
2. Phase 2: Foundational (T004-T010) ⚠️ MUST COMPLETE
3. Phase 3: User Story 1 (T011-T028) 🎯 MVP - includes US3 event handling
4. Validate US1 works independently before proceeding
5. Phase 4: User Story 2 (T029-T037) - adds counter-clockwise
6. Phase 6: State Persistence & Edge Cases (T047-T060)
7. Phase 7: Performance & Polish (T061-T070)
8. Phase 8: Documentation (T071-T078)

**Parallel Opportunities**:
- T004-T006 (type definitions and utils) can run in parallel
- T008-T009 (separate hooks) can run in parallel
- T011-T013 (Card component) + T014-T015 (Playfield component) can run in parallel
- After US1 is complete, US2 (T029-T037) can be done by second developer
- T047-T051 (state management updates) can run in parallel
- T061-T070 (performance checks) are independent tests, can be parallelized

### Within Each User Story

User Story 1 (MVP):
1. Card + Playfield visual updates (T011-T015) - can be parallel
2. Keyboard handler implementation (T016-T020) - depends on hook from Phase 2
3. Manual validation (T021-T028) - sequential testing

User Story 2:
1. Add Q key handler (T029-T031) - extends existing keyboard handler
2. Manual validation (T032-T037) - sequential testing

---

## Parallel Example: Foundational Phase

```bash
# Developer A:
T004: Extend Playfield interface in app/lib/types/game.ts
T006: Create rotation utilities in app/lib/utils/rotation.ts

# Developer B:
T005: Update GameSessionRow interface in app/lib/types/game.ts
T008: Update useGameState hook in app/lib/hooks/useGameState.ts

# Developer C:
T009: Update useSupabase hook in app/lib/hooks/useSupabase.ts
T010: Update CardProps in app/lib/types/game.ts

# Then Developer A:
T007: Create useCardRotation hook (depends on T004, T006)
```

---

## Implementation Strategy

### MVP First (Recommended)

1. **Phase 1-2**: Setup + Foundational (T001-T010) → ~2 hours
2. **Phase 3**: User Story 1 only (T011-T028) → ~4 hours
3. **VALIDATE**: Test US1 independently, verify smooth animations, check performance
4. **DEMO**: At this point you have working clockwise rotation - can ship as v1 if needed!
5. **Phase 4**: Add User Story 2 (T029-T037) → ~1 hour (quick addition)
6. **Phases 6-8**: Refinement (T047-T078) → ~3 hours

**Total MVP Time**: ~10 hours for complete feature with all polish

### Incremental Delivery Milestones

1. **Milestone 1** (Foundational): Type system and state management ready
2. **Milestone 2** (MVP): Clockwise rotation works with E key → ✅ SHIPPABLE
3. **Milestone 3** (Full Feature): Counter-clockwise with Q key added
4. **Milestone 4** (Production Ready): All edge cases, performance validated, documented

### Validation Gates

- **After T010**: Foundation checkpoint - types compile, hooks import successfully
- **After T020**: US1 functional checkpoint - E key rotates cards
- **After T028**: US1 complete - all acceptance scenarios pass
- **After T037**: US2 complete - Q key works, cumulative rotations correct
- **After T060**: Edge cases handled - robust error handling
- **After T070**: Performance validated - meets all success criteria
- **After T078**: Feature complete - ready for PR

---

## Task Summary

**Total Tasks**: 78
- **Setup**: 3 tasks
- **Foundational**: 7 tasks (⚠️ BLOCKING)
- **User Story 1 (P1 - MVP)**: 18 tasks (includes validation)
- **User Story 2 (P2)**: 9 tasks (includes validation)  
- **User Story 3 (P1)**: 8 tasks (keyboard handling - integrated with US1/US2)
- **State Persistence**: 14 tasks (edge cases)
- **Performance**: 10 tasks (optimization & validation)
- **Documentation**: 8 tasks (finalization)

**Parallel Opportunities**: 15+ tasks marked [P]

**Independent Test Criteria**:
- US1: Hover + E key → clockwise rotation with animation
- US2: Hover + Q key → counter-clockwise rotation
- US3: No hover + Q/E → no action; hovering + Q/E → no browser defaults

**Suggested MVP**: Phases 1-3 only (T001-T028) = Core clockwise rotation
**Full Feature**: All phases (T001-T078) = Production-ready with all stories
