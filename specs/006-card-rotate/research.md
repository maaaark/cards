# Research: Card Tap/Rotate

**Feature**: Card Tap/Rotate  
**Branch**: `006-card-rotate`  
**Date**: 2025-10-29

## Overview

This document contains research findings and technical decisions for implementing keyboard-based card rotation (tapping) with Q/E keys. All unknowns from the Technical Context have been resolved through analysis of the existing codebase and web development best practices.

---

## Research Areas

### 1. Rotation State Storage Strategy

**Question**: How should rotation angles be stored and persisted in the game state?

**Decision**: Store rotation as a number (degrees) in a new `Map<string, number>` within the game state, persisted to Supabase JSONB.

**Rationale**:
- Existing game state already uses `Map<string, CardPosition>` for drag-drop positions in `playfield.positions`
- Same pattern can be applied: `playfield.rotations: Map<string, number>` for consistency
- Degrees (0, 90, 180, 270) are intuitive and match CSS transform rotate() units
- Maps provide O(1) lookup by card ID, essential for >10 rotations/second performance requirement
- Supabase JSONB supports nested objects, so `playfield_state` can include rotations alongside positions
- Session-only persistence aligns with existing drag-drop position behavior (not saved cross-session)

**Alternatives Considered**:
1. **Store as quaternion/radians**: Rejected - overkill for 90° increments, harder to debug
2. **Store in Card entity directly**: Rejected - violates immutability of Card interface, would require copying cards
3. **Separate rotation table in DB**: Rejected - adds complexity, rotations are ephemeral like positions
4. **Redux/Zustand global store**: Rejected - project uses React hooks pattern (useGameState), adding state library is unnecessary

**Implementation Details**:
```typescript
// Extend Playfield interface in game.ts
interface Playfield {
  cards: Card[];
  positions: Map<string, CardPosition>;
  rotations: Map<string, number>; // NEW: cardId -> rotation in degrees
  nextZIndex: number;
}
```

---

### 2. Keyboard Event Handling Architecture

**Question**: Should keyboard listeners be global (document/window) or per-component (Card)?

**Decision**: Use global keyboard listener at page level (`app/game/page.tsx`) combined with hover state tracking.

**Rationale**:
- Prevents duplicate event listeners (one per card would mean 20-200 listeners for deck size)
- Single `keydown` listener is more performant and easier to debug
- Leverages existing hover tracking from `003-card-hover-preview` feature (CardPreviewContext already tracks hovered card)
- Centralized `preventDefault()` logic - easier to manage which keys are blocked
- Allows future expansion (e.g., global shortcuts like "R to rotate all cards")
- Follows React best practices for keyboard shortcuts in SPAs

**Alternatives Considered**:
1. **Per-Card event listeners**: Rejected - performance issues with many cards, cleanup complexity
2. **useKeyboard hook per Card**: Rejected - same issues as per-card listeners
3. **Event delegation on parent container**: Rejected - cards don't always have keyboard focus (hover-based, not focus-based)

**Implementation Details**:
```typescript
// In app/game/page.tsx
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    const hoveredCardId = getHoveredCardId(); // From CardPreviewContext
    if (!hoveredCardId) return;
    
    if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      rotateCard(hoveredCardId, 90); // clockwise
    } else if (e.key === 'q' || e.key === 'Q') {
      e.preventDefault();
      rotateCard(hoveredCardId, -90); // counter-clockwise
    }
  }
  
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

### 3. CSS Transform vs Canvas/SVG Rendering

**Question**: How should rotation be visually rendered?

**Decision**: Use CSS `transform: rotate(Xdeg)` with Tailwind transitions.

**Rationale**:
- CSS transforms are hardware-accelerated (GPU), meeting <50ms response and 200-300ms animation requirements
- Simpler implementation - just update inline style or className on Card component
- Tailwind provides built-in transition utilities (`transition-transform duration-300 ease-in-out`)
- No external libraries needed (Canvas/SVG would require react-konva, pixi.js, etc.)
- Works seamlessly with existing Card component structure (Image component, fallback rendering)
- Maintains accessibility - rotated elements stay in DOM with proper ARIA attributes

**Alternatives Considered**:
1. **Canvas rendering**: Rejected - complex, no accessibility, harder to integrate with existing Card/Image components
2. **SVG transforms**: Rejected - unnecessary complexity, CSS is sufficient for 2D rotation
3. **react-spring/framer-motion animations**: Rejected - adds 50KB+ bundle size for feature achievable with CSS

**Implementation Details**:
```tsx
// In Card.tsx
<div
  style={{
    transform: `rotate(${rotation}deg)`,
    transition: 'transform 300ms ease-in-out'
  }}
>
  {/* card content */}
</div>
```

---

### 4. Rotation Normalization Strategy

**Question**: How should cumulative rotations be normalized (e.g., 450° → 90°)?

**Decision**: Normalize rotation values using modulo arithmetic after each rotation operation.

**Rationale**:
- Prevents rotation values from growing unbounded (e.g., user rotates 100 times = 9000°)
- Simplifies state comparison and debugging (always 0°, 90°, 180°, 270°)
- Standard approach in game development (modulo 360 for degrees)
- Minimal performance cost (single modulo operation per rotation)

**Alternatives Considered**:
1. **Store raw cumulative value**: Rejected - infinite growth, harder to serialize, CSS transform still normalizes anyway
2. **Clamp to 0-359 range without snapping**: Rejected - spec requires 90° increments only

**Implementation Details**:
```typescript
// utils/rotation.ts
export function normalizeRotation(degrees: number): number {
  const normalized = degrees % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

// Usage:
const newRotation = normalizeRotation(currentRotation + 90);
```

---

### 5. Integration with Existing Features

**Question**: How does rotation interact with drag-drop (004) and hover-preview (003)?

**Decision**: Rotation is independent - cards can be rotated while dragging and during preview.

**Rationale**:
- **Drag-drop compatibility**: Rotation is visual-only transform, doesn't affect position calculations. Drag offset and rotation transform can be combined: `transform: translate(x, y) rotate(deg)`
- **Preview compatibility**: Rotation keys work during hover preview per FR-011. Preview shows rotated card at current angle.
- **State independence**: Rotation state (`rotations` Map) is separate from position state (`positions` Map) - no conflicts
- **Edge case from spec**: "Cards being dragged" - rotation still works because hover is maintained during drag

**Alternatives Considered**:
1. **Disable rotation during drag**: Rejected - spec says rotation should work during drag (edge case #7)
2. **Reset rotation when moving cards**: Rejected - spec says rotation persists when moving between locations (FR-012)

**Implementation Details**:
```tsx
// Card.tsx - Combined transforms
<div
  style={{
    position: position ? 'absolute' : undefined,
    left: position?.x,
    top: position?.y,
    transform: `
      ${dragOffset ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : ''}
      ${rotation ? `rotate(${rotation}deg)` : ''}
    `.trim(),
  }}
>
```

---

### 6. Performance Optimization Techniques

**Question**: How to achieve >10 rotations/second without visual glitches?

**Decision**: Use React state batching, memoization, and throttle rapid key presses.

**Rationale**:
- React 19 auto-batches state updates - multiple rotations in same tick are combined
- `useMemo` for rotation calculations prevents unnecessary re-renders
- CSS transitions are GPU-accelerated - rotation transform doesn't trigger layout/paint, only composite
- Throttling rapid key presses (e.g., 50ms debounce) prevents animation interruption from spec edge case #1
- Supabase auto-save already debounced (500ms) - no additional optimization needed for persistence

**Alternatives Considered**:
1. **requestAnimationFrame for rotation**: Rejected - CSS handles animation, RAF is for canvas rendering
2. **Web Workers for state updates**: Rejected - overkill, rotation calculation is trivial (addition + modulo)

**Implementation Details**:
```typescript
// useCardRotation.ts
import { useCallback, useMemo } from 'react';
import { throttle } from 'lodash'; // or custom throttle

const throttledRotate = useMemo(
  () => throttle((cardId: string, delta: number) => {
    // rotation logic
  }, 50), // 50ms = 20 ops/sec max, above requirement
  []
);
```

---

## Technology Best Practices

### React 19 + Next.js 16 Patterns

**Research**: Best practices for client-side keyboard interactions in Next.js App Router

**Findings**:
- Use `'use client'` directive for components with keyboard listeners (interactive)
- Global listeners in page.tsx are acceptable for app-wide shortcuts (document-level events)
- Cleanup listeners in useEffect return function to prevent memory leaks
- TypeScript strict mode requires explicit KeyboardEvent type from React or DOM

**Application**:
```typescript
'use client'; // Required for document.addEventListener

useEffect(() => {
  const handler = (e: KeyboardEvent) => { /* ... */ };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, [dependencies]);
```

---

### Tailwind CSS 4 Transitions

**Research**: How to apply smooth rotation animations with Tailwind 4

**Findings**:
- Tailwind 4 uses `transition-transform` utility for transform-specific transitions
- Duration utilities: `duration-300` (300ms), `duration-200` (200ms)
- Easing: `ease-in-out` (default) provides smooth acceleration/deceleration
- Arbitrary values supported: `duration-[250ms]` for spec-compliant 200-300ms range
- No need for custom CSS, built-in utilities meet requirements

**Application**:
```tsx
<div className="transition-transform duration-300 ease-in-out" style={{transform: `rotate(${deg}deg)`}}>
```

---

### TypeScript Strict Mode

**Research**: Type-safe patterns for Map-based state in React

**Findings**:
- Maps in React state require explicit typing: `Map<string, number>`
- Use `new Map()` in setState callbacks to ensure immutability (Maps are mutable)
- TypeScript strict mode requires null checks for `Map.get()` (returns `T | undefined`)
- Consider using `??` operator for default rotation (0°) when card not in Map

**Application**:
```typescript
interface Playfield {
  rotations: Map<string, number>;
}

// In component:
const rotation = playfield.rotations.get(cardId) ?? 0; // Default to 0° if not set
```

---

## Open Questions & Future Considerations

### Resolved
- ✅ All unknowns from Technical Context are resolved
- ✅ No clarifications needed to proceed with design phase

### Future Enhancements (Out of Scope)
1. **Arbitrary rotation angles**: Spec limits to 90° increments, but architecture supports any angle
2. **Rotation undo/redo**: Would require command pattern, not in current requirements
3. **Multi-card rotation**: Spec says single card only, but group selection could enable batch rotation
4. **Rotation animations interpolation**: Currently instant snap to angle, could add spring physics
5. **Rotation state persistence across sessions**: Currently ephemeral, could save to `game_sessions` table

---

## Summary

All technical unknowns have been resolved through codebase analysis and web development best practices research. The implementation approach is:

1. **State**: Add `rotations: Map<string, number>` to Playfield, persist to Supabase JSONB
2. **Events**: Global keyboard listener in page.tsx with hover state from CardPreviewContext
3. **Rendering**: CSS transform with Tailwind transitions for GPU-accelerated animation
4. **Normalization**: Modulo 360 after each rotation to keep values in 0-359 range
5. **Integration**: Independent transforms (rotation + position) with no feature conflicts
6. **Performance**: React 19 batching + CSS GPU acceleration achieves >10 ops/sec requirement

Ready to proceed to Phase 1 (Design & Contracts).
