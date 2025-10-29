# Quickstart: Card Tap/Rotate

**Feature**: Card Tap/Rotate  
**Branch**: `006-card-rotate`  
**Date**: 2025-10-29

## Overview

This quickstart guide provides implementation instructions for developers building the card rotation feature. Follow these steps sequentially to add keyboard-based card tapping (Q/E keys for rotation) to the card game sandbox.

---

## Prerequisites

- Existing codebase at commit with features 001-004 complete
- Node.js 20+, npm/pnpm/yarn installed
- Supabase project configured (for game state persistence)
- TypeScript 5+ with strict mode enabled

---

## Implementation Steps

### Step 1: Extend Type Definitions

**File**: `app/lib/types/game.ts`

Add rotation support to the Playfield interface:

```typescript
export interface Playfield {
  cards: Card[];
  positions: Map<string, CardPosition>;
  rotations: Map<string, number>; // NEW: cardId -> rotation degrees
  nextZIndex: number;
}
```

Update GameSessionRow for Supabase serialization:

```typescript
export interface GameSessionRow {
  // ... existing fields ...
  playfield_state: {
    cards: Card[];
    positions: Record<string, CardPosition>; // Map serialized to object
    rotations: Record<string, number>; // NEW: Map serialized to object
    nextZIndex: number;
  };
  // ... other fields ...
}
```

---

### Step 2: Create Rotation Utility Functions

**File**: `app/lib/utils/rotation.ts` (NEW)

```typescript
/**
 * Normalize rotation angle to 0-359 degree range.
 */
export function normalizeRotation(degrees: number): number {
  const normalized = degrees % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

/**
 * Calculate next rotation angle given direction and increment.
 */
export function calculateNextRotation(
  current: number,
  delta: number
): number {
  return normalizeRotation(current + delta);
}

/**
 * Validate that rotation entries have corresponding cards.
 */
export function validateRotationState(
  cardIds: string[],
  rotations: Map<string, number>
): { valid: boolean; orphanedRotations: string[] } {
  const cardIdSet = new Set(cardIds);
  const orphanedRotations: string[] = [];
  
  rotations.forEach((_, cardId) => {
    if (!cardIdSet.has(cardId)) {
      orphanedRotations.push(cardId);
    }
  });
  
  return {
    valid: orphanedRotations.length === 0,
    orphanedRotations,
  };
}
```

---

### Step 3: Create useCardRotation Hook

**File**: `app/lib/hooks/useCardRotation.ts` (NEW)

```typescript
'use client';

import { useCallback } from 'react';
import { normalizeRotation } from '../utils/rotation';
// Import from useGameState context (implementation details below)

export interface UseCardRotationReturn {
  getRotation: (cardId: string) => number;
  rotateCard: (cardId: string, delta: number) => void;
  setRotation: (cardId: string, degrees: number) => void;
  clearRotation: (cardId: string) => void;
  getAllRotations: () => Map<string, number>;
}

export function useCardRotation(): UseCardRotationReturn {
  // Access playfield state from useGameState
  const { playfield, updatePlayfield } = useGameState();
  
  const getRotation = useCallback((cardId: string): number => {
    return playfield.rotations.get(cardId) ?? 0;
  }, [playfield.rotations]);
  
  const rotateCard = useCallback((cardId: string, delta: number) => {
    const current = playfield.rotations.get(cardId) ?? 0;
    const next = normalizeRotation(current + delta);
    
    const newRotations = new Map(playfield.rotations);
    newRotations.set(cardId, next);
    
    updatePlayfield({ ...playfield, rotations: newRotations });
  }, [playfield, updatePlayfield]);
  
  const setRotation = useCallback((cardId: string, degrees: number) => {
    const normalized = normalizeRotation(degrees);
    const newRotations = new Map(playfield.rotations);
    newRotations.set(cardId, normalized);
    
    updatePlayfield({ ...playfield, rotations: newRotations });
  }, [playfield, updatePlayfield]);
  
  const clearRotation = useCallback((cardId: string) => {
    const newRotations = new Map(playfield.rotations);
    newRotations.delete(cardId);
    
    updatePlayfield({ ...playfield, rotations: newRotations });
  }, [playfield, updatePlayfield]);
  
  const getAllRotations = useCallback(() => {
    return new Map(playfield.rotations);
  }, [playfield.rotations]);
  
  return {
    getRotation,
    rotateCard,
    setRotation,
    clearRotation,
    getAllRotations,
  };
}
```

---

### Step 4: Update useGameState Hook

**File**: `app/lib/hooks/useGameState.ts`

Add rotation initialization and cleanup:

```typescript
// In useGameState hook, update initial state
const [playfield, setPlayfield] = useState<Playfield>({ 
  cards: [], 
  positions: new Map(),
  rotations: new Map(), // NEW
  nextZIndex: 1,
});

// Update moveCardToHand to clear rotation
const moveCardToHand = useCallback((cardId: string) => {
  const card = playfield.cards.find(c => c.id === cardId);
  
  if (!card) {
    setError('Card not found on playfield');
    return;
  }
  
  const updatedPlayfieldCards = playfield.cards.filter(c => c.id !== cardId);
  const updatedPositions = new Map(playfield.positions);
  const updatedRotations = new Map(playfield.rotations); // NEW
  updatedPositions.delete(cardId);
  updatedRotations.delete(cardId); // NEW: Clear rotation when moving to hand
  
  setPlayfield({
    ...playfield,
    cards: updatedPlayfieldCards,
    positions: updatedPositions,
    rotations: updatedRotations, // NEW
  });
  
  setHand(prev => ({
    ...prev,
    cards: [...prev.cards, card],
  }));
  
  setError(undefined);
}, [playfield]);

// Similar updates for discardCard, resetGame, importDeck
```

---

### Step 5: Update useSupabase Hook

**File**: `app/lib/hooks/useSupabase.ts`

Add rotation serialization/deserialization:

```typescript
// In saveGameState function
const saveGameState = async (sessionId: string, state: GameStateInput) => {
  // ... existing code ...
  
  const playfieldState = {
    cards: state.playfield.cards,
    positions: Object.fromEntries(state.playfield.positions),
    rotations: Object.fromEntries(state.playfield.rotations), // NEW
    nextZIndex: state.playfield.nextZIndex,
  };
  
  // ... rest of save logic ...
};

// In loadGameState function
const loadGameState = async (sessionId: string) => {
  // ... existing code ...
  
  const playfield: Playfield = {
    cards: row.playfield_state.cards,
    positions: new Map(Object.entries(row.playfield_state.positions || {})),
    rotations: new Map(Object.entries(row.playfield_state.rotations || {})), // NEW
    nextZIndex: row.playfield_state.nextZIndex,
  };
  
  // ... rest of load logic ...
};
```

---

### Step 6: Update Card Component

**File**: `app/components/game/Card.tsx`

Add rotation prop and CSS transform:

```typescript
export interface CardProps {
  // ... existing props ...
  rotation?: number; // NEW
}

function CardComponent({
  card,
  // ... existing props ...
  rotation = 0, // NEW
}: CardProps) {
  // ... existing code ...
  
  // Update inline styles for rotation
  const outerInlineStyles: React.CSSProperties | undefined = position
    ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isDragging ? 9999 : position.zIndex,
        transform: [
          dragOffset ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : '',
          rotation ? `rotate(${rotation}deg)` : '', // NEW
        ].filter(Boolean).join(' '),
        transition: 'none',
      }
    : rotation ? { // NEW: Rotation even without position (hand cards)
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 300ms ease-in-out',
      }
    : undefined;
  
  // ... rest of component ...
}
```

---

### Step 7: Add Global Keyboard Handler

**File**: `app/game/page.tsx`

Add keyboard listener for Q/E keys:

```typescript
'use client';

import { useEffect } from 'react';
import { useCardRotation } from '@/app/lib/hooks/useCardRotation';
import { useCardPreview } from '@/app/lib/hooks/useCardPreview';

export default function GamePage() {
  const { rotateCard } = useCardRotation();
  const { previewState } = useCardPreview();
  
  // Global keyboard handler for rotation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const hoveredCardId = previewState.cardId; // Get from preview context
      
      if (!hoveredCardId) return; // Only rotate when hovering a card
      
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        rotateCard(hoveredCardId, 90); // Clockwise
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        rotateCard(hoveredCardId, -90); // Counter-clockwise
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [rotateCard, previewState.cardId]);
  
  // ... rest of page component ...
}
```

---

### Step 8: Update Playfield Component

**File**: `app/components/game/Playfield.tsx`

Pass rotation prop to Card components:

```typescript
import { useCardRotation } from '@/app/lib/hooks/useCardRotation';

export function Playfield({ /* ... */ }: PlayfieldProps) {
  const { getRotation } = useCardRotation();
  
  return (
    <div className="playfield-container">
      {playfield.cards.map(card => {
        const position = playfield.positions.get(card.id);
        const rotation = getRotation(card.id); // NEW
        
        return (
          <Card
            key={card.id}
            card={card}
            location="playfield"
            position={position}
            rotation={rotation} // NEW
            // ... other props ...
          />
        );
      })}
    </div>
  );
}
```

---

## Testing Checklist

After implementation, verify these scenarios from the spec:

### Basic Functionality
- [ ] Press E on hovered card → rotates 90° clockwise
- [ ] Press Q on hovered card → rotates 90° counter-clockwise
- [ ] Rotation animates smoothly (200-300ms transition)
- [ ] Q and E keys have no browser default behavior

### State Persistence
- [ ] Rotated card maintains angle when moving around playfield
- [ ] Rotation persists on browser refresh (Supabase auto-save)
- [ ] Rotation cleared when card moved to hand
- [ ] Rotation resets when importing new deck

### Edge Cases
- [ ] Rapid key presses (10+ per second) don't break animation
- [ ] Rotation works during drag operation
- [ ] Rotation works during hover preview (ALT key)
- [ ] Multiple rotations wrap correctly (270° + 90° = 0°)
- [ ] No rotation when not hovering any card

### Integration
- [ ] Rotation doesn't interfere with drag-drop positioning
- [ ] Rotation doesn't interfere with hover preview display
- [ ] Dark mode rotation animation works correctly
- [ ] Rotation state auto-saves with 500ms debounce

---

## Performance Validation

Run these checks to ensure performance requirements (from Success Criteria):

1. **Response time**: Key press to visual change <50ms
   - Test: Open DevTools Performance tab, press E key, measure to first paint
   - Expected: <50ms from keydown event to transform update

2. **Animation duration**: 200-300ms smooth rotation
   - Test: Observe rotation transition, use slow motion (DevTools)
   - Expected: CSS transition completes in 300ms

3. **Throughput**: >10 rotations/second without glitches
   - Test: Rapidly alternate Q/E keys for 5 seconds
   - Expected: No visual stuttering, all rotations applied

4. **Bundle size**: No significant increase
   - Test: Run `npm run build`, check bundle sizes
   - Expected: <1KB added to client bundle (rotation utils only)

---

## Troubleshooting

### Issue: Rotation doesn't persist on refresh
- **Cause**: Supabase serialization not handling rotations Map
- **Fix**: Verify `Object.fromEntries/entries` in useSupabase.ts

### Issue: Keyboard events not firing
- **Cause**: Missing 'use client' directive on page.tsx
- **Fix**: Add `'use client';` at top of app/game/page.tsx

### Issue: Rotation conflicts with drag
- **Cause**: Transform string not combining translate + rotate
- **Fix**: Ensure transform string joins both: `translate(...) rotate(...)`

### Issue: Animation stutters on rapid key press
- **Cause**: CSS transition interruption on multiple rapid updates
- **Fix**: Add throttle to rotateCard function (50ms debounce)

---

## Next Steps

After completing implementation:

1. Run `/speckit.tasks` to generate implementation task checklist
2. Test all acceptance scenarios from spec.md
3. Verify Constitution Check principles (type safety, UX consistency, performance)
4. Commit changes to feature branch `006-card-rotate`
5. Open PR with link to spec and test results

---

## Reference Documentation

- [Feature Spec](./spec.md) - Requirements and user stories
- [Data Model](./data-model.md) - State structure and transitions
- [Contracts](./contracts/card-rotate.ts) - TypeScript interfaces
- [Research](./research.md) - Technical decisions and rationale
