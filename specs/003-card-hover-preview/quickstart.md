# Quickstart: Card Hover Preview with ALT Key

**Feature**: `003-card-hover-preview`  
**Date**: October 28, 2025  
**For**: Developers implementing or using the card preview feature

## Overview

This guide explains how to implement and use the card hover preview feature. The feature displays an enlarged card preview when users hold the ALT key while hovering over any card.

---

## Table of Contents

1. [Quick Start (5 minutes)](#quick-start-5-minutes)
2. [Implementation Steps](#implementation-steps)
3. [Usage Examples](#usage-examples)
4. [API Reference](#api-reference)
5. [Troubleshooting](#troubleshooting)
6. [Performance Tips](#performance-tips)

---

## Quick Start (5 minutes)

### Step 1: Wrap Your App with Provider

```tsx
// app/game/page.tsx
import { CardPreviewProvider } from '../components/game/CardPreviewProvider';

export default function GamePage() {
  return (
    <CardPreviewProvider>
      {/* Your game components */}
      <Playfield />
      <Hand />
    </CardPreviewProvider>
  );
}
```

### Step 2: Cards Automatically Work

Cards automatically support preview when wrapped in `CardPreviewProvider`. No additional changes needed to Card component props.

### Step 3: Test It

1. Run the dev server: `npm run dev`
2. Open game page
3. Hold ALT key
4. Hover over any card
5. Preview appears and follows mouse!

---

## Implementation Steps

### 1. Create CardPreviewProvider (Context + ALT Key Tracking)

```tsx
// app/components/game/CardPreviewProvider.tsx
'use client';

import { createContext, useState, useEffect, ReactNode } from 'react';
import type { AltKeyContextValue } from '@/app/lib/types/card-preview';

export const AltKeyContext = createContext<AltKeyContextValue>({
  isAltPressed: false,
});

export function CardPreviewProvider({ children }: { children: ReactNode }) {
  const [isAltPressed, setIsAltPressed] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setIsAltPressed(true);
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setIsAltPressed(false);
    };
    
    // Safety: Reset on window blur (e.g., Alt+Tab)
    const handleBlur = () => setIsAltPressed(false);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);
  
  return (
    <AltKeyContext.Provider value={{ isAltPressed }}>
      {children}
    </AltKeyContext.Provider>
  );
}
```

### 2. Create useAltKey Hook

```tsx
// app/lib/hooks/useAltKey.ts
'use client';

import { useContext } from 'react';
import { AltKeyContext } from '@/app/components/game/CardPreviewProvider';
import type { UseAltKeyReturn } from '@/app/lib/types/card-preview';

export function useAltKey(): UseAltKeyReturn {
  const context = useContext(AltKeyContext);
  
  if (!context) {
    throw new Error('useAltKey must be used within CardPreviewProvider');
  }
  
  return { isAltPressed: context.isAltPressed };
}
```

### 3. Create Position Calculation Utility

```tsx
// app/lib/utils/preview-position.ts
import type {
  PreviewPosition,
  PositionCalculationInput,
} from '@/app/lib/types/card-preview';

export function calculatePreviewPosition(
  input: PositionCalculationInput
): PreviewPosition {
  const {
    mouseX,
    mouseY,
    previewWidth,
    previewHeight,
    offset = 20,
    viewportWidth,
    viewportHeight,
  } = input;
  
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
  
  // Check left edge underflow
  if (x < 0) {
    x = mouseX + offset;
  }
  
  // Check top edge underflow
  if (y < 0) {
    y = mouseY + offset;
  }
  
  // Clamp to viewport bounds (final safety)
  x = Math.max(0, Math.min(x, viewportWidth - previewWidth));
  y = Math.max(0, Math.min(y, viewportHeight - previewHeight));
  
  return { x, y };
}
```

### 4. Create useCardPreview Hook

```tsx
// app/lib/hooks/useCardPreview.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAltKey } from './useAltKey';
import { calculatePreviewPosition } from '../utils/preview-position';
import {
  DEFAULT_PREVIEW_DIMENSIONS,
  DEFAULT_PREVIEW_OFFSET,
} from '@/app/lib/types/card-preview';
import type {
  Card,
  PreviewState,
  UseCardPreviewReturn,
} from '@/app/lib/types/card-preview';

export function useCardPreview(): UseCardPreviewReturn {
  const { isAltPressed } = useAltKey();
  const [previewState, setPreviewState] = useState<PreviewState>({
    isActive: false,
    card: null,
    hoveredCardId: null,
    mouseX: 0,
    mouseY: 0,
  });
  
  const rafRef = useRef<number | null>(null);
  
  // Hide preview when ALT released
  useEffect(() => {
    if (!isAltPressed) {
      setPreviewState(prev => ({
        ...prev,
        isActive: false,
        card: null,
        hoveredCardId: null,
      }));
    }
  }, [isAltPressed]);
  
  // Track mouse position when preview active
  useEffect(() => {
    if (!previewState.isActive) return;
    
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
  
  // Show preview for card
  const showPreview = useCallback((card: Card) => {
    if (!isAltPressed) return;
    
    setPreviewState(prev => ({
      ...prev,
      isActive: true,
      card,
      hoveredCardId: card.id,
    }));
  }, [isAltPressed]);
  
  // Hide preview for card
  const hidePreview = useCallback((cardId: string) => {
    setPreviewState(prev => {
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
  
  // Calculate position
  const previewPosition = previewState.isActive
    ? calculatePreviewPosition({
        mouseX: previewState.mouseX,
        mouseY: previewState.mouseY,
        previewWidth: DEFAULT_PREVIEW_DIMENSIONS.width,
        previewHeight: DEFAULT_PREVIEW_DIMENSIONS.height,
        offset: DEFAULT_PREVIEW_OFFSET,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      })
    : null;
  
  return {
    previewState,
    showPreview,
    hidePreview,
    previewPosition,
    previewDimensions: DEFAULT_PREVIEW_DIMENSIONS,
  };
}
```

### 5. Create CardPreview Component

```tsx
// app/components/game/CardPreview.tsx
'use client';

import { memo } from 'react';
import ReactDOM from 'react-dom';
import { Card } from './Card';
import { PREVIEW_Z_INDEX } from '@/app/lib/types/card-preview';
import type { CardPreviewProps } from '@/app/lib/types/card-preview';

function CardPreviewComponent({
  card,
  position,
  dimensions,
  className = '',
}: CardPreviewProps) {
  // Render to document.body via Portal (bypasses z-index stacking)
  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        zIndex: PREVIEW_Z_INDEX,
        pointerEvents: 'none', // Don't block mouse events
      }}
      className={`transition-opacity duration-200 ${className}`}
    >
      <Card
        card={card}
        location="playfield" // Use playfield styling
        disabled={true} // Not interactive
        className="shadow-2xl"
      />
    </div>,
    document.body
  );
}

// Memoize to prevent unnecessary re-renders
export const CardPreview = memo(CardPreviewComponent);
```

### 6. Update Card Component

```tsx
// app/components/game/Card.tsx (add preview handlers)
'use client';

import { useAltKey } from '@/app/lib/hooks/useAltKey';
import { useCardPreview } from '@/app/lib/hooks/useCardPreview';

export function Card({ card, onClick, disabled, className, location }: CardProps) {
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
      className={cardClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      // ... rest of props
    >
      {/* Card content */}
    </div>
  );
}
```

### 7. Render CardPreview Globally

```tsx
// app/game/page.tsx (or in CardPreviewProvider)
'use client';

import { useCardPreview } from '@/app/lib/hooks/useCardPreview';
import { CardPreview } from '../components/game/CardPreview';

function GameWithPreview() {
  const { previewState, previewPosition, previewDimensions } = useCardPreview();
  
  return (
    <>
      {/* Game components */}
      <Playfield />
      <Hand />
      
      {/* Preview overlay */}
      {previewState.isActive && previewPosition && previewState.card && (
        <CardPreview
          card={previewState.card}
          position={previewPosition}
          dimensions={previewDimensions}
        />
      )}
    </>
  );
}
```

---

## Usage Examples

### Example 1: Basic Integration

```tsx
// Minimal setup
import { CardPreviewProvider } from './components/game/CardPreviewProvider';

function App() {
  return (
    <CardPreviewProvider>
      <YourGameComponents />
    </CardPreviewProvider>
  );
}
```

### Example 2: Custom Preview Dimensions

```tsx
// Override default dimensions
const CUSTOM_DIMENSIONS = {
  width: 400,  // Larger preview
  height: 560,
};

// Use in useCardPreview or pass to CardPreview
```

### Example 3: Conditional Preview (Desktop Only)

```tsx
function GamePage() {
  const [isMobile] = useState(() => window.innerWidth < 768);
  
  return (
    <>
      {!isMobile && <CardPreviewProvider>{/* ... */}</CardPreviewProvider>}
      {isMobile && {/* No preview on mobile */}}
    </>
  );
}
```

---

## API Reference

### Hooks

#### `useAltKey()`

Returns current ALT key state.

```typescript
const { isAltPressed } = useAltKey();
```

**Returns**: `{ isAltPressed: boolean }`

#### `useCardPreview()`

Manages preview state and operations.

```typescript
const {
  previewState,
  showPreview,
  hidePreview,
  previewPosition,
  previewDimensions,
} = useCardPreview();
```

**Returns**:
- `previewState`: Current preview state
- `showPreview(card)`: Show preview for card
- `hidePreview(cardId)`: Hide preview
- `previewPosition`: Calculated position (null if hidden)
- `previewDimensions`: Fixed preview dimensions

### Components

#### `<CardPreviewProvider>`

Provides global ALT key state.

```tsx
<CardPreviewProvider>
  {children}
</CardPreviewProvider>
```

**Props**: `{ children: ReactNode }`

#### `<CardPreview>`

Renders preview overlay.

```tsx
<CardPreview
  card={card}
  position={position}
  dimensions={dimensions}
  className="optional-classes"
/>
```

**Props**:
- `card`: Card to preview
- `position`: Viewport position `{ x, y }`
- `dimensions`: Preview size `{ width, height }`
- `className` (optional): Additional CSS classes

### Utilities

#### `calculatePreviewPosition(input)`

Calculates optimal preview position.

```typescript
const position = calculatePreviewPosition({
  mouseX: 100,
  mouseY: 200,
  previewWidth: 300,
  previewHeight: 420,
  offset: 20,
  viewportWidth: 1920,
  viewportHeight: 1080,
});
```

**Returns**: `{ x: number, y: number }`

---

## Troubleshooting

### Preview Not Showing

**Problem**: Preview doesn't appear when holding ALT and hovering card.

**Solutions**:
1. Check CardPreviewProvider wraps your components
2. Verify Card component has preview handlers (onMouseEnter/Leave)
3. Check browser console for errors
4. Verify ALT key not captured by browser (try different key)

### Preview Clips Off Screen

**Problem**: Preview extends beyond viewport edge.

**Solutions**:
1. Verify `calculatePreviewPosition` is used correctly
2. Check viewport dimensions are current (not cached)
3. Test position calculation with console.log

### Performance Issues

**Problem**: Lag when moving mouse with preview active.

**Solutions**:
1. Verify requestAnimationFrame is used (not setState directly)
2. Check CardPreview is memoized
3. Ensure only 1 mousemove listener active (in useCardPreview)
4. Profile with React DevTools to find re-render causes

### Preview Shows Wrong Card

**Problem**: Preview shows different card than hovered.

**Solutions**:
1. Check `hoveredCardId` matches card being hovered
2. Verify `hidePreview` checks cardId before hiding
3. Test with console.log in showPreview/hidePreview

---

## Performance Tips

### 1. Minimize Re-renders

```tsx
// ✅ Good: Memoize component
const CardPreview = memo(CardPreviewComponent);

// ❌ Bad: No memoization
const CardPreview = CardPreviewComponent;
```

### 2. Use RAF for Position Updates

```tsx
// ✅ Good: Throttle to 60fps
rafRef.current = requestAnimationFrame(() => {
  setPosition({ x, y });
});

// ❌ Bad: Update on every mousemove
setPosition({ x, y }); // Called 100+ times per second
```

### 3. Lazy Listener Attachment

```tsx
// ✅ Good: Only when active
useEffect(() => {
  if (!isActive) return;
  window.addEventListener('mousemove', handler);
}, [isActive]);

// ❌ Bad: Always listening
useEffect(() => {
  window.addEventListener('mousemove', handler);
}, []);
```

### 4. Passive Event Listeners

```tsx
// ✅ Good: Enable optimizations
window.addEventListener('mousemove', handler, { passive: true });

// ❌ Bad: No passive flag
window.addEventListener('mousemove', handler);
```

### 5. Viewport Dimension Caching

```tsx
// ✅ Good: Cache dimensions, update on resize
const [viewport, setViewport] = useState({
  width: window.innerWidth,
  height: window.innerHeight,
});

useEffect(() => {
  const handleResize = () => setViewport({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

// ❌ Bad: Read dimensions on every position calculation
const width = window.innerWidth; // Causes reflow
```

---

## Testing Checklist

- [ ] Preview appears when ALT+hovering card
- [ ] Preview follows mouse smoothly (no jitter)
- [ ] Preview hides when releasing ALT
- [ ] Preview hides when mouse leaves card
- [ ] Preview switches when hovering different card (ALT held)
- [ ] Preview stays within viewport at all edges
- [ ] Preview works on cards in hand
- [ ] Preview works on cards on playfield
- [ ] Preview works on deck
- [ ] No performance degradation after 10+ toggles
- [ ] Works in dark mode
- [ ] Existing card interactions still work
- [ ] No console errors

---

## Next Steps

1. Implement feature following steps above
2. Test thoroughly using checklist
3. Profile performance with React DevTools
4. Consider responsive behavior for mobile
5. Add custom styling if desired

For implementation tasks, see [`tasks.md`](./tasks.md) (generated by `/speckit.tasks` command).
