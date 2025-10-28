# Requirements Checklist: Card Drag and Drop

## Functional Requirements Status

### Drag Mechanics
- [ ] **FR-001**: System MUST detect mouse down event on any card (hand, playfield) to initiate drag
- [ ] **FR-002**: System MUST show visual feedback when drag starts (cursor change, card opacity, elevation)
- [ ] **FR-003**: System MUST track mouse position during drag and update card position in real-time
- [ ] **FR-004**: System MUST allow card to follow cursor smoothly at 60fps minimum during drag
- [ ] **FR-005**: System MUST detect mouse up event to complete drag and finalize card position
- [ ] **FR-006**: System MUST support ESC key to cancel drag and return card to original position
- [ ] **FR-007**: System MUST differentiate between click (no movement) and drag (movement threshold > 5px)
- [ ] **FR-008**: System MUST prevent text selection and other default behaviors during drag

### Hand to Playfield
- [ ] **FR-009**: System MUST allow dragging cards from hand container to playfield area
- [ ] **FR-010**: System MUST remove card from hand when successfully dropped on playfield
- [ ] **FR-011**: System MUST add card to playfield at exact mouse cursor position when dropped
- [ ] **FR-012**: System MUST cancel drag if card is dropped outside playfield (not over hand or playfield)
- [ ] **FR-013**: System MUST store playfield card positions as absolute coordinates (x, y in pixels)

### Playfield Positioning
- [ ] **FR-014**: System MUST support free-form positioning (no grid snapping) for all playfield cards
- [ ] **FR-015**: System MUST position cards relative to playfield container, not viewport
- [ ] **FR-016**: System MUST persist card positions to database after each drag completes
- [ ] **FR-017**: System MUST restore card positions from database on page load
- [ ] **FR-018**: System MUST clamp card positions to ensure cards remain within playfield bounds

### Playfield Reorganization
- [ ] **FR-019**: System MUST allow dragging existing playfield cards to new positions
- [ ] **FR-020**: System MUST maintain positions of non-dragged cards during drag operation
- [ ] **FR-021**: System MUST update only the dragged card's position when drag completes
- [ ] **FR-022**: System MUST allow dragging playfield cards back over hand area

### Z-Index Management
- [ ] **FR-023**: System MUST assign a unique z-index to each card when placed on playfield
- [ ] **FR-024**: System MUST increment z-index counter for each new card placement or repositioning
- [ ] **FR-025**: System MUST render cards in correct stacking order based on z-index values
- [ ] **FR-026**: System MUST bring dragged card to top of z-index stack when drag starts
- [ ] **FR-027**: System MUST persist z-index values to database with card positions
- [ ] **FR-028**: System MUST restore z-index values on page load to maintain stacking order

### Playfield to Hand
- [ ] **FR-029**: System MUST detect when playfield card is dragged over hand container
- [ ] **FR-030**: System MUST show visual feedback on hand container when card is dragged over it
- [ ] **FR-031**: System MUST remove card from playfield when dropped on hand container
- [ ] **FR-032**: System MUST add card to end of hand array when dropped on hand container
- [ ] **FR-033**: System MUST respect hand size limits if configured (reject drag if hand is full)

### Discard Mechanics
- [ ] **FR-034**: System MUST detect when card is dragged outside both playfield and hand areas
- [ ] **FR-035**: System MUST show visual feedback indicating card will be discarded
- [ ] **FR-036**: System MUST remove card from playfield when dropped outside valid areas
- [ ] **FR-037**: System MUST NOT add discarded card to hand or deck (permanent removal)
- [ ] **FR-038**: System MUST provide forgiving hit detection (small threshold at playfield boundaries)

### Performance & UX
- [ ] **FR-039**: System MUST maintain 60fps during drag operations
- [ ] **FR-040**: System MUST debounce position updates during drag to optimize performance
- [ ] **FR-041**: System MUST prevent dragging multiple cards simultaneously
- [ ] **FR-042**: System MUST hide ALT-hover preview during drag operations
- [ ] **FR-043**: System MUST show loading/saving indicator for database operations
- [ ] **FR-044**: System MUST handle drag operations without blocking UI interactions
- [ ] **FR-045**: Dragged card MUST render above all other cards during drag (highest z-index)

### Data Persistence
- [ ] **FR-046**: System MUST save playfield state after each successful drag operation
- [ ] **FR-047**: System MUST store card positions in database as part of playfield state
- [ ] **FR-048**: System MUST store z-index values in database as part of playfield state
- [ ] **FR-049**: System MUST use debounced auto-save (500ms delay) to avoid excessive database writes
- [ ] **FR-050**: System MUST handle save failures gracefully (show error, allow retry)

---

## Success Criteria Status

- [ ] **SC-001**: Drag operation initiates within 16ms of mouse down on card
- [ ] **SC-002**: Card position updates at 60fps (16.67ms per frame) during drag
- [ ] **SC-003**: Cards can be dragged from hand to playfield with 100% accuracy (drop at exact cursor position)
- [ ] **SC-004**: Playfield cards can be repositioned with 100% accuracy
- [ ] **SC-005**: Z-index updates correctly on every drag (most recently moved card is always on top)
- [ ] **SC-006**: Position data persists to database within 500ms of drag completion
- [ ] **SC-007**: All drag interactions work without breaking existing click interactions (drawing from deck, playing cards)
- [ ] **SC-008**: ESC key cancels drag 100% of the time within 16ms
- [ ] **SC-009**: Drag operations work correctly in all modern browsers (Chrome, Firefox, Safari, Edge)
- [ ] **SC-010**: Performance remains stable with 50+ cards on playfield (60fps maintained)
- [ ] **SC-011**: Cards maintain exact positions after page refresh (position restoration accuracy 100%)
- [ ] **SC-012**: Z-index stacking order is preserved across page refreshes
- [ ] **SC-013**: Drag functionality works without conflicts with ALT-hover preview feature
- [ ] **SC-014**: Drag visual feedback (opacity, cursor, elevation) is immediately visible on drag start
- [ ] **SC-015**: Drop zones (playfield, hand) have clear visual feedback with 100% accuracy
- [ ] **SC-016**: Lighthouse performance score remains 90+ with drag feature enabled
- [ ] **SC-017**: Accessibility: Cards can be moved using keyboard-only interactions (stretch goal)
- [ ] **SC-018**: Touch devices: Drag works with touch events on mobile/tablet devices (stretch goal)

---

## User Story Acceptance Status

### User Story 1: Drag Cards from Hand to Playfield (P1)
- [ ] User can click and hold on a hand card to start drag
- [ ] Card follows mouse cursor smoothly during drag
- [ ] Card is placed on playfield at drop position when released
- [ ] Card is removed from hand after successful drop
- [ ] Drag cancels if released outside playfield
- [ ] ESC key cancels drag and card stays in hand
- [ ] Card follows cursor without lag during rapid movement

### User Story 2: Free Positioning on Playfield (P1)
- [ ] Card is placed at exact pixel coordinates where dropped
- [ ] Multiple cards can be placed at any positions independently
- [ ] Cards maintain exact positions (no auto-reorganization)
- [ ] Card positions are restored after page refresh
- [ ] Positions are relative to playfield container (not viewport)

### User Story 3: Drag Cards Within Playfield (P2)
- [ ] Playfield cards become draggable on click and hold
- [ ] Card follows cursor smoothly during drag
- [ ] Card is placed at new position on release
- [ ] Other playfield cards remain in their positions
- [ ] ESC returns card to original position
- [ ] Card can be dragged outside playfield and back

### User Story 4: Z-Index Management (P2)
- [ ] Card B renders on top when dropped on card A
- [ ] Dragged card moves to top of z-index stack
- [ ] Cards render in correct stacking order
- [ ] Z-index is incremental and unique for session
- [ ] Click targets topmost card in overlapping cards
- [ ] Z-index order is preserved after page refresh

### User Story 5: Drag Cards from Playfield to Hand (P3)
- [ ] Hand area shows visual feedback when card is dragged over it
- [ ] Card is removed from playfield and added to hand on drop
- [ ] Card appears at end of hand (rightmost position)
- [ ] Card remains on playfield if released outside both areas
- [ ] Drag is prevented if hand is at max size

### User Story 6: Drag Cards Off Playfield to Discard (P3)
- [ ] Visual feedback indicates card will be discarded
- [ ] Card is removed from playfield on release
- [ ] Card is not added to hand or deck (permanent removal)
- [ ] ESC cancels discard and returns card to position
- [ ] Forgiving threshold prevents accidental discards at edges

---

## Edge Cases Status

- [ ] User drags card while holding ALT key (preview active)
- [ ] Window is resized during drag
- [ ] User has multiple browser tabs open and drags across tabs
- [ ] Touch input on mobile devices
- [ ] Card dropped at negative coordinates or beyond bounds
- [ ] Rapidly starting and canceling multiple drags
- [ ] Two cards dropped at exact same coordinates
- [ ] Dragging cards when playfield is scrolled
- [ ] User refreshes browser mid-drag
- [ ] Network latency causes save delay
- [ ] Accessibility (keyboard-only users)
- [ ] Card image fails to load during drag
- [ ] Performance with 50+ cards on playfield being dragged

---

## Cross-Browser Testing Status

- [ ] Chrome (Windows) - All features working
- [ ] Chrome (Mac) - All features working
- [ ] Firefox (Windows) - All features working
- [ ] Firefox (Mac) - All features working
- [ ] Safari (Mac) - All features working
- [ ] Edge (Windows) - All features working

---

## Performance Testing Status

- [ ] Drag maintains 60fps with 10 cards on playfield
- [ ] Drag maintains 60fps with 25 cards on playfield
- [ ] Drag maintains 60fps with 50 cards on playfield
- [ ] Database save completes within 500ms
- [ ] Position restoration completes within 200ms on page load
- [ ] Memory usage remains under 50MB with 50 cards
- [ ] Lighthouse performance score >= 90

---

## Documentation Status

- [ ] spec.md complete with all requirements
- [ ] plan.md complete with implementation approach
- [ ] tasks.md complete with task breakdown
- [ ] data-model.md complete with state structure
- [ ] research.md complete with design decisions
- [ ] quickstart.md complete with usage guide
- [ ] contracts/card-drag-drop.ts complete with type definitions
- [ ] Code comments added to complex logic
- [ ] README updated with feature description
- [ ] Demo video or GIF created (optional)

---

## Definition of Done

Feature is considered complete when:
- [ ] All functional requirements (FR-001 to FR-050) are implemented and tested
- [ ] All success criteria (SC-001 to SC-018) are met
- [ ] All user story acceptance criteria are validated
- [ ] All edge cases are handled gracefully
- [ ] Cross-browser testing passes on all major browsers
- [ ] Performance testing meets all targets (60fps, save time, load time)
- [ ] All documentation is complete and up-to-date
- [ ] Code is reviewed and approved
- [ ] No blocking bugs or regressions
- [ ] Feature is merged to main branch

---

**Completion Progress**: 0/50 Functional Requirements, 0/18 Success Criteria, 0/6 User Stories

**Last Updated**: October 28, 2025  
**Status**: Ready for Implementation
