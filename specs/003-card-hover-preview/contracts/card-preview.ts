/**
 * Type Contracts: Card Hover Preview with ALT Key
 * 
 * This file defines all TypeScript interfaces and types for the card preview feature.
 * These contracts ensure type safety across components, hooks, and utility functions.
 * 
 * @module card-preview-contracts
 * @feature 003-card-hover-preview
 */

import type { Card } from '../../../app/lib/types/game';

// ============================================================================
// Core State Types
// ============================================================================

/**
 * Preview state tracking visibility, card, and mouse position.
 * This is the primary state object managed by useCardPreview hook.
 */
export interface PreviewState {
  /**
   * Whether preview is currently visible to user.
   * true = preview showing, false = preview hidden
   */
  isActive: boolean;
  
  /**
   * Card currently being previewed.
   * null when preview is hidden (isActive === false)
   * Non-null when preview is showing (isActive === true)
   */
  card: Card | null;
  
  /**
   * ID of the card currently being hovered.
   * Tracks which card triggered the preview.
   * Used to determine if mouse left the previewed card.
   */
  hoveredCardId: string | null;
  
  /**
   * Current mouse X coordinate (clientX from MouseEvent).
   * Updated on every mousemove event when preview is active.
   * Used to calculate preview position.
   */
  mouseX: number;
  
  /**
   * Current mouse Y coordinate (clientY from MouseEvent).
   * Updated on every mousemove event when preview is active.
   * Used to calculate preview position.
   */
  mouseY: number;
}

/**
 * Global ALT key state tracking.
 * Provided via React Context to all consuming components.
 */
export interface AltKeyState {
  /**
   * Whether ALT key is currently pressed.
   * true = pressed/held, false = released
   */
  isPressed: boolean;
}

// ============================================================================
// Position & Dimension Types
// ============================================================================

/**
 * Calculated position for preview rendering.
 * Coordinates are relative to viewport (fixed positioning).
 */
export interface PreviewPosition {
  /**
   * X coordinate in pixels from left edge of viewport.
   * Must be >= 0 and <= (viewportWidth - previewWidth)
   */
  x: number;
  
  /**
   * Y coordinate in pixels from top edge of viewport.
   * Must be >= 0 and <= (viewportHeight - previewHeight)
   */
  y: number;
}

/**
 * Fixed dimensions for the preview card.
 * Maintains 5:7 aspect ratio consistent with Card component.
 */
export interface PreviewDimensions {
  /**
   * Width of preview in pixels.
   * Default: 300px (approximately 2x standard card width)
   */
  width: number;
  
  /**
   * Height of preview in pixels.
   * Default: 420px (maintains 5:7 aspect ratio)
   */
  height: number;
}

/**
 * Input parameters for position calculation algorithm.
 * All measurements in pixels.
 */
export interface PositionCalculationInput {
  /** Current mouse X coordinate (clientX) */
  mouseX: number;
  
  /** Current mouse Y coordinate (clientY) */
  mouseY: number;
  
  /** Preview width in pixels */
  previewWidth: number;
  
  /** Preview height in pixels */
  previewHeight: number;
  
  /** Offset from cursor in pixels (default: 20) */
  offset?: number;
  
  /** Viewport width (window.innerWidth) */
  viewportWidth: number;
  
  /** Viewport height (window.innerHeight) */
  viewportHeight: number;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useAltKey hook.
 * Provides global ALT key state via Context.
 */
export interface UseAltKeyReturn {
  /**
   * Whether ALT key is currently pressed.
   * Synchronized across all hook consumers via Context.
   */
  isAltPressed: boolean;
}

/**
 * Return type for useCardPreview hook.
 * Provides preview state and operations for managing card previews.
 */
export interface UseCardPreviewReturn {
  /**
   * Current preview state (visibility, card, position).
   */
  previewState: PreviewState;
  
  /**
   * Show preview for a specific card.
   * Only activates if ALT key is currently pressed.
   * 
   * @param card - Card to preview
   */
  showPreview: (card: Card) => void;
  
  /**
   * Hide preview for a specific card.
   * Only hides if the provided cardId matches currently previewed card.
   * 
   * @param cardId - ID of card to stop previewing
   */
  hidePreview: (cardId: string) => void;
  
  /**
   * Calculated preview position based on current mouse coordinates.
   * Automatically adjusts to keep preview within viewport bounds.
   * null when preview is not active.
   */
  previewPosition: PreviewPosition | null;
  
  /**
   * Fixed preview dimensions.
   * Used for position calculations and component rendering.
   */
  previewDimensions: PreviewDimensions;
}

// ============================================================================
// Component Prop Types
// ============================================================================

/**
 * Props for CardPreview component.
 * Component renders preview overlay using React Portal.
 */
export interface CardPreviewProps {
  /**
   * Card to display in preview.
   * Should match currently hovered card.
   */
  card: Card;
  
  /**
   * Position where preview should render.
   * Coordinates are viewport-relative (fixed positioning).
   */
  position: PreviewPosition;
  
  /**
   * Dimensions for the preview.
   * Determines preview size and aspect ratio.
   */
  dimensions: PreviewDimensions;
  
  /**
   * Additional CSS classes for customization.
   * Applied to preview container.
   */
  className?: string;
}

/**
 * Props for CardPreviewProvider component.
 * Provides global ALT key state via Context.
 */
export interface CardPreviewProviderProps {
  /**
   * Child components that can access ALT key state.
   */
  children: React.ReactNode;
}

// ============================================================================
// Utility Function Types
// ============================================================================

/**
 * Function signature for calculatePreviewPosition utility.
 * Calculates optimal preview position ensuring full visibility within viewport.
 * 
 * @param input - Position calculation parameters
 * @returns Calculated position ensuring preview stays within viewport bounds
 */
export type CalculatePreviewPosition = (
  input: PositionCalculationInput
) => PreviewPosition;

/**
 * Function signature for validatePreviewState utility (development only).
 * Validates preview state invariants during development.
 * 
 * @param state - Preview state to validate
 * @throws AssertionError if state violates invariants
 */
export type ValidatePreviewState = (state: PreviewState) => void;

/**
 * Function signature for validatePreviewPosition utility (development only).
 * Validates that preview position stays within viewport bounds.
 * 
 * @param position - Position to validate
 * @param dimensions - Preview dimensions
 * @throws AssertionError if position would cause clipping
 */
export type ValidatePreviewPosition = (
  position: PreviewPosition,
  dimensions: PreviewDimensions
) => void;

// ============================================================================
// Context Types
// ============================================================================

/**
 * Context value for ALT key state.
 * Provided by CardPreviewProvider, consumed by useAltKey hook.
 */
export interface AltKeyContextValue {
  /**
   * Current ALT key pressed state.
   */
  isAltPressed: boolean;
}

/**
 * Context value for preview state (optional, if using Context pattern).
 * Alternative to prop drilling for preview state.
 */
export interface PreviewContextValue {
  /**
   * Current preview state.
   */
  previewState: PreviewState;
  
  /**
   * Show preview for a card.
   */
  showPreview: (card: Card) => void;
  
  /**
   * Hide preview for a card.
   */
  hidePreview: (cardId: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default preview dimensions.
 * Maintains 5:7 aspect ratio (standard card proportions).
 */
export const DEFAULT_PREVIEW_DIMENSIONS: PreviewDimensions = {
  width: 300,   // ~2x standard card width
  height: 420,  // Maintains 5:7 ratio (300 * 7/5)
} as const;

/**
 * Default offset from cursor for preview positioning.
 * Prevents preview from obscuring cursor.
 */
export const DEFAULT_PREVIEW_OFFSET = 20 as const;

/**
 * Z-index for preview overlay.
 * Must be above all game elements (hand z-index: 50, playfield: default).
 */
export const PREVIEW_Z_INDEX = 9999 as const;

/**
 * Threshold for position update (pixels).
 * Position updates skipped if change is less than this value.
 * Prevents unnecessary re-renders for tiny mouse movements.
 */
export const POSITION_UPDATE_THRESHOLD = 1 as const;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if preview state is active.
 * Ensures type safety when accessing preview.card.
 * 
 * @param state - Preview state to check
 * @returns true if preview is active with valid card
 */
export function isPreviewActive(state: PreviewState): state is PreviewState & {
  isActive: true;
  card: Card;
  hoveredCardId: string;
} {
  return state.isActive && state.card !== null && state.hoveredCardId !== null;
}

/**
 * Type guard to check if position is valid.
 * Validates that position is within viewport bounds.
 * 
 * @param position - Position to check
 * @param dimensions - Preview dimensions
 * @param viewportWidth - Viewport width
 * @param viewportHeight - Viewport height
 * @returns true if position is valid and within bounds
 */
export function isPositionValid(
  position: PreviewPosition,
  dimensions: PreviewDimensions,
  viewportWidth: number,
  viewportHeight: number
): boolean {
  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x + dimensions.width <= viewportWidth &&
    position.y + dimensions.height <= viewportHeight
  );
}

// ============================================================================
// Event Handler Types
// ============================================================================

/**
 * Mouse enter event handler for Card component.
 * Triggers preview display when ALT key is pressed.
 */
export type CardMouseEnterHandler = (event: React.MouseEvent<HTMLDivElement>) => void;

/**
 * Mouse leave event handler for Card component.
 * Triggers preview dismissal.
 */
export type CardMouseLeaveHandler = (event: React.MouseEvent<HTMLDivElement>) => void;

/**
 * Global keyboard event handler for ALT key detection.
 * Updates global ALT key state.
 */
export type GlobalKeyboardHandler = (event: KeyboardEvent) => void;

/**
 * Global mouse move event handler for position tracking.
 * Updates preview position while preview is active.
 */
export type GlobalMouseMoveHandler = (event: MouseEvent) => void;

// ============================================================================
// Responsive Types (Future Enhancement)
// ============================================================================

/**
 * Breakpoint type for responsive preview sizing.
 * Currently not implemented - preview disabled on mobile.
 */
export type PreviewBreakpoint = 'mobile' | 'tablet' | 'desktop';

/**
 * Responsive preview configuration (future enhancement).
 * Allows different preview sizes per breakpoint.
 */
export interface ResponsivePreviewConfig {
  /** Preview dimensions per breakpoint */
  dimensions: Record<PreviewBreakpoint, PreviewDimensions>;
  
  /** Whether preview is enabled per breakpoint */
  enabled: Record<PreviewBreakpoint, boolean>;
}

// ============================================================================
// Testing Types
// ============================================================================

/**
 * Mock preview state for testing.
 * Used in unit tests to simulate various preview states.
 */
export interface MockPreviewState extends PreviewState {
  /** Test identifier */
  _testId?: string;
}

/**
 * Test utilities for preview feature.
 * Helper functions for testing preview behavior.
 */
export interface PreviewTestUtils {
  /** Create mock preview state */
  createMockState: (overrides?: Partial<PreviewState>) => MockPreviewState;
  
  /** Simulate ALT key press */
  simulateAltKeyPress: () => void;
  
  /** Simulate ALT key release */
  simulateAltKeyRelease: () => void;
  
  /** Simulate card hover */
  simulateCardHover: (card: Card) => void;
  
  /** Simulate mouse leave */
  simulateMouseLeave: () => void;
}
