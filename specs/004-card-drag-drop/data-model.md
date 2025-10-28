# Data Model: Card Drag and Drop

## Overview

This document defines the data structures and state management for the drag-and-drop card interaction system.

## State Structure

### Drag State

Tracks the current drag operation in progress (transient, not persisted).

```typescript
interface DragState {
  isDragging: boolean;              // Is a drag operation active?
  draggedCardId: string | null;     // ID of card being dragged
  draggedCardSource: 'hand' | 'playfield' | null;  // Where drag started
  startPosition: Position2D | null; // Initial mouse position
  currentPosition: Position2D | null; // Current mouse position
  offset: Position2D;               // Cursor offset from card top-left
  originalPosition: CardPosition | null; // For cancel/ESC
  dragStartTime: number | null;     // For click vs drag detection
}

interface Position2D {
  x: number;  // X coordinate in pixels
  y: number;  // Y coordinate in pixels
}
```

**Storage**: React state (useDragAndDrop hook), ephemeral  
**Lifetime**: Created on drag start, cleared on drag end/cancel  
**Size**: ~200 bytes per drag operation

### Card Position

Stores absolute position and stacking order for playfield cards (persisted).

```typescript
interface CardPosition {
  cardId: string;  // Unique card identifier
  x: number;       // X coordinate (pixels, relative to playfield)
  y: number;       // Y coordinate (pixels, relative to playfield)
  zIndex: number;  // Stacking order (higher = on top)
}
```

**Storage**: Database (game_sessions.playfield_state JSONB), React state  
**Lifetime**: Persisted until card is removed from playfield  
**Size**: ~100 bytes per card position

### Playfield State

Extended playfield structure with position tracking.

```typescript
interface PlayfieldWithPositions {
  cards: Card[];                      // Array of cards on playfield
  positions: Map<string, CardPosition>; // Card ID → Position mapping
  nextZIndex: number;                 // Auto-increment counter
}
```

**Storage**: Database (game_sessions.playfield_state JSONB)  
**Lifetime**: Persisted across sessions  
**Size**: ~100 bytes overhead + (card size + position size) per card

### Drop Zone Configuration

Runtime configuration for drop detection (not persisted).

```typescript
interface DropZoneConfig {
  playfieldBounds: PlayfieldBounds;  // Playfield container bounds
  handBounds: PlayfieldBounds;       // Hand container bounds
  edgeThreshold: number;             // Forgiving edge detection (px)
}

interface PlayfieldBounds {
  left: number;    // Left edge X (viewport-relative)
  top: number;     // Top edge Y (viewport-relative)
  width: number;   // Container width (px)
  height: number;  // Container height (px)
  right: number;   // Right edge X (computed)
  bottom: number;  // Bottom edge Y (computed)
}
```

**Storage**: Computed at runtime from DOM refs  
**Lifetime**: Recalculated on window resize or container changes  
**Size**: ~100 bytes

## Database Schema

### Existing: `game_sessions` Table

No schema changes required. Using existing JSONB columns with extended structure.

**Column**: `playfield_state` (JSONB)

**Before (Current Structure)**:
```json
{
  "cards": [
    { "id": "card-1", "name": "Card 1", "imageUrl": "..." }
  ]
}
```

**After (With Drag Support)**:
```json
{
  "cards": [
    { "id": "card-1", "name": "Card 1", "imageUrl": "..." },
    { "id": "card-2", "name": "Card 2", "imageUrl": "..." }
  ],
  "positions": {
    "card-1": { "cardId": "card-1", "x": 100, "y": 200, "zIndex": 1 },
    "card-2": { "cardId": "card-2", "x": 300, "y": 150, "zIndex": 2 }
  },
  "nextZIndex": 3
}
```

**New Fields**:
- `positions`: Object mapping card IDs to position data
- `nextZIndex`: Integer counter for z-index assignment

**Backward Compatibility**:
- Existing sessions without `positions` will initialize with empty object
- Existing sessions without `nextZIndex` will initialize with 1
- TypeScript code handles missing fields with default values

**Size Estimate**:
- Base: ~50 bytes overhead
- Per card: ~200 bytes (card data) + ~80 bytes (position)
- 50 cards: ~14 KB
- Well within JSONB limits (max ~255 MB)

## Data Flow Diagrams

### Drag Start Flow

```
User mousedown on card
        ↓
Card.onMouseDown triggered
        ↓
Extract card data, mouse position
        ↓
Call useDragAndDrop.startDrag()
        ↓
Update dragState:
  - isDragging = true
  - draggedCardId = card.id
  - draggedCardSource = 'hand' | 'playfield'
  - startPosition = { x, y }
  - currentPosition = { x, y }
  - offset = calculated
        ↓
Card re-renders with drag styling
```

### During Drag Flow

```
Global mousemove event
        ↓
useDragAndDrop.updateDragPosition()
        ↓
Update dragState.currentPosition
        ↓
Calculate drop zone (playfield/hand/discard)
        ↓
Components receive updated state
        ↓
Visual feedback updates (CSS)
```

### Drag End Flow (Hand → Playfield)

```
Global mouseup event
        ↓
useDragAndDrop.endDrag()
        ↓
Calculate final position and drop zone
        ↓
DropZone = 'playfield'
        ↓
Create CardPosition:
  - x = mouse.x - playfieldBounds.left
  - y = mouse.y - playfieldBounds.top
  - zIndex = nextZIndex++
        ↓
Dispatch MOVE_CARD_TO_PLAYFIELD action
        ↓
useGameState updates:
  - Remove card from hand.cards
  - Add card to playfield.cards
  - Add position to playfield.positions
        ↓
usePlayfieldPositions updates positions Map
        ↓
Trigger debounced auto-save (500ms)
        ↓
Clear dragState
        ↓
Components re-render with new state
```

### Drag End Flow (Playfield → Playfield)

```
Global mouseup event
        ↓
DropZone = 'playfield'
        ↓
Update existing CardPosition:
  - x = new mouse.x - playfieldBounds.left
  - y = new mouse.y - playfieldBounds.top
  - zIndex = nextZIndex++ (bring to front)
        ↓
Dispatch UPDATE_CARD_POSITION action
        ↓
useGameState updates playfield.positions[cardId]
        ↓
Trigger debounced auto-save
        ↓
Clear dragState
        ↓
Card re-renders at new position
```

### Drag End Flow (Playfield → Hand)

```
Global mouseup event
        ↓
DropZone = 'hand'
        ↓
Dispatch MOVE_CARD_TO_HAND action
        ↓
useGameState updates:
  - Remove card from playfield.cards
  - Remove position from playfield.positions
  - Add card to hand.cards (at end)
        ↓
Trigger debounced auto-save
        ↓
Clear dragState
        ↓
Components re-render
```

### Drag Cancel Flow

```
ESC key pressed OR error
        ↓
useDragAndDrop.cancelDrag()
        ↓
If from playfield:
  - Card returns to originalPosition
  - Visual animation (optional)
        ↓
Clear dragState
        ↓
No game state changes
        ↓
Components re-render (card back to original state)
```

## State Management Patterns

### Optimistic Updates

For immediate UI feedback during drag operations:

1. Update local state immediately (dragState, positions)
2. Update UI instantly (no waiting for database)
3. Trigger debounced database save
4. On save error: rollback state, show error message, allow retry

### Debouncing Strategy

**Position Updates During Drag**:
- Visual updates: Every frame (CSS transform, no state update)
- State updates: Debounced to 16ms (~60fps)
- Reason: Prevent excessive re-renders

**Database Saves After Drag**:
- Save triggered: 500ms after drag completes
- Multiple drags: Reset timer on each drag
- Reason: Batch multiple operations, reduce database load

### State Synchronization

**Problem**: Drag state and persisted state must stay in sync.

**Solution**:
1. Single source of truth: `useGameState` for persisted data
2. Separate transient state: `useDragAndDrop` for drag operations
3. Clear ownership: Drag state controls visual feedback, game state controls persistence
4. Atomic updates: Game state updates are complete before clearing drag state

## Data Validation

### Position Constraints

```typescript
function validatePosition(
  position: Position2D,
  playfieldBounds: PlayfieldBounds
): Position2D {
  return {
    x: clamp(position.x, 0, playfieldBounds.width - cardWidth),
    y: clamp(position.y, 0, playfieldBounds.height - cardHeight),
  };
}
```

**Rules**:
- X coordinate: 0 ≤ x ≤ (playfield width - card width)
- Y coordinate: 0 ≤ y ≤ (playfield height - card height)
- Z-index: 1 ≤ z ≤ 10000 (reset if exceeds)

### Drop Zone Detection

```typescript
function getDropZone(
  mousePosition: Position2D,
  config: DropZoneConfig
): DropZone {
  if (isWithinBounds(mousePosition, config.handBounds)) {
    return 'hand';
  }
  
  if (isWithinBounds(mousePosition, config.playfieldBounds, config.edgeThreshold)) {
    return 'playfield';
  }
  
  return 'discard';
}
```

**Logic**:
1. Check hand bounds (exact)
2. Check playfield bounds (with threshold for forgiving edges)
3. Default to discard zone

### Z-Index Normalization

```typescript
function normalizeZIndexes(
  positions: Map<string, CardPosition>
): Map<string, CardPosition> {
  // Sort by current z-index
  const sorted = Array.from(positions.values())
    .sort((a, b) => a.zIndex - b.zIndex);
  
  // Reassign z-index 1, 2, 3, ...
  const normalized = new Map<string, CardPosition>();
  sorted.forEach((pos, index) => {
    normalized.set(pos.cardId, { ...pos, zIndex: index + 1 });
  });
  
  return normalized;
}
```

**Trigger**: When nextZIndex exceeds MAX_Z_INDEX (10000)

## Performance Considerations

### Memory Usage

**Per Drag Operation**:
- DragState: ~200 bytes
- Event listeners: ~100 bytes
- Total: ~300 bytes (negligible)

**Per Card on Playfield**:
- Card data: ~200 bytes
- Position data: ~100 bytes
- DOM node: ~1 KB
- Total: ~1.3 KB

**50 Cards on Playfield**:
- Total: ~65 KB (acceptable)

### Database Load

**Write Operations**:
- Drag complete: 1 write (debounced to 500ms)
- Multiple rapid drags: 1 write per 500ms window
- Expected: ~2-10 writes per minute during active play

**Read Operations**:
- Page load: 1 read (initial state)
- No reads during gameplay (all state in memory)

### Optimization Checklist

- [x] Use debounced position updates
- [x] Use debounced database saves
- [x] Memoize Card components
- [x] Use CSS transforms for visual updates
- [x] Single global event listeners
- [x] Remove listeners when not dragging
- [x] Batch state updates where possible
- [x] Limit re-renders to affected components

## Type Safety

All interfaces defined in `contracts/card-drag-drop.ts`.

**Type Guards**:
```typescript
function isDragging(state: DragState): boolean {
  return state.isDragging && state.draggedCardId !== null;
}

function hasPosition(cardId: string, positions: Map<string, CardPosition>): boolean {
  return positions.has(cardId);
}
```

**Runtime Validation**:
```typescript
function assertValidPosition(pos: CardPosition): void {
  if (pos.x < 0 || pos.y < 0) {
    throw new Error('Invalid position: coordinates cannot be negative');
  }
  if (pos.zIndex < 1) {
    throw new Error('Invalid position: zIndex must be positive');
  }
}
```

## Migration Strategy

**No database migration required.**

**Existing Sessions**:
- Missing `positions` field: Initialize as `{}`
- Missing `nextZIndex` field: Initialize as `1`
- Cards without positions: Remain in grid layout until first drag

**New Sessions**:
- Initialize `positions` as `{}`
- Initialize `nextZIndex` as `1`
- Positions assigned on first card placement

**Code Compatibility**:
```typescript
// Handle legacy data
const playfield: PlayfieldWithPositions = {
  cards: dbData.cards,
  positions: new Map(Object.entries(dbData.positions || {})),
  nextZIndex: dbData.nextZIndex || 1,
};
```
