# Implementation Plan: Card Drag and Drop

**Branch**: `004-card-drag-drop` | **Date**: 2025-10-28 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/004-card-drag-drop/spec.md`

## Summary

Enable drag-and-drop card interactions allowing users to drag cards from hand to playfield with pixel-perfect positioning, reposition playfield cards, manage z-index stacking (last moved on top), optionally return cards to hand, and discard cards by dragging off playfield. Implementation uses native mouse events with absolute positioning and auto-incrementing z-index counter.

## Technical Context

**Language/Version**: TypeScript 5+ with strict mode enabled  
**Primary Dependencies**: React 19.2.0, Next.js 16.0.0, Tailwind CSS 4+, Supabase JS SDK  
**Storage**: Supabase PostgreSQL (existing game_sessions table with JSONB columns)  
**Testing**: Jest + React Testing Library (existing setup)  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge - desktop focus for v1)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: 60fps during drag operations, <500ms database save, <200ms position restoration  
**Constraints**: <200KB client-side JS bundle, Lighthouse performance score 90+, no drag lag with 50+ cards  
**Scale/Scope**: Single-player game, ~50 cards max on playfield, responsive design for desktop

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The following principles from `.specify/memory/constitution.md` MUST be verified:

- ✅ **Type Safety & Code Quality**: All code uses TypeScript strict mode with explicit types defined in contracts/card-drag-drop.ts
- ✅ **Component-First Architecture**: Feature extends existing Card/Hand/Playfield components, new hooks (useDragAndDrop, usePlayfieldPositions) follow single responsibility
- ✅ **UX Consistency**: Visual feedback (opacity, cursor, elevation) uses Tailwind classes, consistent with existing card preview feature, dark mode support maintained
- ✅ **Performance Requirements**: CSS transforms for GPU acceleration, debounced updates (16ms), memoized components, Image optimization preserved, bundle impact minimal (<10KB)

**Violations** (if any):
- None - Feature aligns with all constitution principles

## Overview

This document outlines the technical implementation plan for the drag-and-drop card interaction feature. The feature enables users to drag cards from their hand to the playfield, reposition playfield cards, and optionally drag cards back to hand or discard them.

## Architecture Decisions

### 1. Native Browser Events vs. Drag-and-Drop API

**Decision**: Use native mouse events (mousedown, mousemove, mouseup) instead of HTML5 Drag-and-Drop API.

**Rationale**:
- HTML5 DnD API has poor customization for ghost images and visual feedback
- Mouse events provide precise control over drag behavior and positioning
- Better performance for real-time position updates during drag
- Easier to implement custom drop zones and visual feedback
- More consistent cross-browser behavior

**Trade-offs**:
- Need to implement more logic manually (event handling, drop detection)
- Touch support requires separate implementation (can be added later)

### 2. Positioning Strategy

**Decision**: Use absolute positioning with pixel-perfect coordinate storage.

**Rationale**:
- User explicitly requested "cards can be placed anywhere on the playfield"
- Provides maximum flexibility for card organization
- Simpler state management (just x, y coordinates)
- No complex grid calculations or snapping logic needed

**Trade-offs**:
- More complex collision detection (if needed in future)
- No automatic layout or alignment
- Requires boundary constraints to prevent cards from moving outside playfield

### 3. Z-Index Management

**Decision**: Use auto-incrementing z-index counter with "last moved on top" behavior.

**Rationale**:
- Simple to implement and reason about
- Predictable behavior matches user expectations
- No need for complex z-index calculations or sorting
- Easy to persist and restore from database

**Trade-offs**:
- Z-index values will grow unbounded (mitigated by periodic normalization)
- Cannot implement "lock to bottom" or layering groups without additional logic

### 4. State Management

**Decision**: Extend existing `useGameState` hook with drag-specific actions.

**Rationale**:
- Consistent with existing architecture
- Leverages existing persistence layer
- Maintains single source of truth for game state
- Easier to test and debug

**Trade-offs**:
- May increase hook complexity
- Need careful coordination between drag state and game state

### 5. Performance Optimization

**Decision**: Use debouncing for position updates and auto-save.

**Rationale**:
- Prevents excessive re-renders during drag
- Reduces database write frequency
- Maintains 60fps target during drag operations

**Trade-offs**:
- Small delay before position updates are persisted
- Need to handle rapid drag-save scenarios carefully

## Implementation Phases

### Phase 1: Core Drag Mechanics (P1)

**Goal**: Basic drag-and-drop from hand to playfield with free positioning.

**Tasks**:
1. Create `useDragAndDrop` hook for drag state management
2. Add drag event handlers to Card component
3. Implement drag start detection (threshold > 5px)
4. Track mouse position during drag
5. Update card visual feedback during drag (opacity, cursor)
6. Implement drag cancel (ESC key)
7. Update Playfield to use absolute positioning container
8. Implement drop detection on playfield
9. Update game state when card is dropped
10. Remove card from hand when dropped on playfield

**Acceptance**: Users can drag cards from hand to playfield at any position.

### Phase 2: Position Persistence (P1)

**Goal**: Save and restore card positions across page refreshes.

**Tasks**:
1. Update Playfield interface to include positions Map
2. Create position storage in game state
3. Implement position save on drop
4. Add debounced auto-save for performance
5. Load positions from database on mount
6. Apply positions to rendered cards
7. Test position accuracy after refresh

**Acceptance**: Card positions are restored exactly after page refresh.

### Phase 3: Z-Index Management (P2)

**Goal**: Implement stacking order with "last moved on top" behavior.

**Tasks**:
1. Add z-index field to CardPosition interface
2. Implement auto-incrementing z-index counter
3. Assign z-index when card is placed on playfield
4. Update z-index when card is moved
5. Apply z-index to card styles
6. Persist z-index values to database
7. Restore z-index order on page load
8. Test overlapping card stacking

**Acceptance**: Most recently moved card always appears on top of others.

### Phase 4: Playfield Card Repositioning (P2)

**Goal**: Allow dragging and repositioning existing playfield cards.

**Tasks**:
1. Enable drag handlers on playfield cards
2. Track original position for cancel/ESC
3. Update position on drop
4. Maintain z-index updates on move
5. Prevent interference with other cards
6. Test multiple repositioning operations

**Acceptance**: Playfield cards can be dragged to new positions smoothly.

### Phase 5: Playfield to Hand (P3)

**Goal**: Allow dragging cards from playfield back to hand.

**Tasks**:
1. Add drop zone detection for hand container
2. Implement visual feedback on hand hover
3. Remove card from playfield on hand drop
4. Add card to end of hand array
5. Clear position data when moved to hand
6. Handle hand size limit constraints
7. Test hand-to-playfield-to-hand cycle

**Acceptance**: Cards can be dragged from playfield back to hand.

### Phase 6: Discard Functionality (P3)

**Goal**: Allow removing cards by dragging off playfield.

**Tasks**:
1. Detect when card is dragged outside valid zones
2. Add visual feedback for discard zone
3. Remove card from playfield on discard drop
4. Implement forgiving edge detection (threshold)
5. Ensure card is not added to hand or deck
6. Test discard from various positions

**Acceptance**: Cards can be removed by dragging outside playfield/hand areas.

## Component Architecture

### New Components

None required - extending existing components.

### Modified Components

**`Card.tsx`**
- Add `draggable`, `isDragging`, `position` props
- Implement drag event handlers (onMouseDown)
- Apply drag styling (opacity, elevation, cursor)
- Render with absolute positioning when on playfield
- Apply z-index from position data

**`Hand.tsx`**
- Add drop zone detection with ref
- Implement visual feedback for valid drop target
- Handle card drops from playfield
- Update hand state on card addition

**`Playfield.tsx`**
- Replace CSS Grid with absolute positioning container
- Add drop zone detection with ref
- Implement visual feedback for valid drop target
- Render cards with absolute positions from state
- Add discard zone visual feedback
- Calculate and provide playfield bounds

### New Hooks

**`useDragAndDrop.ts`**
```typescript
// Core drag state and operations
- dragState: DragState
- startDrag(data: DragStartData): void
- updateDragPosition(event: MouseEvent): void
- endDrag(event: MouseEvent): void
- cancelDrag(): void
- getDropZone(position: Position2D): DropZone
```

**`usePlayfieldPositions.ts`**
```typescript
// Position and z-index management
- positions: Map<string, CardPosition>
- nextZIndex: number
- setCardPosition(cardId, position): CardPosition
- removeCardPosition(cardId): void
- bringToFront(cardId): void
- getCardPosition(cardId): CardPosition | undefined
```

## Data Flow

### Drag Start
1. User mousedown on card → Card component
2. Card calls `startDrag()` → useDragAndDrop
3. Hook updates drag state with card ID, source, start position
4. Card component re-renders with drag styling

### During Drag
1. Global mousemove event → useDragAndDrop
2. Hook updates current position
3. Hook calculates drop zone (playfield, hand, discard)
4. Components receive updated drag state
5. Visual feedback updates (drop target highlighting)

### Drag End
1. Global mouseup event → useDragAndDrop
2. Hook determines final drop zone
3. Hook calls appropriate game state action:
   - MOVE_CARD_TO_PLAYFIELD (hand → playfield)
   - UPDATE_CARD_POSITION (playfield → playfield)
   - MOVE_CARD_TO_HAND (playfield → hand)
   - DISCARD_CARD (→ discard)
4. Game state updates (useGameState)
5. Position state updates (usePlayfieldPositions)
6. Database auto-save triggered (debounced)
7. Drag state cleared
8. Components re-render with new state

### Drag Cancel
1. ESC key pressed or error occurs
2. `cancelDrag()` called
3. Card returns to original position
4. Drag state cleared
5. No game state changes

## Database Schema

### `game_sessions.playfield_state` JSONB Structure

```json
{
  "cards": [
    { "id": "card-1", "name": "Card 1", ... },
    { "id": "card-2", "name": "Card 2", ... }
  ],
  "positions": {
    "card-1": { "cardId": "card-1", "x": 100, "y": 200, "zIndex": 1 },
    "card-2": { "cardId": "card-2", "x": 300, "y": 150, "zIndex": 2 }
  },
  "nextZIndex": 3
}
```

**Changes from current schema**:
- `positions` field changed from optional to required
- Position objects now include `zIndex` field
- Added `nextZIndex` field for auto-incrementing counter

**Migration Strategy**:
- No SQL migration needed (JSONB is flexible)
- Handle missing fields with default values in TypeScript
- Existing sessions will initialize positions as empty Map

## Performance Considerations

### Optimization Strategies

1. **Debounced Position Updates**
   - Update visual position immediately (CSS transform)
   - Debounce state updates to 16ms (~60fps)
   - Batch multiple position changes

2. **Memoization**
   - Memoize Card components to prevent unnecessary re-renders
   - Use React.memo with custom comparison for position props
   - Memoize expensive calculations (drop zone detection)

3. **Event Listener Management**
   - Use single global listeners (mousemove, mouseup) during drag
   - Add listeners on drag start, remove on drag end
   - Use passive event listeners where possible

4. **Database Write Optimization**
   - Debounce auto-save to 500ms after drag completes
   - Use optimistic updates for immediate UI feedback
   - Batch multiple position changes in single save

5. **Rendering Optimization**
   - Use CSS transforms for position updates (GPU accelerated)
   - Limit re-renders to dragged card and drop zones
   - Avoid re-rendering entire playfield on position change

### Performance Targets

- **Drag Responsiveness**: < 16ms (60fps)
- **Drop Completion**: < 100ms
- **Database Save**: < 500ms (debounced)
- **Page Load Restore**: < 200ms
- **Memory Usage**: < 50MB for 50 cards

## Testing Strategy

### Unit Tests

- `useDragAndDrop` hook behavior
  - Drag start/update/end/cancel
  - Drop zone detection logic
  - Movement threshold detection
  
- `usePlayfieldPositions` hook behavior
  - Position CRUD operations
  - Z-index management
  - Position normalization

### Integration Tests

- Card drag from hand to playfield
- Card reposition on playfield
- Card drag from playfield to hand
- Card discard functionality
- ESC key cancellation
- Position persistence and restoration

### E2E Tests

- Complete drag-drop flow (Playwright/Cypress)
- Multi-browser compatibility
- Performance benchmarks (60fps maintenance)
- Database persistence verification

### Manual Testing Checklist

- [ ] Drag card from hand to playfield (center)
- [ ] Drag card to playfield edge positions (all 4 edges)
- [ ] Drag card to playfield corners
- [ ] Reposition playfield card (multiple times)
- [ ] Drag overlapping cards (verify z-index)
- [ ] Drag card back to hand from playfield
- [ ] Drag card off playfield to discard
- [ ] Cancel drag with ESC key (from hand, from playfield)
- [ ] Refresh page and verify positions restored
- [ ] Test with 50+ cards on playfield (performance)
- [ ] Test rapid drag operations
- [ ] Test while ALT-hover preview is active

## Risk Mitigation

### Known Risks

1. **Performance with Many Cards**
   - *Risk*: Frame drops with 50+ cards during drag
   - *Mitigation*: Optimize rendering, use CSS transforms, implement virtualization if needed

2. **State Synchronization**
   - *Risk*: Drag state and persisted state may conflict
   - *Mitigation*: Use optimistic updates, clear conflict resolution, rollback on error

3. **Browser Compatibility**
   - *Risk*: Mouse event behavior varies across browsers
   - *Mitigation*: Test on all major browsers, use standardized events, polyfills if needed

4. **Z-Index Overflow**
   - *Risk*: Z-index counter grows unbounded
   - *Mitigation*: Implement periodic normalization (reset to 0-N range), use 32-bit integers

5. **Touch Device Support**
   - *Risk*: Mouse events don't work on mobile
   - *Mitigation*: Mark as known limitation, plan separate touch implementation for v2

## Dependencies

- React 19.2.0 (existing)
- Next.js 16.0.0 (existing)
- Tailwind CSS 4+ (existing)
- Supabase JS SDK (existing)
- TypeScript 5+ (existing)

**No new external dependencies required.**

## Timeline Estimate

- **Phase 1** (Core Drag): 2-3 days
- **Phase 2** (Persistence): 1-2 days
- **Phase 3** (Z-Index): 1 day
- **Phase 4** (Reposition): 1 day
- **Phase 5** (To Hand): 1 day
- **Phase 6** (Discard): 1 day
- **Testing & Polish**: 2 days

**Total**: 9-11 days

## Success Metrics

- All acceptance scenarios pass
- 60fps maintained during drag with 50 cards
- Position accuracy 100% after page refresh
- Z-index stacking works correctly 100% of time
- No conflicts with existing features (click, preview)
- Performance score remains 90+
- Cross-browser compatibility verified

## Open Questions

- [ ] Should we support undo/redo for drag operations? **Decision: Out of scope for v1**
- [ ] How do we handle playfield size on different screens? **Decision: Responsive container, positions relative to container**
- [ ] Should positions be synced in real-time for multiplayer? **Decision: Out of scope, no multiplayer in v1**
- [ ] Do we need keyboard alternatives for accessibility? **Decision: Add as stretch goal/future enhancement**
- [ ] Should we limit the number of cards on playfield? **Decision: No hard limit, rely on performance testing**

## Future Enhancements

- Touch device support (touch events)
- Keyboard-based card movement (arrow keys)
- Multi-select and drag multiple cards
- Card rotation and orientation
- Playfield zoom and pan
- Grid snapping (optional mode)
- Undo/redo support
- Drag animations (smooth placement)
- Smart positioning (collision avoidance)
- Card grouping and containers
