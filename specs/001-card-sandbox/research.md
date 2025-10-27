# Research: Card Sandbox Playfield

**Feature**: Card Sandbox Playfield  
**Date**: 2025-10-27  
**Status**: Complete

## Overview

This research document addresses technical decisions and best practices for implementing an interactive card game sandbox using Next.js 16, TypeScript, Supabase, and Tailwind CSS.

---

## 1. Session State Persistence with Supabase

### Decision
Use Supabase PostgreSQL database to persist game session state (card positions, hand contents, deck state) with browser session identification via localStorage session ID.

### Rationale
- Requirement specifies game state must survive browser refresh "as long as I end the session"
- Supabase provides real-time capabilities for future multiplayer expansion
- PostgreSQL is robust for structured game state data
- Session-based approach (not user authentication) simplifies single-player implementation

### Implementation Approach
```typescript
// Session identification
const sessionId = localStorage.getItem('gameSessionId') || generateSessionId();

// Database schema
table game_sessions {
  id: uuid primary key
  session_id: string unique
  deck_state: jsonb  // remaining cards
  hand_state: jsonb  // cards in hand
  playfield_state: jsonb  // cards on playfield
  created_at: timestamp
  updated_at: timestamp
}
```

### Alternatives Considered
- **localStorage only**: Rejected because JSON size limits (5-10MB) could be exceeded with large decks and image data
- **IndexedDB**: Rejected because adds complexity and Supabase is already required
- **Server-side sessions**: Rejected because user authentication adds unnecessary complexity for single-player sandbox

---

## 2. Temporary Deck Import (JSON)

### Decision
Import deck JSON files client-side, validate structure, store in React state (not database), initialize game session with imported deck data.

### Rationale
- Requirement: "imported json files are only temporary and will not be saved anywhere, just for this session"
- Client-side validation keeps UX responsive
- In-memory state sufficient since decks are not persisted
- Allows flexible deck formats for different card games

### JSON Schema Structure
```typescript
interface DeckImport {
  name: string;           // Deck name (e.g., "MTG Commander Deck")
  cards: Array<{
    id: string;           // Unique card identifier
    name: string;         // Card name (e.g., "Card 1", "Lightning Bolt")
    imageUrl?: string;    // Optional: future support for card images
    metadata?: Record<string, any>;  // Game-specific data
  }>;
}
```

### Validation Rules
- Minimum 1 card, maximum 200 cards (sanity check)
- Each card must have unique `id` and non-empty `name`
- File size limit: 5MB
- JSON structure must match schema

### Alternatives Considered
- **Store deck JSON in database**: Rejected per requirement (temporary only)
- **Binary deck formats**: Rejected for simplicity (JSON is human-readable and debuggable)
- **Server-side deck library**: Rejected as overengineering for v1

---

## 3. Component Architecture & State Management

### Decision
Use React Client Components with custom hooks for state management. No external state library (Redux, Zustand) for v1.

### Rationale
- Constitution principle: Component-First Architecture
- Game state is moderately complex but manageable with React hooks
- Custom `useGameState` hook centralizes state logic
- Keeps bundle size minimal (<200KB requirement)
- Avoids over-engineering for single-player v1

### Component Hierarchy
```
<Playfield> (Client Component - root game container)
├── <DeckImport> (Client - file upload and validation)
├── <Deck> (Client - clickable deck with draw logic)
├── <Hand> (Client - fixed bottom area)
│   └── <Card>[] (Client - individual cards)
└── <PlayfieldCards> (Client - cards played to field)
    └── <Card>[] (Client - individual cards)
```

### State Management Pattern
```typescript
// Custom hook consolidates game logic
function useGameState(sessionId: string) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [playfield, setPlayfield] = useState<Card[]>([]);
  
  // Auto-save to Supabase on state changes
  useEffect(() => {
    saveGameState(sessionId, { deck, hand, playfield });
  }, [deck, hand, playfield, sessionId]);
  
  const drawCard = () => { /* ... */ };
  const playCard = (cardId: string) => { /* ... */ };
  
  return { deck, hand, playfield, drawCard, playCard };
}
```

### Alternatives Considered
- **Redux/Redux Toolkit**: Rejected as overengineering for single-player; adds 30-50KB to bundle
- **Zustand**: Lightweight option but unnecessary for current scope
- **React Context**: Rejected because single parent component can manage state efficiently

---

## 4. Dark Mode Implementation

### Decision
Use Tailwind CSS `dark:` variant with Next.js theme provider for system preference detection and manual toggle.

### Rationale
- Constitution requirement: "dark mode should always be considered"
- Tailwind 4+ has built-in dark mode support
- Next.js `next-themes` package provides seamless theme switching
- Respects user system preferences by default

### Implementation
```typescript
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

// Tailwind config
// tailwind.config.ts
export default {
  darkMode: 'class',
  // ...
}
```

### Component Styling Pattern
```tsx
<div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">
  <button className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
    Draw Card
  </button>
</div>
```

### Alternatives Considered
- **CSS custom properties**: Rejected in favor of Tailwind's utility-first approach
- **Manual class toggling**: Rejected because `next-themes` handles SSR edge cases

---

## 5. Card Rendering & Layout

### Decision
Use CSS Grid for playfield layout, Flexbox for hand area. Cards are HTML div elements with Tailwind styling. Future: Next.js Image component for card images.

### Rationale
- Constitution: Responsive design required
- CSS Grid provides flexible 2D layout for playfield cards
- Flexbox handles linear hand arrangement at bottom
- HTML/CSS approach maintains <200KB bundle size
- Trading card aspect ratio: 63mm × 88mm (roughly 5:7 or 0.714 ratio)

### Card Dimensions
```css
/* Responsive card sizing */
.card {
  aspect-ratio: 5 / 7;  /* Trading card proportions */
  width: 100px;         /* Base size */
  /* Scales with Tailwind responsive utilities */
}

/* Tailwind classes */
className="w-20 sm:w-24 md:w-28 lg:w-32 aspect-[5/7]"
```

### Playfield Layout Strategy
```tsx
<div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 p-4">
  {playfieldCards.map(card => <Card key={card.id} {...card} />)}
</div>
```

### Hand Layout Strategy
```tsx
<div className="fixed bottom-0 left-0 right-0 bg-zinc-100 dark:bg-zinc-800 p-4">
  <div className="flex gap-2 overflow-x-auto max-w-screen-xl mx-auto">
    {handCards.map(card => <Card key={card.id} {...card} />)}
  </div>
</div>
```

### Alternatives Considered
- **Canvas rendering**: Rejected as overengineering; HTML/CSS sufficient for v1
- **Absolute positioning**: Rejected in favor of Grid for automatic layout and responsiveness
- **Fixed card sizes**: Rejected because responsive design is required

---

## 6. Performance Optimization

### Decision
- Lazy load DeckImport component (dynamic import)
- Memoize Card component with `React.memo`
- Debounce Supabase save operations (500ms)
- Use Next.js Image component for future card images

### Rationale
- Constitution: 90+ Lighthouse score, <200KB initial bundle
- Deck import UI not needed until user action (lazy load)
- Card components re-render frequently (memoization prevents unnecessary renders)
- Database writes batched to reduce Supabase API calls
- Image optimization critical for future card artwork

### Implementation
```typescript
// Lazy load deck import
const DeckImport = dynamic(() => import('@/components/game/DeckImport'), {
  loading: () => <div>Loading...</div>
});

// Memoized card component
export const Card = React.memo(({ id, name, onClick }: CardProps) => {
  return (
    <div onClick={onClick} className="...">
      {name}
    </div>
  );
});

// Debounced save
const debouncedSave = useMemo(
  () => debounce((state) => saveToSupabase(state), 500),
  []
);
```

### Alternatives Considered
- **Virtual scrolling for hand**: Deferred to future; unlikely to have 100+ cards in hand
- **Web Workers for deck validation**: Rejected as premature optimization
- **Service Worker caching**: Deferred to future; not critical for v1

---

## 7. Supabase Schema Design

### Decision
Single `game_sessions` table with JSONB columns for flexible state storage.

### Rationale
- Game state is hierarchical and varies (deck sizes, card metadata)
- JSONB in PostgreSQL provides flexibility and query capabilities
- Avoids over-normalization for simple single-player state
- Easy to extend for future features (undo/redo, game history)

### Schema
```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(64) UNIQUE NOT NULL,
  deck_state JSONB NOT NULL DEFAULT '[]'::jsonb,
  hand_state JSONB NOT NULL DEFAULT '[]'::jsonb,
  playfield_state JSONB NOT NULL DEFAULT '[]'::jsonb,
  deck_metadata JSONB,  -- Stores imported deck name, original card count
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_sessions_session_id ON game_sessions(session_id);
CREATE INDEX idx_game_sessions_updated_at ON game_sessions(updated_at);
```

### Cleanup Strategy
Auto-delete sessions older than 7 days (Supabase cron job or manual cleanup).

### Alternatives Considered
- **Normalized schema** (separate cards table): Rejected as overengineering; JSONB sufficient
- **Redis/In-memory**: Rejected because persistence required across browser refreshes
- **localStorage only**: Rejected due to size limits

---

## 8. Accessibility Considerations

### Decision
- Semantic HTML: `<button>` for deck, `<ul>/<li>` for hand/playfield
- ARIA labels: `aria-label="Draw card from deck"`, `aria-label="Card: Lightning Bolt"`
- Keyboard navigation: Tab through cards, Enter/Space to interact
- Focus visible styles with Tailwind `focus-visible:` utilities

### Implementation
```tsx
<button
  onClick={drawCard}
  aria-label="Draw card from deck"
  className="focus-visible:ring-2 focus-visible:ring-blue-500"
>
  <DeckIcon />
  {deckCount} cards remaining
</button>

<div role="list" aria-label="Your hand">
  {hand.map(card => (
    <button
      key={card.id}
      role="listitem"
      aria-label={`Card: ${card.name}`}
      onClick={() => playCard(card.id)}
    >
      <Card {...card} />
    </button>
  ))}
</div>
```

### Alternatives Considered
- **Screen reader announcements for game actions**: Deferred to future enhancement
- **High contrast mode**: Covered by Tailwind dark mode implementation

---

## Research Summary

All technical decisions support the constitution's four core principles:

1. **Type Safety**: TypeScript strict mode throughout with explicit interfaces
2. **Component-First**: Reusable Card, Deck, Hand, Playfield components
3. **UX Consistency**: Tailwind design system, dark mode, responsive, accessible
4. **Performance**: <200KB bundle, lazy loading, memoization, optimized rendering

Next steps: Phase 1 (Data Model, Contracts, Quickstart)
