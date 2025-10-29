# Data Model: Card Tap/Rotate

**Feature**: Card Tap/Rotate  
**Branch**: `006-card-rotate`  
**Date**: 2025-10-29

## Overview

This document defines the data structures and state management for the card rotation feature. The design extends the existing game state model with rotation tracking while maintaining compatibility with drag-drop positions and hover preview features.

---

## Entity Definitions

### CardRotation (New)

Represents the rotational state of a single card.

**Fields**:
- `cardId` (string, required): Unique identifier matching Card.id
- `rotation` (number, required): Current rotation angle in degrees (0, 90, 180, or 270)

**Invariants**:
- Rotation MUST be normalized to 0-359 range
- Rotation SHOULD be a multiple of 90 for standard tap/untap (spec requirement)
- CardId MUST reference an existing Card in playfield.cards

**Lifecycle**:
- Created: When card is first rotated from default 0° position
- Updated: Each time Q or E key is pressed while hovering the card
- Deleted: When card is removed from playfield (moved to hand or discarded)
- Persisted: In game session state (Supabase), survives browser refresh

**Relationships**:
- Many-to-One with Card (each card has at most one rotation state)
- Stored in Playfield.rotations Map

---

### Playfield (Extended)

Extended the existing Playfield interface to include rotation state.

**New Fields**:
- `rotations` (Map<string, number>, required): Map of cardId to rotation angle in degrees

**Modified Fields**:
- None - existing fields (cards, positions, nextZIndex) unchanged

**Example State**:
```typescript
{
  cards: [
    { id: 'card-1', name: 'Lightning Bolt' },
    { id: 'card-2', name: 'Mountain' }
  ],
  positions: Map {
    'card-1' => { cardId: 'card-1', x: 100, y: 150, zIndex: 1 },
    'card-2' => { cardId: 'card-2', x: 200, y: 150, zIndex: 2 }
  },
  rotations: Map {
    'card-1' => 90,   // Tapped (rotated 90° clockwise)
    'card-2' => 270   // Rotated 90° counter-clockwise
  },
  nextZIndex: 3
}
```

---

### GameState (Extended)

Extended the existing GameState interface to include rotation state in playfield.

**Modified Fields**:
- `playfield.rotations` (Map<string, number>): New field for rotation tracking

**Persistence Changes**:
- Database: Add `playfield_state.rotations` JSONB field in `game_sessions` table
- Migration: Add nullable rotations object to existing rows (default: empty object `{}`)
- Serialization: Map is converted to object for JSON storage: `Object.fromEntries(rotations)`
- Deserialization: Object is converted back to Map: `new Map(Object.entries(rotations))`

**Example Database Row**:
```json
{
  "id": "session-uuid",
  "session_id": "local-session-id",
  "playfield_state": {
    "cards": [...],
    "positions": {
      "card-1": { "x": 100, "y": 150, "zIndex": 1 }
    },
    "rotations": {
      "card-1": 90,
      "card-2": 270
    },
    "nextZIndex": 3
  }
}
```

---

## State Transitions

### Rotation State Machine

Each card's rotation follows a simple state machine with 4 states:

```
     +90° (E key)
0° ←→ 90° ←→ 180° ←→ 270°
     -90° (Q key)
```

**States**:
- **0° (Upright)**: Default state, card is untapped and available
- **90° (Tapped Right)**: Card rotated clockwise, typically indicates "used this turn"
- **180° (Upside Down)**: Card fully inverted, some games use for "exiled" or special states
- **270° (Tapped Left)**: Card rotated counter-clockwise, equivalent to -90°

**Transitions**:
- **E key press** (clockwise): `(current + 90) % 360`
- **Q key press** (counter-clockwise): `(current - 90 + 360) % 360`

**Transition Rules**:
1. Rotation ONLY occurs when card is hovered (FR-004)
2. Rotation state persists when card moves between locations (FR-012)
3. Multiple rotations accumulate (FR-006): pressing E three times on 0° → 270°
4. Rotation wraps at 360°: 270° + 90° = 0° (FR-009)

---

### Card Lifecycle with Rotation

**Scenario 1: New Card to Playfield**
```
1. Card drawn from deck to hand (rotation: undefined)
2. Card dragged from hand to playfield (rotation: undefined)
3. First time rotated → rotation: 90° (stored in Map)
4. Card remains on playfield → rotation persists
```

**Scenario 2: Rotated Card Moved to Hand**
```
1. Card on playfield with rotation: 180°
2. User drags card back to hand
3. Rotation state REMOVED from Map (hand cards don't have position/rotation)
4. If card played back to playfield → rotation resets to 0° (default)
```

**Scenario 3: Rapid Rotation**
```
1. Card on playfield at rotation: 0°
2. User presses E rapidly 5 times in 500ms
3. Rotation updates: 0° → 90° → 180° → 270° → 0° → 90°
4. Final state: rotation: 90° (5 * 90 = 450, normalized to 90)
```

---

## Validation Rules

### Rotation Value Constraints

From `FR-009` (normalize rotation values):

```typescript
// Valid rotations (normalized)
✅ 0     // Upright
✅ 90    // Tapped right
✅ 180   // Upside down
✅ 270   // Tapped left

// Invalid/normalized rotations
❌ -90   → normalize to 270
❌ 360   → normalize to 0
❌ 450   → normalize to 90
❌ -180  → normalize to 180
```

**Validation Function**:
```typescript
function isValidRotation(rotation: number): boolean {
  return rotation >= 0 && rotation < 360;
}

function normalizeRotation(rotation: number): number {
  const normalized = rotation % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}
```

---

### State Consistency Rules

**Rule 1: Rotation entries must have corresponding cards**
```typescript
// INVALID: rotation for card not on playfield
playfield.cards = [{ id: 'card-1' }]
playfield.rotations = Map { 'card-2' => 90 } // ❌ card-2 not in playfield
```

**Rule 2: Cards can have position without rotation (default 0°)**
```typescript
// VALID: card with position but no rotation entry
playfield.cards = [{ id: 'card-1' }]
playfield.positions = Map { 'card-1' => {...} }
playfield.rotations = Map {} // ✅ card-1 implicitly 0°
```

**Rule 3: Rotation state cleanup on card removal**
```typescript
// When card removed from playfield:
function removeCard(cardId: string) {
  playfield.cards = playfield.cards.filter(c => c.id !== cardId);
  playfield.positions.delete(cardId); // ✅ Existing cleanup
  playfield.rotations.delete(cardId); // ✅ NEW cleanup
}
```

---

## Storage Schema

### Database Migration

**Migration**: `002_add_rotation_state.sql` (extends existing schema)

```sql
-- Add rotation tracking to playfield_state JSONB
-- No schema change needed - JSONB supports dynamic fields
-- Just update application code to include rotations object

-- Example query to update existing rows (optional):
UPDATE game_sessions
SET playfield_state = jsonb_set(
  playfield_state,
  '{rotations}',
  '{}'::jsonb,
  true
)
WHERE playfield_state->>'rotations' IS NULL;
```

**Note**: Since `playfield_state` is already JSONB, no migration is strictly required. The application will handle missing `rotations` field gracefully (default to empty Map).

---

### TypeScript Serialization

**Challenge**: Map objects don't serialize to JSON directly.

**Solution**: Convert to plain object for storage, restore to Map on load.

```typescript
// Serialize (React state → Supabase)
function serializePlayfield(playfield: Playfield): PlayfieldJSON {
  return {
    cards: playfield.cards,
    positions: Object.fromEntries(playfield.positions),
    rotations: Object.fromEntries(playfield.rotations), // NEW
    nextZIndex: playfield.nextZIndex,
  };
}

// Deserialize (Supabase → React state)
function deserializePlayfield(json: PlayfieldJSON): Playfield {
  return {
    cards: json.cards,
    positions: new Map(Object.entries(json.positions)),
    rotations: new Map(Object.entries(json.rotations || {})), // NEW, default to {}
    nextZIndex: json.nextZIndex,
  };
}
```

---

## Integration Points

### Existing Features

**Drag-Drop (004-card-drag-drop)**:
- Rotation and position transforms are independent
- Combined CSS transform: `translate(x, y) rotate(deg)`
- Both states stored separately: `positions` Map and `rotations` Map
- No conflicts or shared state

**Hover Preview (003-card-hover-preview)**:
- Preview displays card at current rotation (FR-011)
- Rotation keys work during preview (hover maintained)
- Preview position calculation unaffected by rotation
- CardPreviewContext provides hovered card ID for rotation targeting

**Game State (001-card-sandbox)**:
- useGameState hook extended with rotation methods
- Auto-save debouncing (500ms) applies to rotation state changes
- Rotation state reset on deck import (new game)

---

### New Hook: useCardRotation

**Purpose**: Encapsulate rotation state management and keyboard handling.

**Interface**:
```typescript
interface UseCardRotationReturn {
  // Get rotation for a card (default 0° if not set)
  getRotation: (cardId: string) => number;
  
  // Rotate a card by delta degrees (90 or -90)
  rotateCard: (cardId: string, delta: number) => void;
  
  // Set absolute rotation for a card
  setRotation: (cardId: string, degrees: number) => void;
  
  // Clear rotation for a card (reset to 0°)
  clearRotation: (cardId: string) => void;
}
```

**Usage in Components**:
```typescript
// In Card.tsx
const { getRotation } = useCardRotation();
const rotation = getRotation(card.id);

// In page.tsx (keyboard handler)
const { rotateCard } = useCardRotation();
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'e') rotateCard(hoveredCardId, 90);
    if (e.key === 'q') rotateCard(hoveredCardId, -90);
  };
  // ...
}, []);
```

---

## Performance Considerations

### Memory Footprint

**Estimate**:
- Each rotation entry: ~16 bytes (string key + number value in JS)
- Max 200 cards on playfield (per spec scale/scope)
- Total: ~3.2 KB for rotation state (negligible)

**Comparison**:
- Card positions: ~48 bytes per card (x, y, zIndex) = ~9.6 KB
- Card objects: ~500 bytes per card (with metadata) = ~100 KB
- **Rotation adds <5% memory overhead**

---

### Update Performance

**Rotation Operation**:
1. Map lookup: O(1)
2. Modulo arithmetic: O(1)
3. Map update: O(1)
4. React re-render: O(n) where n = number of Card components
5. CSS transform: GPU-accelerated, no layout/paint

**Bottleneck**: React re-render of all cards on playfield.

**Optimization**: 
- Use React.memo on Card component (already implemented)
- Only re-render card with changed rotation (shallow comparison)
- Expected: 1-2ms per rotation (well below 50ms requirement)

---

## Summary

The rotation data model extends the existing Playfield entity with a `rotations` Map, following the same pattern as `positions` for drag-drop. Rotation state is:

- **Stored**: In Playfield.rotations Map<string, number>
- **Persisted**: In Supabase game_sessions.playfield_state.rotations JSONB
- **Normalized**: 0-359° range using modulo arithmetic
- **Independent**: From position state, no conflicts with existing features
- **Ephemeral**: Per-session only, cleared on deck import
- **Performant**: <5% memory overhead, O(1) operations

Ready to proceed to contract definitions (Phase 1 continued).
