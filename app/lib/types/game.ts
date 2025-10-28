/**
 * Type Contracts: Card Sandbox Playfield
 * 
 * This file defines all TypeScript interfaces and types for the card game sandbox.
 * These contracts ensure type safety across components, hooks, and database operations.
 * 
 * @module game-state
 */

// ============================================================================
// Core Entity Types
// ============================================================================

/**
 * Represents a single playing card in the game.
 * Cards are immutable once created and can exist in one of three locations:
 * deck, hand, or playfield.
 */
export interface Card {
  /** Unique identifier (UUID format recommended) */
  id: string;
  
  /** Display name of the card (e.g., "Card 1", "Lightning Bolt") */
  name: string;
  
  /** Optional URL to card image (for future image support) */
  imageUrl?: string;
  
  /** Optional game-specific metadata (e.g., mana cost, card type, abilities) */
  metadata?: Record<string, unknown>;
  
  // Import tracking fields
  /** Import source format (if card was imported) */
  importSource?: 'tts' | 'json';
  
  /** Original TTS code (if imported from TTS format) */
  ttsCode?: string;
  
  /** Original JSON ID (if imported from JSON format) */
  jsonId?: string;
  
  /** Timestamp when card was imported */
  importedAt?: Date;
}

/**
 * Represents the deck of cards available to draw from.
 * Cards are drawn in FIFO order (first card in array is drawn first).
 */
export interface Deck {
  /** Cards remaining in the deck (order matters) */
  cards: Card[];
  
  /** Total number of cards when deck was created/imported */
  originalCount: number;
  
  /** Optional deck name (e.g., "MTG Commander Deck") */
  name?: string;
}

/**
 * Represents the player's hand of cards.
 * Cards in hand can be played to the playfield.
 */
export interface Hand {
  /** Cards currently in player's hand */
  cards: Card[];
  
  /** Optional maximum hand size (default: unlimited) */
  maxSize?: number;
}

/**
 * Represents the main game area where cards are played.
 */
export interface Playfield {
  /** Cards currently on the playfield */
  cards: Card[];
  
  /** Card positions for drag/drop support (REQUIRED for drag-drop) */
  positions: Map<string, CardPosition>;
  
  /** Next available z-index value (auto-increments) */
  nextZIndex: number;
}

/**
 * Represents a card's position on the playfield.
 * Used for drag-and-drop functionality.
 */
export interface Position {
  /** X coordinate in pixels */
  x: number;
  
  /** Y coordinate in pixels */
  y: number;
  
  /** Stacking order (higher = on top) */
  zIndex: number;
}

/**
 * Card position with ID for drag-and-drop operations.
 */
export interface CardPosition extends Position {
  /** Card ID */
  cardId: string;
}

/**
 * Metadata about the original imported deck.
 */
export interface DeckMetadata {
  /** Deck name from import */
  name: string;
  
  /** Total cards in imported deck */
  originalCardCount: number;
  
  /** When deck was imported */
  importedAt: Date;
}

/**
 * Complete game session state.
 * Persisted to Supabase and survives browser refresh.
 */
export interface GameState {
  /** Unique session identifier (stored in localStorage) */
  sessionId: string;
  
  /** Current deck state */
  deck: Deck;
  
  /** Current hand state */
  hand: Hand;
  
  /** Current playfield state */
  playfield: Playfield;
  
  /** Original imported deck information */
  deckMetadata?: DeckMetadata;
  
  /** When session was created */
  createdAt: Date;
  
  /** Last state update timestamp */
  updatedAt: Date;
}

// ============================================================================
// Deck Import Types
// ============================================================================

/**
 * Structure of an imported deck JSON file.
 * Used for validating and parsing deck imports.
 */
export interface DeckImport {
  /** Deck name */
  name: string;
  
  /** Array of cards in the deck */
  cards: Array<{
    /** Unique card identifier */
    id: string;
    
    /** Card name */
    name: string;
    
    /** Optional card image URL */
    imageUrl?: string;
    
    /** Optional game-specific metadata */
    metadata?: Record<string, unknown>;
  }>;
}

/**
 * Result of deck import validation.
 */
export interface DeckImportValidation {
  /** Whether the deck is valid */
  valid: boolean;
  
  /** Error messages if validation failed */
  errors: string[];
  
  /** Warning messages (non-blocking) */
  warnings: string[];
}

// ============================================================================
// Database Types (Supabase)
// ============================================================================

/**
 * Database row structure for game_sessions table.
 * JSONB columns match the TypeScript interfaces above.
 */
export interface GameSessionRow {
  /** Primary key (UUID) */
  id: string;
  
  /** Session identifier (matches localStorage) */
  session_id: string;
  
  /** Deck state as JSONB */
  deck_state: {
    cards: Card[];
    originalCount: number;
    name?: string;
  };
  
  /** Hand state as JSONB */
  hand_state: {
    cards: Card[];
    maxSize?: number;
  };
  
  /** Playfield state as JSONB */
  playfield_state: {
    cards: Card[];
  };
  
  /** Deck metadata as JSONB */
  deck_metadata?: {
    name: string;
    originalCardCount: number;
    importedAt: string; // ISO date string
  };
  
  /** Timestamp when session was created */
  created_at: string; // ISO date string
  
  /** Timestamp when session was last updated */
  updated_at: string; // ISO date string
}

// ============================================================================
// Component Prop Types
// ============================================================================

/**
 * Props for Card component.
 */
export interface CardProps {
  /** Card data */
  card: Card;
  
  /** Click handler */
  onClick?: (card: Card) => void;
  
  /** Whether card is disabled */
  disabled?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Card location context (for styling) */
  location: 'deck' | 'hand' | 'playfield';
  
  /** Drag and drop props */
  draggable?: boolean;
  isDragging?: boolean;
  position?: CardPosition;
  dragOffset?: { x: number; y: number }; // Offset during drag for transform
  onDragStart?: (card: Card, event: React.MouseEvent) => void;
}

/**
 * Props for Deck component.
 */
export interface DeckProps {
  /** Current deck state */
  deck: Deck;
  
  /** Handler for drawing a card */
  onDrawCard: () => void;
  
  /** Whether deck is disabled */
  disabled?: boolean;
}

/**
 * Props for Hand component.
 */
export interface HandProps {
  /** Current hand state */
  hand: Hand;
  
  /** Handler for starting a card drag operation */
  onCardDragStart?: (card: Card, event: React.MouseEvent) => void;
}

/**
 * Props for Playfield component.
 */
export interface PlayfieldProps {
  /** Current playfield state */
  playfield: Playfield;
  
  /** Current deck state (for displaying deck on playfield) */
  deck: Deck;
  
  /** Handler for drawing a card */
  onDrawCard: () => void;
  
  /** Handler for moving a card from hand to playfield */
  onMoveCardToPlayfield?: (cardId: string, position: CardPosition) => void;
  
  /** Handler for updating position of a card already on playfield */
  onUpdateCardPosition?: (cardId: string, position: CardPosition) => void;
  
  /** Handler for moving a card from playfield back to hand */
  onMoveCardToHand?: (cardId: string) => void;
  
  /** Handler for discarding a card from playfield */
  onDiscardCard?: (cardId: string) => void;
  
  /** Handler for card drag start (unified for hand and playfield) */
  onCardDragStart?: (card: Card, event: React.MouseEvent) => void;
  
  /** Ref to the playfield element */
  playfieldRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Props for DeckImport component.
 */
export interface DeckImportProps {
  /** Handler for successful deck import */
  onImport: (deck: DeckImport) => void;
  
  /** Handler for import errors */
  onError: (error: string) => void;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useGameState hook.
 */
export interface UseGameStateReturn {
  /** Current deck state */
  deck: Deck;
  
  /** Current hand state */
  hand: Hand;
  
  /** Current playfield state */
  playfield: Playfield;
  
  /** Deck metadata */
  deckMetadata?: DeckMetadata;
  
  /** Whether state is loading from database */
  isLoading: boolean;
  
  /** Error message if any */
  error?: string;
  
  /** Draw a card from deck to hand */
  drawCard: () => void;
  
  /** Play a card from hand to playfield */
  playCard: (cardId: string) => void;
  
  /** Import a new deck */
  importDeck: (deckImport: DeckImport) => void;
  
  /** Reset game state */
  resetGame: () => void;
  
  /** Move a card from hand to playfield at specified position */
  moveCardToPlayfield: (cardId: string, position: CardPosition) => void;
  
  /** Update position of a card already on the playfield */
  updateCardPosition: (cardId: string, position: CardPosition) => void;
  
  /** Move a card from playfield back to hand */
  moveCardToHand: (cardId: string) => void;
  
  /** Discard a card from playfield (remove from game) */
  discardCard: (cardId: string) => void;
}

/**
 * Return type for useSupabase hook.
 */
export interface UseSupabaseReturn {
  /** Load game state from database */
  loadGameState: (sessionId: string) => Promise<GameState | null>;
  
  /** Save game state to database */
  saveGameState: (sessionId: string, state: Omit<GameState, 'sessionId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  
  /** Delete game session */
  deleteGameState: (sessionId: string) => Promise<void>;
  
  /** Whether operation is in progress */
  isLoading: boolean;
  
  /** Error message if any */
  error?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Card location in the game.
 */
export type CardLocation = 'deck' | 'hand' | 'playfield';

/**
 * Game action types for state management.
 */
export type GameAction =
  | { type: 'DRAW_CARD' }
  | { type: 'PLAY_CARD'; payload: { cardId: string } }
  | { type: 'IMPORT_DECK'; payload: { deck: DeckImport } }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_STATE'; payload: { state: GameState } }
  | { type: 'MOVE_CARD_TO_PLAYFIELD'; payload: { cardId: string; position: CardPosition } }
  | { type: 'UPDATE_CARD_POSITION'; payload: { cardId: string; position: CardPosition } }
  | { type: 'MOVE_CARD_TO_HAND'; payload: { cardId: string } }
  | { type: 'DISCARD_CARD'; payload: { cardId: string } };

// ============================================================================
// Constants
// ============================================================================

/**
 * Validation constraints for deck import.
 */
export const DECK_IMPORT_CONSTRAINTS = {
  MIN_CARDS: 1,
  MAX_CARDS: 200,
  MAX_FILE_SIZE_MB: 5,
  MAX_CARD_NAME_LENGTH: 100,
} as const;

/**
 * Default test deck configuration.
 */
export const DEFAULT_TEST_DECK_SIZE = 20;

/**
 * Session storage keys.
 */
export const STORAGE_KEYS = {
  SESSION_ID: 'gameSessionId',
} as const;

/**
 * Debounce delay for auto-save (milliseconds).
 */
export const AUTO_SAVE_DEBOUNCE_MS = 500;
