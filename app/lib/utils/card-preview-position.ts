/**
 * Card Preview Position Utilities
 * 
 * Functions for calculating preview card position to keep within viewport bounds.
 * 
 * @module utils/card-preview-position
 */

import type { 
  PreviewPosition, 
  PositionCalculationInput 
} from '../types/card-preview';
import { DEFAULT_PREVIEW_OFFSET } from '../types/card-preview';

/**
 * Calculate preview position based on mouse coordinates.
 * 
 * Algorithm:
 * 1. Start with default position (mouse + offset)
 * 2. Check right edge - flip left if would overflow
 * 3. Check bottom edge - flip up if would overflow
 * 4. Ensure position never goes negative
 * 
 * Performance: O(1) - simple arithmetic, no loops
 * Execution time: < 1ms typical
 * 
 * @param input - Position calculation parameters
 * @returns Position coordinates for preview rendering
 * 
 * @example
 * ```ts
 * const position = calculatePreviewPosition({
 *   mouseX: 500,
 *   mouseY: 300,
 *   previewWidth: 300,
 *   previewHeight: 420,
 *   offset: 20,
 *   viewportWidth: 1920,
 *   viewportHeight: 1080
 * });
 * // Returns: { x: 520, y: 320 } (mouse + offset)
 * ```
 * 
 * @example
 * ```ts
 * // Near right edge - preview flips to left of cursor
 * const position = calculatePreviewPosition({
 *   mouseX: 1800,
 *   mouseY: 300,
 *   previewWidth: 300,
 *   previewHeight: 420,
 *   offset: 20,
 *   viewportWidth: 1920,
 *   viewportHeight: 1080
 * });
 * // Returns: { x: 1480, y: 320 } (mouse - width - offset)
 * ```
 */
export function calculatePreviewPosition(input: PositionCalculationInput): PreviewPosition {
  const {
    mouseX,
    mouseY,
    previewWidth,
    previewHeight,
    offset = DEFAULT_PREVIEW_OFFSET,
    viewportWidth,
    viewportHeight,
  } = input;

  // Calculate default position (to the right and below cursor)
  let x = mouseX + offset;
  let y = mouseY + offset;

  // Check right edge - flip to left if would overflow
  if (x + previewWidth > viewportWidth) {
    x = mouseX - previewWidth - offset;
  }

  // Check bottom edge - flip up if would overflow
  if (y + previewHeight > viewportHeight) {
    y = mouseY - previewHeight - offset;
  }

  // Ensure position never goes negative (safety check)
  x = Math.max(0, x);
  y = Math.max(0, y);

  return { x, y };
}
