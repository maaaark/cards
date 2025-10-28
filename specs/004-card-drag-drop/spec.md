/speckit.tasks# Feature Specification: Card Drag and Drop

**Feature Branch**: `004-card-drag-drop`  
**Created**: October 28, 2025  
**Status**: Draft  
**Input**: User description: "I want a new feature where I can drag cards from my hand into the playfield. Also I want to be able to move the cards around on the playfield and also drag them back to my hand and off the playboard. The cards can be placed anywhere on the playfield by dragging with the mouse. When I drag one card on another card, the last card I moved there will shown on top."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drag Cards from Hand to Playfield (Priority: P1)

A player wants to play cards from their hand onto the playfield by dragging them. They click and hold on a card in their hand, drag it onto the playfield area, and release to place it at the exact position where they dropped it.

**Why this priority**: This is the core functionality that enables drag-and-drop card play. It replaces the current click-to-play mechanic with an intuitive drag interaction. This is essential and must work before any other drag features.

**Independent Test**: Can be fully tested by clicking a card in hand, dragging it onto the playfield, releasing mouse button, and verifying the card appears at the drop location with proper positioning. The card should be removed from hand.

**Acceptance Scenarios**:

1. **Given** player has cards in hand, **When** user clicks and holds on a hand card, **Then** card becomes draggable with visual feedback (opacity, cursor change)
2. **Given** user is dragging a hand card, **When** mouse moves over playfield area, **Then** dragged card follows mouse cursor smoothly
3. **Given** user is dragging a hand card over playfield, **When** user releases mouse button, **Then** card is placed on playfield at exact drop position
4. **Given** card is successfully dropped on playfield, **When** placement completes, **Then** card is removed from hand
5. **Given** user starts dragging a hand card, **When** user releases mouse button outside playfield (e.g., over header, other UI), **Then** drag cancels and card stays in hand
6. **Given** user starts dragging a hand card, **When** user presses ESC key, **Then** drag cancels and card returns to hand
7. **Given** user is dragging a card, **When** mouse moves rapidly, **Then** card follows cursor without lag or stuttering

---

### User Story 2 - Free Positioning on Playfield (Priority: P1)

A player wants to place cards anywhere on the playfield, not just in a grid. They drag cards to specific positions to organize their board state (e.g., grouping related cards, creating strategic layouts).

**Why this priority**: This is part of the core drag-drop functionality from P1. Cards must be positioned freely (absolute positioning) rather than snapping to a grid. Essential for the user's requested feature.

**Independent Test**: Can be tested by dragging multiple cards onto the playfield at various positions and verifying each card maintains its exact drop position (pixel-perfect placement) without snapping to a grid.

**Acceptance Scenarios**:

1. **Given** card is being dropped on playfield, **When** user releases mouse, **Then** card position is set to exact pixel coordinates of mouse cursor
2. **Given** multiple cards are on playfield, **When** user drops a new card, **Then** new card can be placed at any position independent of existing cards
3. **Given** cards are positioned on playfield, **When** user views the playfield, **Then** each card maintains its exact position (no automatic reorganization)
4. **Given** card is placed on playfield, **When** page is refreshed, **Then** card position is restored from saved state
5. **Given** playfield has cards at various positions, **When** user inspects positions, **Then** positions are stored relative to playfield container (not viewport)

---

### User Story 3 - Drag Cards Within Playfield (Priority: P2)

A player wants to reorganize cards already on the playfield. They click and drag existing playfield cards to new positions, adjusting their layout as the game progresses.

**Why this priority**: Enhances playfield usability but requires P1 drag mechanics to be working first. Can be implemented after basic hand-to-playfield dragging is complete.

**Independent Test**: Can be tested by placing cards on playfield, then clicking and dragging them to new positions, verifying smooth movement and accurate placement without affecting other cards.

**Acceptance Scenarios**:

1. **Given** cards are on playfield, **When** user clicks and holds a playfield card, **Then** card becomes draggable with visual feedback
2. **Given** user is dragging a playfield card, **When** mouse moves, **Then** card follows cursor smoothly without jumping
3. **Given** user is dragging a playfield card, **When** user releases mouse button, **Then** card is placed at new position on playfield
4. **Given** user is dragging a playfield card, **When** card is moved, **Then** other playfield cards remain in their positions (no auto-rearranging)
5. **Given** user starts dragging playfield card, **When** user presses ESC key, **Then** card returns to its original position
6. **Given** playfield card is being dragged, **When** mouse moves outside playfield bounds, **Then** drag continues and card can be dropped back on playfield or moved to hand

---

### User Story 4 - Z-Index Management (Stacking Order) (Priority: P2)

A player drags a card onto another card's position. The most recently moved card appears on top, creating a clear visual hierarchy for overlapping cards.

**Why this priority**: Essential for managing overlapping cards but depends on P1 and P2 drag mechanics working. Can be implemented after basic positioning is solid.

**Independent Test**: Can be tested by dragging card A to position (100, 100), then dragging card B to the same position, and verifying card B renders on top. Then dragging card A again to verify it moves to the top.

**Acceptance Scenarios**:

1. **Given** card A is at position on playfield, **When** user drops card B at overlapping position, **Then** card B renders on top of card A
2. **Given** multiple cards overlap, **When** user drags card A again, **Then** card A moves to top of z-index stack
3. **Given** cards have different z-index values, **When** user views playfield, **Then** cards render in correct stacking order (higher z-index on top)
4. **Given** card is dropped on playfield, **When** z-index is assigned, **Then** z-index is incremental and never reused for current session
5. **Given** cards are overlapping, **When** user clicks on a card, **Then** click targets the topmost (highest z-index) card
6. **Given** page is refreshed, **When** cards are restored, **Then** z-index stacking order is preserved

---

### User Story 5 - Drag Cards from Playfield to Hand (Priority: P3)

A player wants to return cards from the playfield back to their hand. They drag a playfield card down to the hand area and release to add it back to their hand.

**Why this priority**: Nice-to-have feature that enhances flexibility but not critical for initial release. Requires P1-P2 to be complete and working smoothly.

**Independent Test**: Can be tested by dragging a playfield card down to the hand container and verifying it's removed from playfield and added to hand in the correct position.

**Acceptance Scenarios**:

1. **Given** cards are on playfield, **When** user drags a playfield card over hand area, **Then** hand area shows visual feedback (highlight, border)
2. **Given** user is dragging playfield card over hand, **When** user releases mouse button, **Then** card is removed from playfield and added to hand
3. **Given** card is returned to hand, **When** card is added, **Then** card appears at end of hand (rightmost position)
4. **Given** user is dragging playfield card, **When** user releases mouse outside both playfield and hand (e.g., over deck), **Then** card remains on playfield (drag cancels)
5. **Given** hand has maximum size limit set, **When** user tries to drag card to hand at max size, **Then** drag is prevented or card returns to playfield

---

### User Story 6 - Drag Cards Off Playfield to Discard (Priority: P3)

A player wants to remove cards from the game by dragging them off the playfield. They drag a card outside the playfield boundaries and release to discard it (removing from playfield without adding to hand).

**Why this priority**: Optional feature that provides cleanup functionality. Can be added after core drag mechanics are stable and well-tested.

**Independent Test**: Can be tested by dragging a playfield card outside playfield boundaries (to the sides, top, or bottom but not over hand) and verifying card is removed from playfield and not added to hand.

**Acceptance Scenarios**:

1. **Given** user is dragging playfield card, **When** mouse moves outside playfield bounds, **Then** visual feedback indicates card will be discarded (e.g., red highlight, discard icon)
2. **Given** user drags playfield card outside playfield, **When** user releases mouse button, **Then** card is removed from playfield
3. **Given** card is dragged off playfield, **When** card is removed, **Then** card is not added to hand or deck (permanent discard)
4. **Given** card is being dragged off playfield, **When** user presses ESC, **Then** drag cancels and card returns to original position
5. **Given** user accidentally drags card near edge, **When** mouse is within small threshold (e.g., 50px) of playfield boundary, **Then** card is still considered "on playfield" (forgiving hit detection)

---

### Edge Cases

- What happens when user drags a card while holding ALT key (preview active)? (Preview should hide during drag, reappear after drag completes)
- How does system handle dragging while window is being resized? (Drag should cancel or positions should be recalculated)
- What happens when user has multiple browser tabs open and drags across tabs? (Drag should cancel when focus is lost)
- How does system handle touch input on mobile devices? (Should work with touch events analogous to mouse events)
- What happens when a card is dropped at negative coordinates or beyond playfield bounds? (Position should be clamped to valid playfield area)
- How does system handle rapidly starting and canceling multiple drags? (Each drag should be independent, no state corruption)
- What happens when two cards are dropped at exact same coordinates? (Z-index management ensures correct stacking order)
- How does system handle dragging cards when playfield is scrolled? (Positions should account for scroll offset)
- What happens when user drags a card then refreshes browser mid-drag? (Drag should cancel, state should be persisted before drag started)
- What happens when network latency causes save delay? (Local state updates immediately, shows loading state if needed)
- How does system handle accessibility (keyboard-only users)? (Should provide keyboard alternative for moving cards)
- What happens when card image fails to load during drag? (Should show fallback card design during drag)
- How does system handle performance with 50+ cards on playfield being dragged? (Should maintain 60fps, optimize rendering)

## Requirements *(mandatory)*

### Functional Requirements

#### Drag Mechanics
- **FR-001**: System MUST detect mouse down event on any card (hand, playfield) to initiate drag
- **FR-002**: System MUST show visual feedback when drag starts (cursor change, card opacity, elevation)
- **FR-003**: System MUST track mouse position during drag and update card position in real-time
- **FR-004**: System MUST allow card to follow cursor smoothly at 60fps minimum during drag
- **FR-005**: System MUST detect mouse up event to complete drag and finalize card position
- **FR-006**: System MUST support ESC key to cancel drag and return card to original position
- **FR-007**: System MUST differentiate between click (no movement) and drag (movement threshold > 5px)
- **FR-008**: System MUST prevent text selection and other default behaviors during drag

#### Hand to Playfield
- **FR-009**: System MUST allow dragging cards from hand container to playfield area
- **FR-010**: System MUST remove card from hand when successfully dropped on playfield
- **FR-011**: System MUST add card to playfield at exact mouse cursor position when dropped
- **FR-012**: System MUST cancel drag if card is dropped outside playfield (not over hand or playfield)
- **FR-013**: System MUST store playfield card positions as absolute coordinates (x, y in pixels)

#### Playfield Positioning
- **FR-014**: System MUST support free-form positioning (no grid snapping) for all playfield cards
- **FR-015**: System MUST position cards relative to playfield container, not viewport
- **FR-016**: System MUST persist card positions to database after each drag completes
- **FR-017**: System MUST restore card positions from database on page load
- **FR-018**: System MUST clamp card positions to ensure cards remain within playfield bounds

#### Playfield Reorganization
- **FR-019**: System MUST allow dragging existing playfield cards to new positions
- **FR-020**: System MUST maintain positions of non-dragged cards during drag operation
- **FR-021**: System MUST update only the dragged card's position when drag completes
- **FR-022**: System MUST allow dragging playfield cards back over hand area

#### Z-Index Management
- **FR-023**: System MUST assign a unique z-index to each card when placed on playfield
- **FR-024**: System MUST increment z-index counter for each new card placement or repositioning
- **FR-025**: System MUST render cards in correct stacking order based on z-index values
- **FR-026**: System MUST bring dragged card to top of z-index stack when drag starts
- **FR-027**: System MUST persist z-index values to database with card positions
- **FR-028**: System MUST restore z-index values on page load to maintain stacking order

#### Playfield to Hand
- **FR-029**: System MUST detect when playfield card is dragged over hand container
- **FR-030**: System MUST show visual feedback on hand container when card is dragged over it
- **FR-031**: System MUST remove card from playfield when dropped on hand container
- **FR-032**: System MUST add card to end of hand array when dropped on hand container
- **FR-033**: System MUST respect hand size limits if configured (reject drag if hand is full)

#### Discard Mechanics
- **FR-034**: System MUST detect when card is dragged outside both playfield and hand areas
- **FR-035**: System MUST show visual feedback indicating card will be discarded
- **FR-036**: System MUST remove card from playfield when dropped outside valid areas
- **FR-037**: System MUST NOT add discarded card to hand or deck (permanent removal)
- **FR-038**: System MUST provide forgiving hit detection (small threshold at playfield boundaries)

#### Performance & UX
- **FR-039**: System MUST maintain 60fps during drag operations
- **FR-040**: System MUST debounce position updates during drag to optimize performance
- **FR-041**: System MUST prevent dragging multiple cards simultaneously
- **FR-042**: System MUST hide ALT-hover preview during drag operations
- **FR-043**: System MUST show loading/saving indicator for database operations
- **FR-044**: System MUST handle drag operations without blocking UI interactions
- **FR-045**: Dragged card MUST render above all other cards during drag (highest z-index)

#### Data Persistence
- **FR-046**: System MUST save playfield state after each successful drag operation
- **FR-047**: System MUST store card positions in database as part of playfield state
- **FR-048**: System MUST store z-index values in database as part of playfield state
- **FR-049**: System MUST use debounced auto-save (500ms delay) to avoid excessive database writes
- **FR-050**: System MUST handle save failures gracefully (show error, allow retry)

### Key Entities

- **Drag State**: Tracks active drag operation (isDragging, draggedCardId, dragStartPosition, currentPosition, dragSource)
- **Card Position**: Absolute coordinates for playfield cards (cardId, x, y, zIndex)
- **Playfield Bounds**: Dimensions and position of playfield container (width, height, left, top)
- **Drop Zone**: Areas where cards can be dropped (playfield, hand, discard) with hit detection boundaries
- **Z-Index Counter**: Incrementing value to assign unique stacking order to each card placement

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Drag operation initiates within 16ms of mouse down on card
- **SC-002**: Card position updates at 60fps (16.67ms per frame) during drag
- **SC-003**: Cards can be dragged from hand to playfield with 100% accuracy (drop at exact cursor position)
- **SC-004**: Playfield cards can be repositioned with 100% accuracy
- **SC-005**: Z-index updates correctly on every drag (most recently moved card is always on top)
- **SC-006**: Position data persists to database within 500ms of drag completion
- **SC-007**: All drag interactions work without breaking existing click interactions (drawing from deck, playing cards)
- **SC-008**: ESC key cancels drag 100% of the time within 16ms
- **SC-009**: Drag operations work correctly in all modern browsers (Chrome, Firefox, Safari, Edge)
- **SC-010**: Performance remains stable with 50+ cards on playfield (60fps maintained)
- **SC-011**: Cards maintain exact positions after page refresh (position restoration accuracy 100%)
- **SC-012**: Z-index stacking order is preserved across page refreshes
- **SC-013**: Drag functionality works without conflicts with ALT-hover preview feature
- **SC-014**: Drag visual feedback (opacity, cursor, elevation) is immediately visible on drag start
- **SC-015**: Drop zones (playfield, hand) have clear visual feedback with 100% accuracy
- **SC-016**: Lighthouse performance score remains 90+ with drag feature enabled
- **SC-017**: Accessibility: Cards can be moved using keyboard-only interactions (stretch goal)
- **SC-018**: Touch devices: Drag works with touch events on mobile/tablet devices (stretch goal)

## Technical Architecture *(optional)*

### Component Changes

**Card Component (`Card.tsx`)**
- Add drag event handlers (onMouseDown, onMouseMove, onMouseUp)
- Add drag state styling (opacity, cursor, elevation during drag)
- Add z-index style from playfield position data
- Render with absolute positioning when on playfield

**Hand Component (`Hand.tsx`)**
- Add drop zone detection for accepting cards from playfield
- Add visual feedback for valid drop target
- Update hand state when card is dropped from playfield

**Playfield Component (`Playfield.tsx`)**
- Replace CSS Grid with absolute positioning container
- Add drop zone detection for accepting cards from hand
- Render cards with absolute positions (x, y from state)
- Implement forgiving boundaries for off-playfield discard
- Add visual feedback for drag operations

### New Hooks

**`useDragAndDrop.ts`**
```typescript
interface DragState {
  isDragging: boolean;
  draggedCardId: string | null;
  draggedCardSource: 'hand' | 'playfield' | null;
  startPosition: { x: number; y: number } | null;
  currentPosition: { x: number; y: number } | null;
  offset: { x: number; y: number };
}

interface UseDragAndDropReturn {
  dragState: DragState;
  startDrag: (cardId: string, source: 'hand' | 'playfield', event: React.MouseEvent) => void;
  updateDragPosition: (event: MouseEvent) => void;
  endDrag: (event: MouseEvent) => void;
  cancelDrag: () => void;
}
```

### State Updates

**GameState Interface Updates** (in `game.ts`)
```typescript
interface CardPosition {
  cardId: string;
  x: number;
  y: number;
  zIndex: number;
}

interface Playfield {
  cards: Card[];
  positions: Map<string, CardPosition>; // Changed from optional to required
  nextZIndex: number; // New: Track next available z-index
}
```

### Database Schema Updates

**`game_sessions` table updates**
```sql
-- playfield_state JSONB structure updated:
{
  "cards": [...],
  "positions": {
    "card-id-1": { "x": 100, "y": 200, "zIndex": 1 },
    "card-id-2": { "x": 300, "y": 150, "zIndex": 2 }
  },
  "nextZIndex": 3
}
```

## Dependencies & Risks *(optional)*

### Dependencies
- React 19 DnD patterns (use native mouse events, not libraries)
- Existing game state management (`useGameState` hook)
- Existing Supabase persistence layer
- CSS absolute positioning and z-index
- Playfield container dimensions (for boundary detection)

### Risks
- **Performance**: Dragging with 50+ cards may cause frame drops
  - *Mitigation*: Use CSS transforms for positioning, debounce position updates, optimize re-renders with React.memo
  
- **State synchronization**: Drag state and persisted state may get out of sync
  - *Mitigation*: Use optimistic updates, implement retry logic, show clear loading states
  
- **Touch devices**: Mouse events don't work on mobile
  - *Mitigation*: Implement touch event handlers as separate feature (P3 or future release)
  
- **Browser compatibility**: Drag may behave differently across browsers
  - *Mitigation*: Test on all major browsers, use standardized mouse events, avoid browser-specific APIs
  
- **Z-index limits**: Z-index may overflow with many operations
  - *Mitigation*: Reset z-index values periodically (normalize to 0-N range), use 32-bit integers (safe up to 2 billion operations)

### Open Questions
- Should we support multi-select drag (drag multiple cards at once)? **Decision: No, out of scope for v1**
- Should cards snap to grid or allow pixel-perfect positioning? **Decision: Pixel-perfect as per user request**
- Should we limit playfield size or allow infinite panning? **Decision: Fixed playfield size for v1, match current viewport**
- How do we handle undo/redo for drag operations? **Decision: Out of scope for v1, implement in future feature**
- Should dragging work in read-only mode or spectator views? **Decision: Disable drag in read-only/spectator modes**

## Out of Scope *(optional)*

- Multi-card selection and dragging
- Undo/redo for drag operations  
- Card rotation or flipping during drag
- Drag-to-group functionality (automatic grouping)
- Playfield zoom and pan
- Animation when cards snap to positions
- Drag sound effects
- Multiplayer drag conflict resolution
- Card collision detection or physics
- Grid snapping or smart positioning
- Touch device optimization (will be separate feature)
- Keyboard-only drag operations (will be separate feature)
- Drag data export (copying card positions to clipboard)
- Drag analytics or tracking
