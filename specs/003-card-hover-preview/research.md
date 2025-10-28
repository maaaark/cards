# Research: Card Hover Preview with ALT Key

**Feature**: `003-card-hover-preview`  
**Date**: October 28, 2025  
**Purpose**: Research technical approaches for implementing ALT+hover card preview with optimal performance

## Table of Contents

1. [ALT Key State Management](#alt-key-state-management)
2. [Event Listener Optimization](#event-listener-optimization)
3. [Viewport Positioning Algorithm](#viewport-positioning-algorithm)
4. [React Portal for Overlay Rendering](#react-portal-for-overlay-rendering)
5. [Performance Optimization Strategies](#performance-optimization-strategies)
6. [Mouse Tracking and Smooth Following](#mouse-tracking-and-smooth-following)

---

## ALT Key State Management

### Decision

Use React Context + global `keydown`/`keyup` listeners to track ALT key state application-wide.

### Rationale

**User Requirements Analysis**:
- "Holding ALT over a card will preview it" → ALT state must be known by all cards
- "Holding alt and moving the mouse off the card will hide the preview but when i hover another card while holding ALT, this new card will be previewed" → ALT state persists across card boundaries
- "Releasing ALT will always hide the preview" → Global ALT release must trigger preview dismissal
- "Pressing or holding ALT will always show the preview" → ALT state must be reactive and immediate

This behavior requires global ALT state that all Card components can access without prop drilling.

**Implementation Strategy**:

```typescript
// Context pattern for global ALT state
const AltKeyContext = React.createContext({ isAltPressed: false });

// Provider with global listeners
function CardPreviewProvider({ children }) {
  const [isAltPressed, setIsAltPressed] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setIsAltPressed(true);
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setIsAltPressed(false);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  return (
    <AltKeyContext.Provider value={{ isAltPressed }}>
      {children}
    </AltKeyContext.Provider>
  );
}
```

**Key Benefits**:
- Single global keyboard listener (meets performance requirement: <3 listeners)
- All cards reactively receive ALT state via Context
- No prop drilling through component hierarchy
- Automatic cleanup on provider unmount

### Alternatives Considered

1. **Individual keyboard listeners per card**: Rejected - would create 10-50+ listeners (violates performance requirement)
2. **Event bubbling from document**: Rejected - requires custom event system, more complex
3. **Redux/Zustand global state**: Rejected - overkill for single boolean flag, adds dependency

---

## Event Listener Optimization

### Decision

Use hierarchical event listener strategy:
1. **Global keyboard listener** (ALT key) - always active
2. **Per-card mouse enter/leave listeners** - always active (native React events)
3. **Global mouse move listener** - only active when preview is showing

### Rationale

**Performance Constraint**: Maximum 3 active event listeners during preview display.

**Event Listener Count**:
- 1 global `keydown` listener (ALT detection)
- 1 global `keyup` listener (ALT release)
- 1 global `mousemove` listener (only when preview active)
- Total: 3 listeners ✅

**Why not individual mouse move listeners per card?**
- Would create 10-50+ listeners (one per card)
- Violates performance requirement
- Unnecessary since only one preview can be active at a time

**Why native React onMouseEnter/onMouseLeave is acceptable?**
- React's synthetic event system uses event delegation (single listener at root)
- Doesn't count as "per-card" listeners in performance budget
- Standard React pattern with no performance penalty

### Implementation Pattern

```typescript
function useCardPreview() {
  const [previewState, setPreviewState] = useState(null);
  
  useEffect(() => {
    // Only add mousemove listener when preview is active
    if (!previewState) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setPreviewState(prev => ({
        ...prev,
        mouseX: e.clientX,
        mouseY: e.clientY,
      }));
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [previewState?.isActive]);
}
```

### Alternatives Considered

1. **Always-active mouse move listener**: Rejected - wastes CPU cycles when no preview showing
2. **Per-card mouse move listeners**: Rejected - violates performance constraint (too many listeners)
3. **Pointer events API**: Considered but standard MouseEvent sufficient for web use case

---

## Viewport Positioning Algorithm

### Decision

Calculate preview position using viewport bounds checking with smart fallback positioning.

### Rationale

**Requirements**:
- FR-007: Preview must be 100% visible within viewport
- FR-008: Dynamically adjust position near viewport edges
- SC-003: 0% clipping in all edge cases

**Algorithm Steps**:

1. **Get viewport dimensions**: `window.innerWidth`, `window.innerHeight`
2. **Define preview size**: Base on card size (e.g., 2x original, ~300px width × 420px height)
3. **Default position**: 20px offset from cursor (bottom-right)
4. **Collision detection**:
   - If preview right edge > viewport width → position left of cursor
   - If preview bottom edge > viewport height → position above cursor
   - If preview left edge < 0 → position right of cursor
   - If preview top edge < 0 → position below cursor
5. **Clamp to viewport**: Final position clamped to [0, viewport - preview size]

### Implementation

```typescript
interface PreviewPosition {
  x: number;
  y: number;
}

function calculatePreviewPosition(
  mouseX: number,
  mouseY: number,
  previewWidth: number,
  previewHeight: number,
  offset: number = 20
): PreviewPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Default: bottom-right of cursor
  let x = mouseX + offset;
  let y = mouseY + offset;
  
  // Check right edge collision
  if (x + previewWidth > viewportWidth) {
    x = mouseX - previewWidth - offset;
  }
  
  // Check bottom edge collision
  if (y + previewHeight > viewportHeight) {
    y = mouseY - previewHeight - offset;
  }
  
  // Check left edge collision
  if (x < 0) {
    x = mouseX + offset;
  }
  
  // Check top edge collision
  if (y < 0) {
    y = mouseY + offset;
  }
  
  // Clamp to viewport bounds (final safety check)
  x = Math.max(0, Math.min(x, viewportWidth - previewWidth));
  y = Math.max(0, Math.min(y, viewportHeight - previewHeight));
  
  return { x, y };
}
```

### Edge Case Handling

- **Corner positioning**: Algorithm automatically handles corners by checking both axes
- **Preview larger than viewport**: Clamping ensures preview starts at (0, 0) and extends to edge
- **Window resize**: Re-calculate position on resize or hide preview if card no longer visible

### Alternatives Considered

1. **Fixed position (always above/below)**: Rejected - doesn't utilize available space efficiently
2. **Popper.js library**: Rejected - overkill for simple positioning, adds 5KB+ to bundle
3. **CSS-only positioning**: Rejected - cannot handle dynamic viewport constraints

---

## React Portal for Overlay Rendering

### Decision

Use `ReactDOM.createPortal` to render preview at document body level.

### Rationale

**Requirements**:
- FR-009: Hand card previews must render above hand container (z-index: 50)
- FR-010: Board card previews must render above board elements
- SC-007: Preview renders above all game elements

**Why Portal?**
- Renders preview outside parent component's DOM hierarchy
- Avoids z-index stacking context issues with parent containers
- Hand container has `z-index: 50` - portal bypasses this
- Performance: No parent re-renders when preview position updates

**Implementation**:

```typescript
function CardPreview({ card, position }) {
  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999, // Above all game elements
      }}
      className="pointer-events-none" // Prevent blocking mouse events
    >
      <Card card={card} location="preview" />
    </div>,
    document.body // Render at body level
  );
}
```

**CSS Strategy**:
- `position: fixed` - positions relative to viewport, not parent
- `z-index: 9999` - above Hand (50), Playfield, and all other elements
- `pointer-events-none` - preview doesn't block mouse interactions

### Alternatives Considered

1. **Render in-place with high z-index**: Rejected - z-index stacking context prevents working above hand
2. **Separate overlay root**: Rejected - unnecessary complexity, body is sufficient
3. **Absolute positioning**: Rejected - requires portal parent to be positioned, fixed simpler

---

## Performance Optimization Strategies

### Decision

Multi-layered optimization approach:

1. **Lazy listener attachment**: Mouse move listener only when preview active
2. **RequestAnimationFrame**: Throttle position updates to 60fps
3. **React.memo**: Memoize CardPreview component
4. **Debounced position updates**: Batch rapid mouse movements
5. **Conditional rendering**: Only render preview when visible

### Rationale

**Performance Goals**:
- SC-001: <50ms preview appearance delay
- SC-002: 60fps position tracking (16.67ms per frame)
- SC-005: Toggle 10+ times per second without degradation
- SC-006: Maximum 3 active event listeners

**Implementation Strategies**:

#### 1. RequestAnimationFrame Throttling

```typescript
function useCardPreview() {
  const rafRef = useRef<number | null>(null);
  
  const updatePosition = useCallback((x: number, y: number) => {
    // Cancel pending frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    // Schedule update on next frame (60fps)
    rafRef.current = requestAnimationFrame(() => {
      setPreviewPosition(calculatePreviewPosition(x, y, 300, 420));
    });
  }, []);
  
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
}
```

**Benefits**:
- Limits position updates to 60fps (browser refresh rate)
- Prevents layout thrashing from excessive updates
- Automatic batching of rapid mouse movements

#### 2. Memoization Strategy

```typescript
// Memoize preview component to prevent re-renders
const CardPreview = React.memo(({ card, position }) => {
  // Only re-render when card or position actually changes
  return ReactDOM.createPortal(
    <div style={{ left: position.x, top: position.y }}>
      <Card card={card} location="preview" />
    </div>,
    document.body
  );
});

// Custom comparison for position changes
function arePositionsEqual(prevProps, nextProps) {
  return (
    prevProps.card.id === nextProps.card.id &&
    Math.abs(prevProps.position.x - nextProps.position.x) < 1 &&
    Math.abs(prevProps.position.y - nextProps.position.y) < 1
  );
}
```

#### 3. Lazy Listener Pattern

```typescript
// Only attach mousemove listener when preview is showing
useEffect(() => {
  if (!isPreviewActive) return; // Skip when hidden
  
  const handleMouseMove = (e: MouseEvent) => {
    updatePosition(e.clientX, e.clientY);
  };
  
  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  return () => window.removeEventListener('mousemove', handleMouseMove);
}, [isPreviewActive, updatePosition]);
```

**Why `passive: true`?**
- Tells browser listener won't call `preventDefault()`
- Enables performance optimizations in browser
- Reduces input latency

### Performance Metrics

**Expected Results**:
- Preview appearance: ~30-40ms (well under 50ms target)
- Position update: 16.67ms per frame (60fps)
- Memory overhead: ~100KB (preview state + cached positions)
- Bundle size impact: ~2-3KB gzipped

### Alternatives Considered

1. **Throttling with setTimeout**: Rejected - less smooth than RAF, can miss frames
2. **CSS transforms for positioning**: Rejected - fixed positioning simpler and equally performant
3. **Web Workers for position calculation**: Rejected - overkill, calculation is <1ms

---

## Mouse Tracking and Smooth Following

### Decision

Use direct mouse coordinate tracking with requestAnimationFrame for smooth preview following.

### Rationale

**Requirements from User**:
- "the card will be shown as a bigger preview next to my mouse cursor, and it will move with the mouse"
- "Holding alt and moving the mouse off the card will hide the preview but when i hover another card while holding ALT, this new card will be previewed"

**Key Behaviors**:

1. **Preview follows cursor**: Update preview position on every mousemove
2. **Hide when leaving card (while ALT held)**: Track current hovered card
3. **Show new preview when hovering different card (while ALT held)**: Replace preview with new card

### State Machine

```
States:
- IDLE: No preview showing, ALT not pressed
- ALT_PRESSED: ALT pressed, no card hovered
- PREVIEW_ACTIVE: ALT pressed, card hovered, preview showing

Transitions:
- IDLE → ALT_PRESSED: User presses ALT
- ALT_PRESSED → PREVIEW_ACTIVE: Mouse enters card while ALT held
- PREVIEW_ACTIVE → ALT_PRESSED: Mouse leaves card while ALT held
- PREVIEW_ACTIVE → PREVIEW_ACTIVE: Mouse enters different card while ALT held (switch card)
- PREVIEW_ACTIVE → IDLE: User releases ALT
- ALT_PRESSED → IDLE: User releases ALT
```

### Implementation

```typescript
interface PreviewState {
  isActive: boolean;
  card: Card | null;
  hoveredCardId: string | null; // Track which card is hovered
  mouseX: number;
  mouseY: number;
}

function useCardPreview() {
  const { isAltPressed } = useAltKey();
  const [previewState, setPreviewState] = useState<PreviewState>({
    isActive: false,
    card: null,
    hoveredCardId: null,
    mouseX: 0,
    mouseY: 0,
  });
  
  // When ALT is released, hide preview
  useEffect(() => {
    if (!isAltPressed) {
      setPreviewState(prev => ({
        ...prev,
        isActive: false,
        card: null,
      }));
    }
  }, [isAltPressed]);
  
  // Show preview for a card
  const showPreview = useCallback((card: Card) => {
    if (!isAltPressed) return; // Only if ALT held
    
    setPreviewState(prev => ({
      ...prev,
      isActive: true,
      card,
      hoveredCardId: card.id,
    }));
  }, [isAltPressed]);
  
  // Hide preview when leaving card
  const hidePreview = useCallback((cardId: string) => {
    setPreviewState(prev => {
      // Only hide if we're leaving the currently previewed card
      if (prev.hoveredCardId === cardId) {
        return {
          ...prev,
          isActive: false,
          card: null,
          hoveredCardId: null,
        };
      }
      return prev;
    });
  }, []);
  
  return { previewState, showPreview, hidePreview };
}
```

### Card Component Integration

```typescript
// In Card.tsx
function Card({ card, location, onClick }) {
  const { isAltPressed } = useAltKey();
  const { showPreview, hidePreview } = useCardPreview();
  
  const handleMouseEnter = () => {
    if (isAltPressed) {
      showPreview(card);
    }
  };
  
  const handleMouseLeave = () => {
    hidePreview(card.id);
  };
  
  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      // ... rest of card JSX
    />
  );
}
```

**Key Behaviors Satisfied**:
- ✅ "Holding ALT over a card will preview it" - `handleMouseEnter` checks `isAltPressed`
- ✅ "Moving mouse off card hides preview" - `handleMouseLeave` called
- ✅ "Hover another card while holding ALT shows new preview" - `showPreview` replaces current preview
- ✅ "Releasing ALT always hides preview" - `useEffect` on `isAltPressed` handles this

### Smooth Following

```typescript
// Mouse move handler (only active when preview showing)
useEffect(() => {
  if (!previewState.isActive) return;
  
  const rafRef = { current: null };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      setPreviewState(prev => ({
        ...prev,
        mouseX: e.clientX,
        mouseY: e.clientY,
      }));
    });
  };
  
  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  
  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  };
}, [previewState.isActive]);
```

### Alternatives Considered

1. **Pointer Lock API**: Rejected - overkill, designed for gaming/3D applications
2. **CSS hover with transition**: Rejected - cannot implement "hide when mouse leaves" while ALT held
3. **Intersection Observer**: Rejected - designed for viewport intersection, not mouse tracking

---

## Summary

### Key Technical Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **ALT State** | React Context with global listeners | Single source of truth, all cards access same state |
| **Event Listeners** | 3 total: 2 keyboard (keydown/up), 1 mousemove (conditional) | Meets performance constraint, optimal efficiency |
| **Positioning** | Viewport bounds algorithm with smart fallbacks | Ensures 0% clipping, handles all edge cases |
| **Rendering** | React Portal to document.body | Bypasses z-index stacking contexts |
| **Performance** | RAF throttling + memoization + lazy listeners | Achieves 60fps with minimal overhead |
| **Mouse Tracking** | Direct coordinate tracking with state machine | Satisfies all user-specified behaviors |

### Implementation Complexity

- **Estimated Lines of Code**: 200-300 LOC
- **New Files**: 6 files (2 components, 2 hooks, 1 util, 1 types)
- **Modified Files**: 2 files (Card.tsx, page.tsx)
- **Bundle Size Impact**: ~2-3KB gzipped
- **Performance Impact**: Negligible when preview hidden, <1ms overhead when active

### Risk Assessment

**Low Risk**:
- Well-established patterns (Context, Portal, RAF)
- No external dependencies added
- Isolated feature (doesn't modify existing functionality)

**Medium Risk**:
- Browser compatibility for ALT key detection (handled via polyfills if needed)
- Window resize edge cases (mitigated by recalculation on resize)

**Mitigation Strategies**:
- Graceful degradation if Portal not supported (rare, all modern browsers support)
- Comprehensive edge case testing for positioning algorithm
- Performance profiling to verify 60fps target met

---

## Next Steps

With research complete, proceed to **Phase 1: Design & Contracts**:

1. Generate `data-model.md` - Define preview state types and positioning data structures
2. Generate `contracts/card-preview.ts` - TypeScript interfaces for hooks and components
3. Generate `quickstart.md` - Developer guide for using the preview feature
4. Update agent context with new technical decisions
