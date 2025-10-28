/**
 * Type Contracts: Card Drag and Drop
 * 
 * This file defines all TypeScript interfaces and types for the drag-and-drop
 * card interaction system. These contracts ensure type safety across components,
 * hooks, and state management for dragging cards between hand and playfield.
 * 
 * @module card-drag-drop
 */

// ============================================================================
// Core Drag State Types
// ============================================================================

/**
 * Represents the current state of an active drag operation.
 * Only one card can be dragged at a time.
 */
export interface DragState {
  /** Whether a drag operation is currently in progress */
  isDragging: boolean;
  
  /** ID of the card being dragged (null if no drag active) */
  draggedCardId: string | null;
  
  /** Source location of the dragged card */
  draggedCardSource: CardDragSource | null;
  
  /** Initial mouse position when drag started (relative to viewport) */
  startPosition: Position2D | null;
  
  /** Current mouse position during drag (relative to viewport) */
  currentPosition: Position2D | null;
  
  /** Offset from mouse cursor to card top-left corner */
  offset: Position2D;
  
  /** Original position of card before drag (for cancel/ESC) */
  originalPosition: CardPosition | null;
  
  /** Timestamp when drag started (for detecting click vs drag) */
  dragStartTime: number | null;
}

/**
 * Source location where a drag operation originated.
 */
export type CardDragSource = 'hand' | 'playfield';

/**
 * Simple 2D coordinate for mouse positions.
 */
export interface Position2D {
  /** X coordinate in pixels */
  x: number;
  
  /** Y coordinate in pixels */
  y: number;
}

/**
 * Complete position and stacking data for a card on the playfield.
 * Extends Position2D with z-index for stacking order.
 */
export interface CardPosition extends Position2D {
  /** Unique card identifier */
  cardId: string;
  
  /** Stacking order (higher values render on top) */
  zIndex: number;
}

/**
 * Result of a drop operation indicating where the card was dropped.
 */
export interface DropResult {
  /** Whether the drop was successful */
  success: boolean;
  
  /** Target zone where card was dropped */
  targetZone: DropZone;
  
  /** Final position if dropped on playfield */
  position?: CardPosition;
  
  /** Error message if drop failed */
  error?: string;
}

/**
 * Valid drop zones for card placement.
 */
export type DropZone = 'playfield' | 'hand' | 'discard' | 'invalid';

// ============================================================================
// Playfield Position Management
// ============================================================================

/**
 * Extended Playfield interface with position tracking.
 * Replaces the optional positions with required Map for drag-drop support.
 */
export interface PlayfieldWithPositions {
  /** Cards currently on the playfield */
  cards: Card[];
  
  /** Map of card IDs to their absolute positions */
  positions: Map<string, CardPosition>;
  
  /** Next available z-index value (auto-increments) */
  nextZIndex: number;
}

/**
 * Boundaries of the playfield container for drop detection.
 */
export interface PlayfieldBounds {
  /** Left edge X coordinate (relative to viewport) */
  left: number;
  
  /** Top edge Y coordinate (relative to viewport) */
  top: number;
  
  /** Width of playfield in pixels */
  width: number;
  
  /** Height of playfield in pixels */
  height: number;
  
  /** Right edge X coordinate (computed: left + width) */
  right: number;
  
  /** Bottom edge Y coordinate (computed: top + height) */
  bottom: number;
}

/**
 * Configuration for drop zone detection.
 */
export interface DropZoneConfig {
  /** Boundaries of the playfield */
  playfieldBounds: PlayfieldBounds;
  
  /** Boundaries of the hand container */
  handBounds: PlayfieldBounds;
  
  /** Threshold in pixels for forgiving edge detection */
  edgeThreshold: number;
}

// ============================================================================
// Drag Event Data
// ============================================================================

/**
 * Data passed when drag operation starts.
 */
export interface DragStartData {
  /** Card being dragged */
  card: Card;
  
  /** Source location of card */
  source: CardDragSource;
  
  /** Mouse event that initiated drag */
  event: React.MouseEvent | MouseEvent;
  
  /** Original position if from playfield */
  originalPosition?: CardPosition;
}

/**
 * Data passed during drag position updates.
 */
export interface DragUpdateData {
  /** Current mouse position */
  position: Position2D;
  
  /** Mouse event */
  event: MouseEvent;
  
  /** Current drop zone under cursor */
  currentZone: DropZone;
}

/**
 * Data passed when drag operation ends.
 */
export interface DragEndData {
  /** Final mouse position */
  position: Position2D;
  
  /** Mouse event */
  event: MouseEvent;
  
  /** Drop zone where card was released */
  dropZone: DropZone;
  
  /** Final position if dropped on playfield */
  finalPosition?: CardPosition;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useDragAndDrop hook.
 */
export interface UseDragAndDropReturn {
  /** Current drag state */
  dragState: DragState;
  
  /** Start dragging a card */
  startDrag: (data: DragStartData) => void;
  
  /** Update drag position (called on mousemove) */
  updateDragPosition: (event: MouseEvent) => void;
  
  /** End drag operation (called on mouseup) */
  endDrag: (event: MouseEvent) => void;
  
  /** Cancel drag operation (ESC key or error) */
  cancelDrag: () => void;
  
  /** Whether drag operation is valid (passed movement threshold) */
  isDragValid: boolean;
  
  /** Calculate drop zone for given mouse position */
  getDropZone: (position: Position2D) => DropZone;
}

/**
 * Return type for usePlayfieldPositions hook.
 */
export interface UsePlayfieldPositionsReturn {
  /** Map of card positions */
  positions: Map<string, CardPosition>;
  
  /** Next available z-index */
  nextZIndex: number;
  
  /** Add or update a card's position */
  setCardPosition: (cardId: string, position: Position2D) => CardPosition;
  
  /** Remove a card's position */
  removeCardPosition: (cardId: string) => void;
  
  /** Bring card to top of z-index stack */
  bringToFront: (cardId: string) => void;
  
  /** Get position for a card */
  getCardPosition: (cardId: string) => CardPosition | undefined;
  
  /** Clear all positions (reset playfield) */
  clearPositions: () => void;
  
  /** Load positions from database */
  loadPositions: (playfieldState: PlayfieldWithPositions) => void;
}

// ============================================================================
// Component Prop Types
// ============================================================================

/**
 * Extended CardProps with drag support.
 */
export interface DraggableCardProps extends CardProps {
  /** Whether card can be dragged */
  draggable: boolean;
  
  /** Current position if on playfield */
  position?: CardPosition;
  
  /** Whether card is currently being dragged */
  isDragging: boolean;
  
  /** Handler when drag starts - takes card and event */
  onDragStart?: (card: Card, event: React.MouseEvent) => void;
  
  /** Z-index override during drag */
  dragZIndex?: number;
}

/**
 * Extended PlayfieldProps with drop support.
 */
export interface DroppablePlayfieldProps extends PlayfieldProps {
  /** Current drag state */
  dragState: DragState;
  
  /** Handler when card is dropped on playfield */
  onCardDropped: (result: DropResult) => void;
  
  /** Whether playfield is valid drop target */
  isValidDropTarget: boolean;
  
  /** Playfield container ref for bounds calculation */
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Extended HandProps with drop support.
 */
export interface DroppableHandProps extends HandProps {
  /** Current drag state */
  dragState: DragState;
  
  /** Handler when card is dropped on hand */
  onCardDropped: (cardId: string) => void;
  
  /** Whether hand is valid drop target */
  isValidDropTarget: boolean;
  
  /** Hand container ref for bounds calculation */
  containerRef: React.RefObject<HTMLDivElement>;
}

// ============================================================================
// Game State Updates
// ============================================================================

/**
 * Action for updating playfield with new card position.
 */
export interface MoveCardToPlayfieldAction {
  type: 'MOVE_CARD_TO_PLAYFIELD';
  payload: {
    cardId: string;
    source: CardDragSource;
    position: CardPosition;
  };
}

/**
 * Action for updating existing playfield card position.
 */
export interface UpdateCardPositionAction {
  type: 'UPDATE_CARD_POSITION';
  payload: {
    cardId: string;
    position: CardPosition;
  };
}

/**
 * Action for moving card from playfield to hand.
 */
export interface MoveCardToHandAction {
  type: 'MOVE_CARD_TO_HAND';
  payload: {
    cardId: string;
  };
}

/**
 * Action for discarding card from playfield.
 */
export interface DiscardCardAction {
  type: 'DISCARD_CARD';
  payload: {
    cardId: string;
  };
}

/**
 * Extended GameAction type with drag-drop actions.
 */
export type DragDropGameAction =
  | MoveCardToPlayfieldAction
  | UpdateCardPositionAction
  | MoveCardToHandAction
  | DiscardCardAction;

// ============================================================================
// Constants
// ============================================================================

/**
 * Configuration constants for drag-drop behavior.
 */
export const DRAG_DROP_CONFIG = {
  /** Minimum mouse movement (px) to trigger drag (vs click) */
  DRAG_THRESHOLD: 5,
  
  /** Maximum z-index value before reset */
  MAX_Z_INDEX: 10000,
  
  /** Forgiving edge threshold (px) for playfield boundaries */
  EDGE_THRESHOLD: 50,
  
  /** Opacity of card during drag */
  DRAG_OPACITY: 0.7,
  
  /** Z-index of card during drag (always on top) */
  DRAG_Z_INDEX: 9999,
  
  /** Cursor style during valid drag */
  DRAG_CURSOR: 'grabbing',
  
  /** Debounce delay for position updates (ms) */
  POSITION_UPDATE_DEBOUNCE: 16, // ~60fps
  
  /** Auto-save debounce after drag complete (ms) */
  AUTO_SAVE_DEBOUNCE: 500,
} as const;

/**
 * Visual feedback classes for drag states.
 */
export const DRAG_FEEDBACK_CLASSES = {
  /** Card being dragged */
  DRAGGING: 'opacity-70 scale-105 shadow-2xl cursor-grabbing',
  
  /** Valid drop target */
  DROP_TARGET_VALID: 'ring-2 ring-green-500 bg-green-50/50',
  
  /** Invalid drop target */
  DROP_TARGET_INVALID: 'ring-2 ring-red-500 bg-red-50/50',
  
  /** Discard zone */
  DISCARD_ZONE: 'ring-2 ring-orange-500 bg-orange-50/50',
} as const;

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type guard to check if position is within bounds.
 */
export type PositionValidator = (
  position: Position2D,
  bounds: PlayfieldBounds
) => boolean;

/**
 * Function to calculate final position with constraints.
 */
export type PositionCalculator = (
  mousePosition: Position2D,
  offset: Position2D,
  bounds: PlayfieldBounds
) => Position2D;

/**
 * Function to determine drop zone from mouse position.
 */
export type DropZoneDetector = (
  position: Position2D,
  config: DropZoneConfig
) => DropZone;

// ============================================================================
// Re-exports from game.ts (for convenience)
// ============================================================================

import type { Card, CardProps, PlayfieldProps, HandProps } from '@/app/lib/types/game';

export type { Card, CardProps, PlayfieldProps, HandProps };
