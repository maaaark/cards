/**
 * Rotation Utilities
 * 
 * Utility functions for managing card rotation state in the game.
 * Handles rotation normalization, calculation, and validation.
 * 
 * @module utils/rotation
 */

/**
 * Normalize rotation angle to 0-359 degree range.
 * Handles negative values and values >= 360.
 * 
 * @param degrees - Raw rotation angle in degrees
 * @returns Normalized rotation (0-359)
 * 
 * @example
 * normalizeRotation(450)  // returns 90
 * normalizeRotation(-90)  // returns 270
 * normalizeRotation(360)  // returns 0
 */
export function normalizeRotation(degrees: number): number {
  const normalized = degrees % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

/**
 * Calculate next rotation angle given current angle and delta.
 * Automatically normalizes the result.
 * 
 * @param current - Current rotation angle in degrees
 * @param delta - Rotation delta (positive for clockwise, negative for counter-clockwise)
 * @returns Normalized next rotation angle
 * 
 * @example
 * calculateNextRotation(270, 90)   // returns 0
 * calculateNextRotation(0, -90)    // returns 270
 * calculateNextRotation(180, 90)   // returns 270
 */
export function calculateNextRotation(
  current: number,
  delta: number
): number {
  return normalizeRotation(current + delta);
}

/**
 * Validate that rotation entries have corresponding cards.
 * Identifies orphaned rotation entries (cards no longer on playfield).
 * 
 * @param cardIds - Array of card IDs currently on playfield
 * @param rotations - Map of card rotations
 * @returns Validation result with orphaned rotation IDs
 * 
 * @example
 * const result = validateRotationState(
 *   ['card-1', 'card-2'],
 *   new Map([['card-1', 90], ['card-3', 180]])
 * );
 * // result.valid === false
 * // result.orphanedRotations === ['card-3']
 */
export function validateRotationState(
  cardIds: string[],
  rotations: Map<string, number>
): { valid: boolean; orphanedRotations: string[] } {
  const cardIdSet = new Set(cardIds);
  const orphanedRotations: string[] = [];
  
  rotations.forEach((_, cardId) => {
    if (!cardIdSet.has(cardId)) {
      orphanedRotations.push(cardId);
    }
  });
  
  return {
    valid: orphanedRotations.length === 0,
    orphanedRotations,
  };
}

/**
 * Check if a rotation angle is valid (0-359 range).
 * 
 * @param rotation - Rotation angle to validate
 * @returns True if rotation is in valid range
 */
export function isValidRotation(rotation: number): boolean {
  return rotation >= 0 && rotation < 360;
}

/**
 * Standard rotation angles for card game mechanics (0°, 90°, 180°, 270°).
 */
export const STANDARD_ROTATIONS = [0, 90, 180, 270] as const;

/**
 * Check if a rotation is a standard angle (0, 90, 180, or 270).
 * 
 * @param rotation - Rotation angle to check
 * @returns True if rotation is a standard angle
 */
export function isStandardRotation(rotation: number): boolean {
  return STANDARD_ROTATIONS.includes(rotation as typeof STANDARD_ROTATIONS[number]);
}
