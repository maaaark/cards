# Data Model: Card Sandbox Playfield

**Feature**: Card Sandbox Playfield  
**Date**: 2025-10-27  
**Status**: Complete

## Overview

This document defines the data structures and entities for the card game sandbox, including TypeScript interfaces, database schema, and state management patterns.

---

## Core Entities

### 1. Card

Represents a single playing card in the game.

**Attributes**:
- `id`: Unique identifier (string, UUID format)
- `name`: Display name of the card (string)
- `imageUrl`: Optional URL to card image (string | undefined)
- `metadata`: Optional game-specific data (Record<string, any> | undefined)

**States**:
- In deck (drawable)
- In hand (playable)
- On playfield (played)

**TypeScript Interface**:
```typescript
interface Card {
  id: string;              // UUID or unique identifier
  name: string;            // Display name (e.g., "Card 1", "Lightning Bolt")
  imageUrl?: string;       // Optional: URL to card image
  metadata?: Record<string, any>;  // Optional: game-specific data (mana cost, card type, etc.)
}
```

**Validation Rules**:
- `id` must be unique within the game session
- `name` must be non-empty string (min 1 char, max 100 chars)
- `imageUrl` if provided must be valid URL or relative path
- Cards are immutable once created (properties don't change during gameplay)

---

### 2. Deck

Represents the collection of cards available to draw from.

**Attributes**:
- `cards`: Array of Card objects remaining in deck
- `originalCount`: Total cards at deck creation (number)
- `name`: Optional deck name (string)

**TypeScript Interface**:
```typescript
interface Deck {
  cards: Card[];           // Cards remaining in deck (order matters)
  originalCount: number;   // Total cards when deck was created/imported
  name?: string;           // Optional: deck name (e.g., "MTG Commander Deck")
}
```

**Operations**:
- `drawCard()`: Remove and return first card from deck
- `getRemainingCount()`: Return number of cards left
- `isEmpty()`: Check if deck is empty

**Validation Rules**:
- Minimum 1 card at creation
- Maximum 200 cards (sanity limit)
- Cards drawn in order (FIFO - first in, first out)

---

### 3. Hand

Represents the player's current hand of cards.

**Attributes**:
- `cards`: Array of Card objects in hand
- `maxSize`: Optional maximum hand size (number, default: unlimited)

**TypeScript Interface**:
```typescript
interface Hand {
  cards: Card[];           // Cards currently in player's hand
  maxSize?: number;        // Optional: maximum hand size (default unlimited)
}
```

**Operations**:
- `addCard(card: Card)`: Add card to hand
- `removeCard(cardId: string)`: Remove card from hand by ID
- `getCard(cardId: string)`: Find card by ID
- `isFull()`: Check if hand is at max capacity

**Validation Rules**:
- No duplicate cards (same `id`)
- If `maxSize` specified, cannot exceed limit

---

### 4. Playfield

Represents the main game area where cards are played.

**Attributes**:
- `cards`: Array of Card objects on the playfield
- `positions`: Optional map of card positions (for future drag/drop)

**TypeScript Interface**:
```typescript
interface Playfield {
  cards: Card[];           // Cards currently on the playfield
  positions?: Map<string, Position>;  // Optional: card positions (future)
}

interface Position {
  x: number;               // X coordinate
  y: number;               // Y coordinate
  zIndex: number;          // Stacking order
}
```

**Operations**:
- `addCard(card: Card)`: Place card on playfield
- `removeCard(cardId: string)`: Remove card from playfield
- `getCard(cardId: string)`: Find card by ID

**Validation Rules**:
- No duplicate cards (same `id`)
- No maximum size limit for v1

---

### 5. GameState

Represents the complete state of a game session.

**Attributes**:
- `sessionId`: Unique session identifier (string)
- `deck`: Current deck state
- `hand`: Current hand state
- `playfield`: Current playfield state
- `deckMetadata`: Original imported deck information
- `createdAt`: Session creation timestamp (Date)
- `updatedAt`: Last update timestamp (Date)

**TypeScript Interface**:
```typescript
interface GameState {
  sessionId: string;       // Unique session identifier (stored in localStorage)
  deck: Deck;              // Current deck state
  hand: Hand;              // Current hand state
  playfield: Playfield;    // Current playfield state
  deckMetadata?: DeckMetadata;  // Original imported deck info
  createdAt: Date;         // When session was created
  updatedAt: Date;         // Last state update
}

interface DeckMetadata {
  name: string;            // Deck name from import
  originalCardCount: number;  // Total cards in imported deck
  importedAt: Date;        // When deck was imported
}
```

**State Transitions**:
```
Initial State:
  deck: { cards: [Card 1...20], originalCount: 20 }
  hand: { cards: [] }
  playfield: { cards: [] }

After drawing 3 cards:
  deck: { cards: [Card 4...20], originalCount: 20 }
  hand: { cards: [Card 1, Card 2, Card 3] }
  playfield: { cards: [] }

After playing Card 1:
  deck: { cards: [Card 4...20], originalCount: 20 }
  hand: { cards: [Card 2, Card 3] }
  playfield: { cards: [Card 1] }
```

---

### 6. DeckImport

Represents the structure of an imported JSON deck file.

**TypeScript Interface**:
```typescript
interface DeckImport {
  name: string;            // Deck name
  cards: Array<{
    id: string;            // Unique card identifier
    name: string;          // Card name
    imageUrl?: string;     // Optional: card image URL
    metadata?: Record<string, any>;  // Optional: game-specific data
  }>;
}
```

**Validation Rules**:
- Must be valid JSON
- `name` required, non-empty string
- `cards` array required, minimum 1 card, maximum 200 cards
- Each card must have unique `id` and non-empty `name`
- File size limit: 5MB

**Example JSON**:
```json
{
  "name": "Test Deck",
  "cards": [
    {
      "id": "card-001",
      "name": "Card 1"
    },
    {
      "id": "card-002",
      "name": "Card 2",
      "imageUrl": "/images/cards/card-002.png",
      "metadata": {
        "type": "creature",
        "cost": 3
      }
    }
  ]
}
```

---

## Database Schema (Supabase PostgreSQL)

### Table: `game_sessions`

```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(64) UNIQUE NOT NULL,
  
  -- Game state stored as JSONB for flexibility
  deck_state JSONB NOT NULL DEFAULT '{"cards": [], "originalCount": 0}'::jsonb,
  hand_state JSONB NOT NULL DEFAULT '{"cards": []}'::jsonb,
  playfield_state JSONB NOT NULL DEFAULT '{"cards": []}'::jsonb,
  
  -- Metadata
  deck_metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_game_sessions_session_id ON game_sessions(session_id);
CREATE INDEX idx_game_sessions_updated_at ON game_sessions(updated_at);

-- Trigger to auto-update updated_at
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

-- Auto-cleanup: Delete sessions older than 7 days
-- (Run via Supabase scheduled function or cron job)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM game_sessions
  WHERE updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
```

**JSONB Structure Examples**:

```typescript
// deck_state
{
  "cards": [
    { "id": "card-001", "name": "Card 1" },
    { "id": "card-002", "name": "Card 2" }
  ],
  "originalCount": 20,
  "name": "Test Deck"
}

// hand_state
{
  "cards": [
    { "id": "card-003", "name": "Card 3" }
  ]
}

// playfield_state
{
  "cards": [
    { "id": "card-004", "name": "Card 4" }
  ]
}

// deck_metadata
{
  "name": "MTG Commander Deck",
  "originalCardCount": 100,
  "importedAt": "2025-10-27T10:30:00Z"
}
```

---

## State Management

### Local State (React)

Game state is managed in React component state using a custom hook:

```typescript
function useGameState(sessionId: string) {
  const [deck, setDeck] = useState<Deck>({ cards: [], originalCount: 0 });
  const [hand, setHand] = useState<Hand>({ cards: [] });
  const [playfield, setPlayfield] = useState<Playfield>({ cards: [] });
  const [deckMetadata, setDeckMetadata] = useState<DeckMetadata>();

  // Load initial state from Supabase
  useEffect(() => {
    loadGameState(sessionId).then(state => {
      if (state) {
        setDeck(state.deck);
        setHand(state.hand);
        setPlayfield(state.playfield);
        setDeckMetadata(state.deckMetadata);
      }
    });
  }, [sessionId]);

  // Auto-save to Supabase (debounced)
  useEffect(() => {
    const saveState = debounce(() => {
      saveGameState(sessionId, { deck, hand, playfield, deckMetadata });
    }, 500);
    
    saveState();
    return () => saveState.cancel();
  }, [deck, hand, playfield, deckMetadata, sessionId]);

  // Game operations
  const drawCard = useCallback(() => {
    if (deck.cards.length === 0) return;
    
    const [drawnCard, ...remainingCards] = deck.cards;
    setDeck({ ...deck, cards: remainingCards });
    setHand({ ...hand, cards: [...hand.cards, drawnCard] });
  }, [deck, hand]);

  const playCard = useCallback((cardId: string) => {
    const cardIndex = hand.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    
    const card = hand.cards[cardIndex];
    const newHand = [...hand.cards];
    newHand.splice(cardIndex, 1);
    
    setHand({ ...hand, cards: newHand });
    setPlayfield({ ...playfield, cards: [...playfield.cards, card] });
  }, [hand, playfield]);

  const importDeck = useCallback((deckImport: DeckImport) => {
    setDeck({
      cards: deckImport.cards,
      originalCount: deckImport.cards.length,
      name: deckImport.name
    });
    setDeckMetadata({
      name: deckImport.name,
      originalCardCount: deckImport.cards.length,
      importedAt: new Date()
    });
    // Reset hand and playfield
    setHand({ cards: [] });
    setPlayfield({ cards: [] });
  }, []);

  return {
    deck,
    hand,
    playfield,
    deckMetadata,
    drawCard,
    playCard,
    importDeck
  };
}
```

---

## Relationships

```
GameState
├── sessionId (unique identifier)
├── deck: Deck
│   └── cards: Card[]
├── hand: Hand
│   └── cards: Card[]
├── playfield: Playfield
│   └── cards: Card[]
└── deckMetadata: DeckMetadata

Card Flow:
  DeckImport (JSON file)
    ↓
  Deck.cards[]
    ↓ drawCard()
  Hand.cards[]
    ↓ playCard()
  Playfield.cards[]
```

---

## Data Integrity Rules

1. **Card Uniqueness**: Each card `id` must be unique within the entire GameState
2. **Single Location**: A card can only exist in ONE location at a time (deck, hand, OR playfield)
3. **Immutability**: Card properties don't change during gameplay
4. **Order Preservation**: Deck order is preserved (FIFO drawing)
5. **Session Isolation**: Each session's data is independent
6. **Persistence**: All state changes auto-save to Supabase (debounced 500ms)

---

## Future Extensions

**Drag & Drop Positions**:
- Add `Position` interface with x, y, zIndex coordinates
- Store positions in `playfield_state.positions` JSONB map

**Card History/Undo**:
- Add `history` array to GameState
- Store previous states for undo/redo functionality

**Multiplayer**:
- Add `player_id` to `game_sessions` table
- Separate hand/playfield per player
- Add real-time subscriptions via Supabase

**Card Images**:
- Use Next.js Image component with `imageUrl`
- Implement lazy loading for large decks
- Add image caching strategy
