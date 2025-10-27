# Quickstart Guide: Card Sandbox Playfield

**Feature**: Card Sandbox Playfield  
**Date**: 2025-10-27  
**Audience**: Developers implementing this feature

## Overview

This guide provides step-by-step instructions for implementing the Card Sandbox Playfield feature, from environment setup through deployment.

---

## Prerequisites

- Node.js 20+ installed
- npm, pnpm, yarn, or bun package manager
- Supabase account (free tier sufficient)
- Git repository initialized
- Code editor with TypeScript support (VS Code recommended)

---

## Step 1: Environment Setup

### 1.1 Install Dependencies

The project already has Next.js, React, and Tailwind CSS installed. Add Supabase SDK:

```bash
npm install @supabase/supabase-js
npm install --save-dev @types/uuid uuid
```

### 1.2 Configure Supabase

1. Create a new Supabase project at https://supabase.com
2. Copy your project URL and anon key
3. Create `.env.local` in project root:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Add `.env.local` to `.gitignore` (should already be there)

### 1.3 Create Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- Create game_sessions table
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(64) UNIQUE NOT NULL,
  deck_state JSONB NOT NULL DEFAULT '{"cards": [], "originalCount": 0}'::jsonb,
  hand_state JSONB NOT NULL DEFAULT '{"cards": []}'::jsonb,
  playfield_state JSONB NOT NULL DEFAULT '{"cards": []}'::jsonb,
  deck_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_game_sessions_session_id ON game_sessions(session_id);
CREATE INDEX idx_game_sessions_updated_at ON game_sessions(updated_at);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Step 2: Project Structure Setup

### 2.1 Create Directories

```bash
# From project root
mkdir -p app/game
mkdir -p app/components/game
mkdir -p app/components/ui
mkdir -p app/lib/types
mkdir -p app/lib/hooks
mkdir -p app/lib/utils
mkdir -p app/lib/supabase
mkdir -p public/cards
```

### 2.2 Copy Type Definitions

Copy `specs/001-card-sandbox/contracts/game-state.ts` to `app/lib/types/game.ts`

---

## Step 3: Core Implementation

### 3.1 Supabase Client (`app/lib/supabase/client.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3.2 Utility Functions (`app/lib/utils/deck.ts`)

```typescript
import { v4 as uuidv4 } from 'uuid';
import { Card, DeckImport, DeckImportValidation, DECK_IMPORT_CONSTRAINTS } from '../types/game';

export function generateTestDeck(size: number = 20): DeckImport {
  return {
    name: 'Test Deck',
    cards: Array.from({ length: size }, (_, i) => ({
      id: uuidv4(),
      name: `Card ${i + 1}`
    }))
  };
}

export function validateDeckImport(data: unknown): DeckImportValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Type guard
  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Invalid JSON format'], warnings: [] };
  }

  const deck = data as Partial<DeckImport>;

  // Validate name
  if (!deck.name || typeof deck.name !== 'string' || deck.name.trim() === '') {
    errors.push('Deck name is required');
  }

  // Validate cards array
  if (!Array.isArray(deck.cards)) {
    errors.push('Cards must be an array');
    return { valid: false, errors, warnings };
  }

  if (deck.cards.length < DECK_IMPORT_CONSTRAINTS.MIN_CARDS) {
    errors.push(`Deck must have at least ${DECK_IMPORT_CONSTRAINTS.MIN_CARDS} card(s)`);
  }

  if (deck.cards.length > DECK_IMPORT_CONSTRAINTS.MAX_CARDS) {
    errors.push(`Deck cannot exceed ${DECK_IMPORT_CONSTRAINTS.MAX_CARDS} cards`);
  }

  // Validate each card
  const seenIds = new Set<string>();
  deck.cards.forEach((card, index) => {
    if (!card.id || typeof card.id !== 'string') {
      errors.push(`Card at index ${index} missing valid id`);
    } else if (seenIds.has(card.id)) {
      errors.push(`Duplicate card id: ${card.id}`);
    } else {
      seenIds.add(card.id);
    }

    if (!card.name || typeof card.name !== 'string' || card.name.trim() === '') {
      errors.push(`Card at index ${index} missing valid name`);
    }

    if (card.name && card.name.length > DECK_IMPORT_CONSTRAINTS.MAX_CARD_NAME_LENGTH) {
      warnings.push(`Card "${card.name}" name exceeds recommended length`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

### 3.3 Game State Hook (`app/lib/hooks/useGameState.ts`)

See `data-model.md` for complete implementation with `useGameState` and `useSupabase` hooks.

---

## Step 4: Component Implementation

### 4.1 Implementation Order

Implement components in this order (bottom-up):

1. **Card Component** (`app/components/game/Card.tsx`)
   - Reusable card display
   - Click handler
   - Hover states
   - Dark mode support

2. **Deck Component** (`app/components/game/Deck.tsx`)
   - Shows card back and count
   - Click to draw
   - Empty state

3. **Hand Component** (`app/components/game/Hand.tsx`)
   - Fixed bottom positioning
   - Horizontal card layout
   - Scrollable if needed

4. **Playfield Component** (`app/components/game/Playfield.tsx`)
   - Grid layout for cards
   - Includes deck
   - Responsive design

5. **DeckImport Component** (`app/components/game/DeckImport.tsx`)
   - File upload
   - JSON validation
   - Error handling

6. **Game Page** (`app/game/page.tsx`)
   - Orchestrates all components
   - Uses `useGameState` hook

---

## Step 5: Styling

### 5.1 Card Dimensions

Use consistent sizing across all components:

```typescript
// Common Tailwind classes for cards
const cardClasses = "w-20 sm:w-24 md:w-28 lg:w-32 aspect-[5/7] rounded-lg shadow-md";
```

### 5.2 Dark Mode

Every component must include dark mode variants:

```tsx
<div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">
  <button className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
    Draw Card
  </button>
</div>
```

### 5.3 Responsive Breakpoints

```tsx
// Playfield grid
<div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">

// Hand area
<div className="flex gap-2 overflow-x-auto">
```

---

## Step 6: Testing Checklist

### 6.1 Functional Testing

- [ ] Load page → see playfield and deck
- [ ] Click deck → card appears in hand
- [ ] Draw multiple cards → all visible in hand
- [ ] Click card in hand → card moves to playfield
- [ ] Refresh browser → game state persists
- [ ] Import JSON deck → deck replaces test deck
- [ ] Draw all cards → deck shows empty state
- [ ] Import invalid JSON → see error message

### 6.2 Visual Testing

- [ ] Dark mode works on all components
- [ ] Responsive design on mobile, tablet, desktop
- [ ] Cards maintain aspect ratio
- [ ] Hand area stays fixed at bottom
- [ ] Hover states visible on interactive elements
- [ ] Cards on playfield don't overlap deck

### 6.3 Performance Testing

- [ ] Lighthouse score 90+ in production build
- [ ] Initial page load < 2s
- [ ] Draw card response < 1s
- [ ] Play card response < 1s
- [ ] Bundle size < 200KB parsed

### 6.4 Accessibility Testing

- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] ARIA labels present
- [ ] Semantic HTML used
- [ ] Focus visible styles present

---

## Step 7: Deployment

### 7.1 Build Production

```bash
npm run build
```

Fix any TypeScript errors or build warnings.

### 7.2 Verify Environment Variables

Ensure production environment has Supabase variables set.

### 7.3 Deploy

Deploy to Vercel or your preferred hosting:

```bash
# Vercel CLI
vercel --prod

# Or push to connected Git repository
git push origin 001-card-sandbox
```

---

## Troubleshooting

### Issue: Supabase connection fails

**Solution**: Check `.env.local` variables are correct and server is restarted.

### Issue: State doesn't persist

**Solution**: 
1. Verify database schema created
2. Check browser console for errors
3. Confirm sessionId in localStorage

### Issue: TypeScript errors

**Solution**: 
1. Ensure all types imported from `lib/types/game`
2. Run `npm run lint` to see all errors
3. Use `unknown` instead of `any`

### Issue: Dark mode not working

**Solution**:
1. Check `next-themes` provider in layout
2. Verify Tailwind config has `darkMode: 'class'`
3. Add `suppressHydrationWarning` to html tag

---

## Next Steps

After completing this feature:

1. Test with real users
2. Gather feedback on UX
3. Plan multiplayer features (future)
4. Add drag-and-drop for card positioning (future)
5. Implement card image support (future)

---

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Hooks Documentation](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

## Support

For questions or issues:
- Review `research.md` for technical decisions
- Check `data-model.md` for entity relationships
- See `contracts/game-state.ts` for type definitions
- Review constitution principles in `.specify/memory/constitution.md`
