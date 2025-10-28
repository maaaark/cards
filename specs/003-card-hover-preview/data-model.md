# Data Model: Card Hover Preview with ALT Key

**Feature**: `003-card-hover-preview`  
**Date**: October 28, 2025  
**Purpose**: Define data structures, state types, and algorithms for card preview functionality

## Overview

This document defines all data structures and types used by the card preview feature. The feature operates entirely in client-side memory with no persistence requirements - all state is ephemeral and resets on page refresh.

---

## Core Data Structures

### 1. Preview State

The primary state object tracking preview visibility and configuration.

```typescript
interface PreviewState {
  /**
   * Whether preview is currently visible
   */
  isActive: boolean;
  
  /**
   * Card currently being previewed (null when hidden)
   */
  card: Card | null;
  
  /**
   * ID of the card currently being hovered
   * Tracks which card triggered the preview
   */
  hoveredCardId: string | null;
  
  /**
   * Current mouse X coordinate (clientX)
   * Updated on every mousemove when preview active
   */
  mouseX: number;
  
  /**
   * Current mouse Y coordinate (clientY)
   * Updated on every mousemove when preview active
   */
  mouseY: number;
}
```

**Initial State**:
```typescript
{
  isActive: false,
  card: null,
  hoveredCardId: null,
  mouseX: 0,
  mouseY: 0,
}
```

**State Transitions**:
- `isActive: false → true`: ALT pressed + card hovered
- `isActive: true → false`: ALT released OR mouse leaves card
- `card: null → Card`: Mouse enters card while ALT pressed
- `card: Card A → Card B`: Mouse enters different card while ALT pressed
- `mouseX/mouseY`: Updated continuously while preview active

**Validation Rules**:
- `isActive === true` implies `card !== null`
- `isActive === true` implies `hoveredCardId !== null`
- `isActive === false` implies `card === null`

---

### 2. Preview Position

Calculated position where preview should render in viewport.

```typescript
interface PreviewPosition {
  /**
   * X coordinate relative to viewport (pixels)
   * 0 = left edge of viewport
   */
  x: number;
  
  /**
   * Y coordinate relative to viewport (pixels)
   * 0 = top edge of viewport
   */
  y: number;
}
```

**Constraints**:
- `x >= 0` (not off left edge)
- `y >= 0` (not off top edge)
- `x + previewWidth <= viewportWidth` (not off right edge)
- `y + previewHeight <= viewportHeight` (not off bottom edge)

**Calculation Dependencies**:
- Mouse coordinates (`mouseX`, `mouseY`)
- Viewport dimensions (`window.innerWidth`, `window.innerHeight`)
- Preview dimensions (`previewWidth`, `previewHeight`)
- Offset from cursor (`DEFAULT_PREVIEW_OFFSET`)

---

### 3. Preview Dimensions

Fixed dimensions for the preview card.

```typescript
interface PreviewDimensions {
  /**
   * Width of preview in pixels
   * Based on 2x card width for clear visibility
   */
  width: number;
  
  /**
   * Height of preview in pixels
   * Maintains 5:7 aspect ratio
   */
  height: number;
}
```

**Default Values**:
```typescript
const DEFAULT_PREVIEW_DIMENSIONS: PreviewDimensions = {
  width: 300,   // 2x standard card width (~150px)
  height: 420,  // Maintains 5:7 aspect ratio (300 * 7/5)
};
```

**Responsive Adjustments**:
- Desktop: 300×420px (default)
- Tablet: 250×350px (scaled down 0.83x)
- Mobile: Preview disabled (viewport too small)

---

### 4. ALT Key State

Global keyboard state tracking ALT key pressed/released.

```typescript
interface AltKeyState {
  /**
   * Whether ALT key is currently pressed
   * true = pressed, false = released
   */
  isPressed: boolean;
}
```

**State Machine**:
```
Initial: { isPressed: false }

Events:
- keydown (key === 'Alt') → { isPressed: true }
- keyup (key === 'Alt') → { isPressed: false }
- window blur → { isPressed: false } (safety reset)
```

**Edge Cases**:
- Multiple ALT keys (left/right): Either triggers pressed state
- Alt+Tab window switch: Reset to `false` on window blur
- Sticky keys / accessibility: Standard browser behavior applies

---

## Positioning Algorithm

### Input Parameters

```typescript
interface PositionCalculationInput {
  /** Current mouse X coordinate */
  mouseX: number;
  
  /** Current mouse Y coordinate */
  mouseY: number;
  
  /** Preview width in pixels */
  previewWidth: number;
  
  /** Preview height in pixels */
  previewHeight: number;
  
  /** Offset from cursor (default: 20px) */
  offset?: number;
  
  /** Viewport width (window.innerWidth) */
  viewportWidth: number;
  
  /** Viewport height (window.innerHeight) */
  viewportHeight: number;
}
```

### Algorithm Steps

```typescript
function calculatePreviewPosition(input: PositionCalculationInput): PreviewPosition {
  const { 
    mouseX, 
    mouseY, 
    previewWidth, 
    previewHeight, 
    offset = 20,
    viewportWidth,
    viewportHeight,
  } = input;
  
  // Step 1: Default position (bottom-right of cursor)
  let x = mouseX + offset;
  let y = mouseY + offset;
  
  // Step 2: Check horizontal overflow
  if (x + previewWidth > viewportWidth) {
    // Position to left of cursor
    x = mouseX - previewWidth - offset;
  }
  
  // Step 3: Check vertical overflow
  if (y + previewHeight > viewportHeight) {
    // Position above cursor
    y = mouseY - previewHeight - offset;
  }
  
  // Step 4: Check left edge underflow
  if (x < 0) {
    // Force to right of cursor (prefer visible over offset)
    x = mouseX + offset;
  }
  
  // Step 5: Check top edge underflow
  if (y < 0) {
    // Force below cursor (prefer visible over offset)
    y = mouseY + offset;
  }
  
  // Step 6: Clamp to viewport (final safety)
  x = Math.max(0, Math.min(x, viewportWidth - previewWidth));
  y = Math.max(0, Math.min(y, viewportHeight - previewHeight));
  
  return { x, y };
}
```

### Position Examples

**Example 1: Cursor in center**
```
Input: mouseX=800, mouseY=400, preview=300×420, viewport=1920×1080, offset=20
Default: x=820, y=420
No collisions detected
Output: { x: 820, y: 420 } ✅
```

**Example 2: Cursor near right edge**
```
Input: mouseX=1800, mouseY=400, preview=300×420, viewport=1920×1080, offset=20
Default: x=1820, y=420
Right collision: 1820 + 300 = 2120 > 1920
Adjusted: x=1800-300-20=1480
Output: { x: 1480, y: 420 } ✅
```

**Example 3: Cursor in bottom-right corner**
```
Input: mouseX=1800, mouseY=1000, preview=300×420, viewport=1920×1080, offset=20
Default: x=1820, y=1020
Right collision: x=1480 (like example 2)
Bottom collision: 1020 + 420 = 1440 > 1080
Adjusted: y=1000-420-20=560
Output: { x: 1480, y: 560 } ✅
```

**Example 4: Preview larger than viewport (edge case)**
```
Input: mouseX=100, mouseY=100, preview=300×420, viewport=280×400, offset=20
Default: x=120, y=120
Right collision: 120+300=420 > 280 → x=-200 (negative!)
Left underflow: x=-200 < 0 → x=120
Final clamp: x=Math.min(120, 280-300)=Math.min(120, -20)=-20 → clamped to 0
Output: { x: 0, y: 0 } (preview starts at viewport origin)
```

### Performance Characteristics

- **Time Complexity**: O(1) - fixed number of comparisons
- **Space Complexity**: O(1) - no additional allocations
- **Execution Time**: <1ms on modern hardware
- **Invocation Frequency**: Up to 60 times per second (via RAF throttling)

---

## State Relationships

### Component State Hierarchy

```
CardPreviewProvider (Context)
  └─ AltKeyState: { isPressed: boolean }
      └─ useCardPreview (Hook)
          └─ PreviewState: { isActive, card, hoveredCardId, mouseX, mouseY }
              └─ CardPreview (Component)
                  ├─ PreviewPosition: { x, y } (calculated)
                  └─ PreviewDimensions: { width, height } (constant)
```

### Data Flow

```
User Input (Keyboard + Mouse)
  │
  ├─ Keyboard Events
  │   └─ CardPreviewProvider updates AltKeyState
  │       └─ All consuming components re-render
  │
  └─ Mouse Events
      ├─ onMouseEnter (Card)
      │   └─ useCardPreview.showPreview(card)
      │       └─ Updates PreviewState.isActive, .card, .hoveredCardId
      │
      ├─ onMouseLeave (Card)
      │   └─ useCardPreview.hidePreview(cardId)
      │       └─ Updates PreviewState.isActive, .card
      │
      └─ mousemove (Window)
          └─ Updates PreviewState.mouseX, .mouseY
              └─ Triggers position recalculation
                  └─ CardPreview re-renders at new position
```

### State Synchronization

**Invariants** (must always be true):
1. If `AltKeyState.isPressed === false`, then `PreviewState.isActive === false`
2. If `PreviewState.isActive === true`, then `PreviewState.card !== null`
3. If `PreviewState.isActive === true`, then `PreviewState.hoveredCardId !== null`
4. Only one preview can be active at a time (enforced by single PreviewState)

**Synchronization Points**:
- ALT release → Immediately hide preview (useEffect in useCardPreview)
- Card hover + ALT pressed → Show preview
- Mouse leave card → Hide preview (if current card)
- Switch cards → Update preview card (atomic operation)

---

## Memory Management

### State Lifecycle

**Creation**:
- `CardPreviewProvider` mounts → AltKeyState created
- Component using `useCardPreview` mounts → PreviewState created

**Updates**:
- ALT key events → AltKeyState updated → Context consumers re-render
- Mouse enter/leave → PreviewState updated → CardPreview re-renders
- Mouse move → PreviewState.mouseX/Y updated → Position recalculated

**Cleanup**:
- `CardPreviewProvider` unmounts → Keyboard listeners removed
- Preview hidden → Mouse move listener removed
- Component unmounts → RAF cancelled, references cleared

### Memory Footprint

**Per-Preview State**:
```
PreviewState: ~100 bytes
  - isActive: 1 byte
  - card: ~50 bytes (reference + metadata)
  - hoveredCardId: ~20 bytes (string)
  - mouseX/mouseY: 16 bytes (2 × 8-byte float)

AltKeyState: ~1 byte
  - isPressed: 1 byte (boolean)

Total: ~100 bytes
```

**Event Listeners**:
- 2 keyboard listeners (keydown, keyup): ~100 bytes each
- 1 mouse move listener (conditional): ~100 bytes
- Total: ~300 bytes

**Overall Memory Impact**: <1KB (negligible)

---

## Performance Considerations

### State Update Frequency

| Event | Frequency | Optimization |
|-------|-----------|--------------|
| ALT press/release | <10 per second | None needed (infrequent) |
| Mouse enter/leave | <5 per second | None needed (infrequent) |
| Mouse move | Up to 1000/sec | RAF throttling (→ 60/sec) |
| Position calculation | 60/sec (max) | O(1) algorithm, memoization |
| Component re-render | 60/sec (max) | React.memo, shallow compare |

### Optimization Strategies

1. **RAF Throttling**: Limits position updates to 60fps
2. **Lazy Listeners**: Mouse move listener only when preview active
3. **Memoization**: CardPreview component memoized, only re-renders on actual changes
4. **Passive Listeners**: `{ passive: true }` option for mouse events
5. **Shallow Comparison**: Position updates skipped if <1px change

### Bottleneck Analysis

**Potential Bottlenecks**:
- ❌ Position calculation: O(1), <1ms → Not a bottleneck
- ❌ Component re-renders: Memoized, shallow compare → Not a bottleneck
- ❌ Event listener overhead: Only 3 listeners → Not a bottleneck
- ✅ **No bottlenecks identified**

**Expected Performance**:
- Preview appearance delay: 30-40ms ✅ (<50ms target)
- Position update latency: 16.67ms ✅ (60fps target)
- CPU usage: <1% on modern hardware ✅
- Memory usage: <1KB ✅

---

## Validation Rules

### Runtime Validation

The following conditions should be validated in development mode:

```typescript
function validatePreviewState(state: PreviewState): void {
  if (state.isActive) {
    console.assert(state.card !== null, 'Active preview must have card');
    console.assert(state.hoveredCardId !== null, 'Active preview must track hovered card');
  }
  
  if (!state.isActive) {
    console.assert(state.card === null, 'Inactive preview should not have card');
  }
}

function validatePreviewPosition(pos: PreviewPosition, dimensions: PreviewDimensions): void {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  console.assert(pos.x >= 0, 'Position X must be >= 0');
  console.assert(pos.y >= 0, 'Position Y must be >= 0');
  console.assert(
    pos.x + dimensions.width <= viewportWidth,
    'Preview must not extend beyond right edge'
  );
  console.assert(
    pos.y + dimensions.height <= viewportHeight,
    'Preview must not extend beyond bottom edge'
  );
}
```

### Type Safety

All state structures use strict TypeScript types with no `any`:

```typescript
// ✅ Fully typed
const state: PreviewState = { ... };

// ❌ Never use any
const state: any = { ... };
```

---

## Summary

### Key Data Structures

| Structure | Purpose | Size | Mutation Frequency |
|-----------|---------|------|-------------------|
| `PreviewState` | Tracks active preview and mouse position | ~100 bytes | Up to 60/sec |
| `PreviewPosition` | Calculated render position | ~16 bytes | Up to 60/sec |
| `PreviewDimensions` | Fixed preview size | ~16 bytes | Never (constant) |
| `AltKeyState` | Global ALT key tracking | ~1 byte | <10/sec |

### Algorithm Complexity

| Algorithm | Time | Space | Invocations/sec |
|-----------|------|-------|-----------------|
| Position Calculation | O(1) | O(1) | 60 (max) |
| State Update | O(1) | O(1) | 60 (max) |
| Collision Detection | O(1) | O(1) | 60 (max) |

### Architectural Decisions

1. **Ephemeral State**: No persistence, all state resets on refresh
2. **Context for ALT Key**: Global state accessible to all cards
3. **Hook for Preview Logic**: Encapsulates state management and event handling
4. **Portal for Rendering**: Bypasses z-index stacking contexts
5. **RAF for Throttling**: Ensures smooth 60fps updates

---

## Next Steps

With data model defined, proceed to:
1. Generate `contracts/card-preview.ts` - TypeScript interface contracts
2. Generate `quickstart.md` - Developer guide
3. Update agent context with new data structures
