/**
 * Type Contracts: Card Tap/Rotate Feature
 * 
 * This file defines TypeScript interfaces and types for the card rotation feature.
 * These contracts extend the existing game state types to support keyboard-based
 * card tapping (90° rotations) with Q/E keys.
 * 
 * @module card-rotate
 * @feature 006-card-rotate
 */

// ============================================================================
// Core Rotation Types
// ============================================================================

/**
 * Represents the rotational state of a single card.
 * Rotation is stored as degrees (0-359) and normalized after each operation.
 */
export interface CardRotation {
  /** Card identifier (matches Card.id) */
  cardId: string;
  
  /** Rotation angle in degrees (0, 90, 180, or 270 for standard tap/untap) */
  rotation: number;
}

/**
 * Valid rotation angles for card tapping.
 * Corresponds to the four cardinal rotation states.
 */
export type RotationAngle = 0 | 90 | 180 | 270;

/**
 * Rotation direction for key press handlers.
 */
export type RotationDirection = 'clockwise' | 'counterclockwise';

// ============================================================================
// Extended Playfield Type
// ============================================================================

/**
 * Extended Playfield interface with rotation state.
 * This extends the existing Playfield from game.ts.
 */
export interface PlayfieldWithRotation {
  /** Cards currently on the playfield */
  cards: import('@/app/lib/types/game').Card[];
  
  /** Card positions for drag/drop support */
  positions: Map<string, import('@/app/lib/types/game').CardPosition>;
  
  /** Card rotations for tap/untap support (NEW) */
  rotations: Map<string, number>;
  
  /** Next available z-index value */
  nextZIndex: number;
}

// ============================================================================
// Database Serialization Types
// ============================================================================

/**
 * JSON-serializable version of rotation state for Supabase storage.
 * Maps are converted to plain objects for JSONB compatibility.
 */
export interface PlayfieldStateJSON {
  cards: import('@/app/lib/types/game').Card[];
  positions: Record<string, import('@/app/lib/types/game').CardPosition>;
  rotations: Record<string, number>; // NEW field
  nextZIndex: number;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useCardRotation hook.
 * Provides methods for managing card rotation state.
 */
export interface UseCardRotationReturn {
  /**
   * Get the current rotation angle for a card.
   * Returns 0 if card has no rotation state (default upright position).
   * 
   * @param cardId - ID of the card to query
   * @returns Rotation angle in degrees (0-359)
   */
  getRotation: (cardId: string) => number;
  
  /**
   * Rotate a card by a relative angle (delta).
   * Positive delta rotates clockwise, negative counter-clockwise.
   * Result is automatically normalized to 0-359 range.
   * 
   * @param cardId - ID of the card to rotate
   * @param delta - Rotation delta in degrees (typically 90 or -90)
   */
  rotateCard: (cardId: string, delta: number) => void;
  
  /**
   * Set the absolute rotation angle for a card.
   * Value is normalized to 0-359 range.
   * 
   * @param cardId - ID of the card to rotate
   * @param degrees - Absolute rotation angle in degrees
   */
  setRotation: (cardId: string, degrees: number) => void;
  
  /**
   * Clear rotation state for a card (reset to 0°/upright).
   * 
   * @param cardId - ID of the card to reset
   */
  clearRotation: (cardId: string) => void;
  
  /**
   * Get all current rotation states.
   * Useful for debugging or batch operations.
   * 
   * @returns Map of cardId to rotation angle
   */
  getAllRotations: () => Map<string, number>;
}

// ============================================================================
// Keyboard Event Types
// ============================================================================

/**
 * Configuration for rotation keyboard shortcuts.
 */
export interface RotationKeyConfig {
  /** Key for clockwise rotation (default: 'e' or 'E') */
  clockwiseKey: string;
  
  /** Key for counter-clockwise rotation (default: 'q' or 'Q') */
  counterclockwiseKey: string;
  
  /** Rotation increment in degrees (default: 90) */
  rotationIncrement: number;
  
  /** Whether to prevent default browser behavior (default: true) */
  preventDefault: boolean;
}

/**
 * State for keyboard rotation handler.
 */
export interface KeyboardRotationState {
  /** Currently hovered card ID (from CardPreviewContext) */
  hoveredCardId: string | null;
  
  /** Whether keyboard handler is active */
  isActive: boolean;
  
  /** Key configuration */
  config: RotationKeyConfig;
}

// ============================================================================
// Component Prop Extensions
// ============================================================================

/**
 * Extended CardProps with rotation support.
 * This extends the existing CardProps from game.ts.
 */
export interface CardPropsWithRotation {
  /** All base CardProps from game.ts */
  card: import('@/app/lib/types/game').Card;
  onClick?: (card: import('@/app/lib/types/game').Card) => void;
  disabled?: boolean;
  className?: string;
  location: 'deck' | 'hand' | 'playfield';
  draggable?: boolean;
  isDragging?: boolean;
  position?: import('@/app/lib/types/game').CardPosition;
  dragOffset?: { x: number; y: number };
  onDragStart?: (card: import('@/app/lib/types/game').Card, event: React.MouseEvent) => void;
  
  /** Current rotation angle in degrees (NEW) */
  rotation?: number;
  
  /** Whether rotation animation is in progress (NEW) */
  isRotating?: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Result of rotation normalization.
 */
export interface NormalizedRotation {
  /** Normalized rotation value (0-359) */
  normalized: number;
  
  /** Number of full 360° rotations performed */
  fullRotations: number;
  
  /** Whether normalization changed the value */
  wasNormalized: boolean;
}

/**
 * Validation result for rotation operations.
 */
export interface RotationValidation {
  /** Whether the rotation is valid */
  valid: boolean;
  
  /** Error message if invalid */
  error?: string;
  
  /** Suggested correction if applicable */
  suggestion?: number;
}

// ============================================================================
// Game Action Extensions
// ============================================================================

/**
 * New game actions for rotation feature.
 * These extend the existing GameAction union type from game.ts.
 */
export type RotationGameAction =
  | { type: 'ROTATE_CARD'; payload: { cardId: string; delta: number } }
  | { type: 'SET_ROTATION'; payload: { cardId: string; degrees: number } }
  | { type: 'CLEAR_ROTATION'; payload: { cardId: string } }
  | { type: 'CLEAR_ALL_ROTATIONS' };

// ============================================================================
// Constants
// ============================================================================

/**
 * Default rotation configuration values.
 */
export const DEFAULT_ROTATION_CONFIG: RotationKeyConfig = {
  clockwiseKey: 'e',
  counterclockwiseKey: 'q',
  rotationIncrement: 90,
  preventDefault: true,
} as const;

/**
 * Standard rotation angles for card game mechanics.
 */
export const STANDARD_ROTATIONS: readonly RotationAngle[] = [0, 90, 180, 270] as const;

/**
 * Animation duration for rotation transitions (milliseconds).
 */
export const ROTATION_ANIMATION_DURATION = 300 as const;

/**
 * Throttle delay for rapid rotation key presses (milliseconds).
 */
export const ROTATION_THROTTLE_MS = 50 as const;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a value is a valid rotation angle.
 */
export function isValidRotation(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && value < 360;
}

/**
 * Type guard to check if a value is a standard rotation angle.
 */
export function isStandardRotation(value: unknown): value is RotationAngle {
  return typeof value === 'number' && STANDARD_ROTATIONS.includes(value as RotationAngle);
}

/**
 * Type guard to check if an action is a rotation action.
 */
export function isRotationAction(action: unknown): action is RotationGameAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    'type' in action &&
    typeof action.type === 'string' &&
    (action.type === 'ROTATE_CARD' ||
     action.type === 'SET_ROTATION' ||
     action.type === 'CLEAR_ROTATION' ||
     action.type === 'CLEAR_ALL_ROTATIONS')
  );
}

// ============================================================================
// Utility Functions (Type Definitions Only)
// ============================================================================

/**
 * Normalize a rotation angle to 0-359 range.
 * Implementation in utils/rotation.ts
 */
export type NormalizeRotationFn = (degrees: number) => number;

/**
 * Calculate next rotation angle given current angle and direction.
 * Implementation in utils/rotation.ts
 */
export type CalculateNextRotationFn = (
  current: number,
  direction: RotationDirection,
  increment?: number
) => number;

/**
 * Validate rotation state consistency (all rotation entries have corresponding cards).
 * Implementation in utils/rotation.ts
 */
export type ValidateRotationStateFn = (
  cards: import('@/app/lib/types/game').Card[],
  rotations: Map<string, number>
) => RotationValidation;
