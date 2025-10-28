# Tasks: Card Hover Preview with ALT Key

**Feature**: `003-card-hover-preview`  
**Branch**: `003-card-hover-preview`  
**Input**: Design documents from `/specs/003-card-hover-preview/`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to repository root `c:\web\cards\`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize type contracts that all user stories will depend on

- [ ] T001 Copy type contracts from specs to codebase: `cp specs/003-card-hover-preview/contracts/card-preview.ts app/lib/types/card-preview.ts`
- [ ] T002 Verify TypeScript compilation: Run `npm run build` to ensure no type errors

**Checkpoint**: Type contracts available - implementation can begin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [P] Create CardPreviewProvider Context in `app/components/game/CardPreviewProvider.tsx` with ALT key state management using global keydown/keyup listeners
- [ ] T004 [P] Create useAltKey hook in `app/lib/hooks/useAltKey.ts` to consume CardPreviewProvider context and return isAltPressed state
- [ ] T005 [P] Create calculatePreviewPosition utility function in `app/lib/utils/preview-position.ts` implementing viewport bounds checking algorithm
- [ ] T006 Wrap game page with CardPreviewProvider in `app/game/page.tsx` to provide global ALT key state to all cards

**Checkpoint**: Foundation ready - ALT key detection working, position calculation available, context provider active

---

## Phase 3: User Story 1 - Basic ALT+Hover Preview (Priority: P1) 🎯 MVP

**Goal**: Implement core preview functionality - preview appears when ALT+hovering card, follows mouse, and dismisses on ALT release or mouse leave

**Independent Test**: Manually test by:
1. Hold ALT key and hover over any card → Preview appears near cursor
2. Move mouse while holding ALT and hovering card → Preview follows smoothly
3. Release ALT key → Preview disappears immediately
4. Hold ALT, hover card, move mouse off card → Preview disappears
5. Hold ALT again, hover same card → Preview reappears

**Success Criteria**:
- Preview appears within 50ms of ALT+hover
- Preview follows mouse at 60fps (smooth, no jitter)
- Preview dismisses within 16ms of ALT release or mouse leave
- No interference with existing card interactions

### Implementation for User Story 1

- [ ] T007 [P] [US1] Create useCardPreview hook in `app/lib/hooks/useCardPreview.ts` managing PreviewState (isActive, card, hoveredCardId, mouseX, mouseY) with showPreview and hidePreview functions
- [ ] T008 [P] [US1] Create CardPreview component in `app/components/game/CardPreview.tsx` using React Portal to render preview at document.body with fixed positioning and z-index 9999
- [ ] T009 [US1] Implement requestAnimationFrame throttling in useCardPreview hook for mouse position updates (limit to 60fps)
- [ ] T010 [US1] Implement lazy mousemove listener attachment in useCardPreview - only attach when preview is active, remove when hidden
- [ ] T011 [US1] Add ALT key state monitoring in useCardPreview - hide preview immediately when isAltPressed becomes false
- [ ] T012 [US1] Memoize CardPreview component using React.memo to prevent unnecessary re-renders
- [ ] T013 [US1] Update Card component in `app/components/game/Card.tsx` - add onMouseEnter handler that calls showPreview when isAltPressed is true
- [ ] T014 [US1] Update Card component in `app/components/game/Card.tsx` - add onMouseLeave handler that calls hidePreview with cardId
- [ ] T015 [US1] Integrate CardPreview rendering in `app/game/page.tsx` - render CardPreview when previewState.isActive is true
- [ ] T016 [US1] Add passive flag to mousemove event listener in useCardPreview for browser performance optimization
- [ ] T017 [US1] Style CardPreview with shadow-2xl and pointer-events-none to match design and not block mouse events
- [ ] T018 [US1] Manual validation: Test preview appearance, mouse following, ALT release dismissal, mouse leave dismissal, re-toggle behavior

**Checkpoint**: User Story 1 complete - basic preview functionality working with smooth performance

---

## Phase 4: User Story 2 - Smart Viewport Positioning (Priority: P2)

**Goal**: Implement intelligent preview positioning that automatically adjusts to keep preview 100% visible within viewport bounds, especially near screen edges

**Independent Test**: Manually test by:
1. ALT+hover card near right viewport edge → Preview appears to LEFT of cursor
2. ALT+hover card near left viewport edge → Preview appears to RIGHT of cursor
3. ALT+hover card near top viewport edge → Preview adjusts DOWN
4. ALT+hover card near bottom viewport edge → Preview adjusts UP
5. ALT+hover card in viewport corners → Preview positions to stay 100% visible
6. Move mouse near viewport edge while preview showing → Preview repositions smoothly

**Success Criteria**:
- 0% clipping in all edge cases
- Preview always 100% visible within viewport
- Smooth repositioning as mouse approaches edges

### Implementation for User Story 2

- [ ] T019 [US2] Integrate calculatePreviewPosition into useCardPreview hook - call with mouseX, mouseY, viewport dimensions, and preview dimensions (300×420)
- [ ] T020 [US2] Pass calculated PreviewPosition to CardPreview component for rendering at correct coordinates
- [ ] T021 [US2] Implement DEFAULT_PREVIEW_OFFSET constant (20px) in card-preview types and use in position calculations
- [ ] T022 [US2] Add viewport dimension tracking in useCardPreview - read window.innerWidth and window.innerHeight
- [ ] T023 [US2] Implement window resize handler in useCardPreview to update viewport dimensions and recalculate position
- [ ] T024 [US2] Add position clamping as final safety check in calculatePreviewPosition - ensure x >= 0, y >= 0, x+width <= viewport, y+height <= viewport
- [ ] T025 [US2] Manual validation: Test preview positioning at all viewport edges (right, left, top, bottom) and corners
- [ ] T026 [US2] Manual validation: Resize browser window while preview active - verify preview adjusts or hides gracefully

**Checkpoint**: User Story 2 complete - preview intelligently positions itself to stay within viewport

---

## Phase 5: User Story 3 - Hand Card Preview Overlay (Priority: P3)

**Goal**: Ensure preview renders as top-level overlay above all game elements including hand container (z-index: 50), maintaining all P1 and P2 behaviors

**Independent Test**: Manually test by:
1. ALT+hover card in hand at bottom of screen → Preview appears as overlay above hand container
2. Verify preview does not clip inside hand container boundaries
3. Verify preview renders above all other game elements (deck, playfield)
4. ALT+hover hand card near bottom edge → Preview positions above cursor to avoid bottom clipping
5. Test all P1 behaviors (show, hide, follow) with hand cards
6. Test all P2 behaviors (edge positioning) with hand cards

**Success Criteria**:
- Preview z-index renders above hand container (z-index: 50)
- Preview works identically for hand, deck, and playfield cards
- No visual conflicts or stacking context issues

### Implementation for User Story 3

- [ ] T027 [US3] Verify PREVIEW_Z_INDEX constant is 9999 in card-preview types (above hand z-index of 50)
- [ ] T028 [US3] Update CardPreview component to ensure Portal renders to document.body (not within any parent container)
- [ ] T029 [US3] Add position: fixed style to preview container in CardPreview component to position relative to viewport, not parent
- [ ] T030 [US3] Manual validation: ALT+hover cards in hand - verify preview renders above hand container
- [ ] T031 [US3] Manual validation: ALT+hover cards in playfield - verify preview renders above playfield elements
- [ ] T032 [US3] Manual validation: ALT+hover cards in deck - verify preview renders above deck
- [ ] T033 [US3] Manual validation: Test viewport positioning (US2) with hand cards near bottom edge - verify preview positions above cursor
- [ ] T034 [US3] Verify Card component preview handlers work for all card locations (check Card.tsx location prop: 'deck', 'hand', 'playfield')

**Checkpoint**: User Story 3 complete - preview works consistently across all card locations with proper overlay rendering

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, validation, and final polish across all user stories

- [ ] T035 [P] Add Tailwind transition classes to CardPreview for smooth fade-in/fade-out animations
- [ ] T036 [P] Verify dark mode support - ensure preview styling respects dark: utilities and matches existing Card dark mode
- [ ] T037 [P] Test preview with cards that have failed image loads - verify fallback card design displays in preview
- [ ] T038 Validate event listener count during preview display - confirm maximum 3 listeners (2 keyboard + 1 mousemove)
- [ ] T039 Profile preview performance with React DevTools - verify no unnecessary re-renders, confirm 60fps updates
- [ ] T040 Test rapid ALT toggling (10+ times per second) - verify no performance degradation or memory leaks
- [ ] T041 Verify existing card interactions work - test card click, keyboard navigation, drag-drop (if implemented) with preview feature active
- [ ] T042 Cross-browser testing - verify preview works in Chrome, Firefox, Safari, Edge
- [ ] T043 Test edge cases: ALT+hover while dragging, window resize during preview, multiple card overlap, disabled cards
- [ ] T044 Run Lighthouse performance audit on game page - verify score remains 90+ with preview feature enabled
- [ ] T045 Document feature usage in quickstart.md (already exists) - ensure developer guide is accurate
- [ ] T046 Final validation using quickstart.md testing checklist - verify all 13 test scenarios pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - Core preview functionality
- **User Story 2 (Phase 4)**: Depends on User Story 1 (Phase 3) - Enhances positioning logic
- **User Story 3 (Phase 5)**: Depends on User Story 1 (Phase 3) - Can be done in parallel with US2 if desired
- **Polish (Phase 6)**: Depends on all user stories (Phases 3-5) being complete

### User Story Independence

- **User Story 1 (P1)**: Independent - provides core preview functionality
- **User Story 2 (P2)**: Depends on US1 - enhances existing preview with smart positioning
- **User Story 3 (P3)**: Depends on US1 - verifies overlay behavior across all card locations (could be parallel with US2)

**Note**: US2 and US3 could potentially be implemented in parallel by different developers since:
- US2 focuses on positioning algorithm (utils layer)
- US3 focuses on rendering and z-index (component layer)
- Both build on US1 foundation

### Within Each User Story

**User Story 1 (Core Preview)**:
1. T007-T008 [P] - Hook and Component creation (parallel)
2. T009-T012 - Hook optimizations (sequential, build on T007)
3. T013-T014 - Card component integration (sequential, needs hook)
4. T015-T017 - Final integration and styling
5. T018 - Manual validation

**User Story 2 (Positioning)**:
1. T019-T021 - Position calculation integration
2. T022-T024 - Viewport tracking and safety
3. T025-T026 - Manual validation

**User Story 3 (Overlay)**:
1. T027-T029 - Z-index and rendering verification
2. T030-T034 - Manual validation across all card locations

### Parallel Opportunities

**Within Setup (Phase 1)**:
- All tasks sequential (only 2 tasks)

**Within Foundational (Phase 2)**:
- T003, T004, T005 [P] - Different files, can work in parallel
- T006 depends on T003 (needs provider)

**Within User Story 1**:
- T007, T008 [P] - Hook and component can be built simultaneously

**Across User Stories** (if team capacity allows):
- After US1 completes: US2 and US3 can proceed in parallel

**Within Polish**:
- T035, T036, T037 [P] - Independent validation tasks

---

## Parallel Example: User Story 1

```bash
# These can run in parallel (different files):
Task T007: Create useCardPreview hook in app/lib/hooks/useCardPreview.ts
Task T008: Create CardPreview component in app/components/game/CardPreview.tsx

# Once both complete, continue with:
Task T009: Add RAF throttling to useCardPreview
Task T010: Add lazy listener to useCardPreview
# ... etc
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Fastest path to working feature**:

1. ✅ Complete Phase 1: Setup (T001-T002) - 10 minutes
2. ✅ Complete Phase 2: Foundational (T003-T006) - 1 hour
3. ✅ Complete Phase 3: User Story 1 (T007-T018) - 2-3 hours
4. **STOP and VALIDATE**: Manual testing per US1 test criteria
5. **DEMO**: Show working ALT+hover preview
6. **OPTIONAL**: Deploy/merge if satisfied with core functionality

**Time Estimate**: 4-5 hours for complete MVP

### Incremental Delivery

**Build value progressively**:

1. **Sprint 1**: Setup + Foundational + US1 → **MVP deployed** (core preview works)
2. **Sprint 2**: Add US2 → **Enhanced positioning** (no more edge clipping)
3. **Sprint 3**: Add US3 + Polish → **Complete feature** (all card locations, optimized)

Each sprint delivers independently valuable functionality.

### Parallel Team Strategy

**With 2-3 developers**:

**Week 1**:
- All: Complete Setup + Foundational together (T001-T006)
- Once foundational done:
  - Dev A: User Story 1 (T007-T018)
  - Dev B: Can prepare for US2 by reviewing positioning algorithm

**Week 2**:
- Dev A: User Story 2 (T019-T026)
- Dev B: User Story 3 (T027-T034) - can start in parallel with US2

**Week 3**:
- All: Polish phase together (T035-T046)

---

## Performance Validation Checklist

Per constitution and spec requirements, verify:

- [ ] Preview appears within 50ms of ALT+hover (SC-001)
- [ ] Preview updates at 60fps / 16.67ms per frame (SC-002)
- [ ] Preview never extends beyond viewport (SC-003)
- [ ] Preview dismisses within 16ms (SC-004)
- [ ] Can toggle 10+ times/sec without degradation (SC-005)
- [ ] Maximum 3 event listeners active (SC-006)
- [ ] Preview z-index above all game elements (SC-007)
- [ ] Preview maintains 5:7 aspect ratio (SC-008)
- [ ] Existing card interactions work identically (SC-009)
- [ ] Works on all card locations (SC-010)
- [ ] Lighthouse score remains 90+ (SC-011)
- [ ] Consistent styling with design system (SC-012)
- [ ] Visual appearance maintains consistency (SC-013)

---

## Notes

- **[P] tasks**: Different files, no dependencies - safe to parallelize
- **[Story] labels**: Map tasks to user stories for traceability
- **Manual testing**: Focus on UX, performance, and cross-browser compatibility
- **No automated tests**: Per project requirements, manual validation sufficient
- **TypeScript strict mode**: All code must compile without errors or `any` types
- **Constitution compliance**: Type safety, component architecture, UX consistency, performance requirements all enforced
- **Commit strategy**: Commit after each task or logical group (e.g., after each user story phase)
- **Validation gates**: Stop at each checkpoint to validate story independently before proceeding

---

## Task Summary

- **Total Tasks**: 46 tasks
- **Setup**: 2 tasks
- **Foundational**: 4 tasks
- **User Story 1 (P1)**: 12 tasks
- **User Story 2 (P2)**: 8 tasks
- **User Story 3 (P3)**: 8 tasks
- **Polish**: 12 tasks
- **Parallel Opportunities**: 9 tasks marked [P]
- **MVP Scope**: Phases 1-3 (18 tasks, ~4-5 hours)

---

## References

- **Specification**: [spec.md](./spec.md)
- **Implementation Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Type Contracts**: [contracts/card-preview.ts](./contracts/card-preview.ts)
- **Developer Guide**: [quickstart.md](./quickstart.md)
- **Constitution**: [../../.specify/memory/constitution.md](../../.specify/memory/constitution.md)
