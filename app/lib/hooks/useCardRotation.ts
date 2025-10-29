/**
 * Card Rotation Hook
 * 
 * Custom hook for managing card rotation state.
 * Provides methods to get, set, and manipulate card rotation angles.
 * 
 * @module hooks/useCardRotation
 */

'use client';

import { useCallback, useMemo } from 'react';
import { normalizeRotation, calculateNextRotation } from '../utils/rotation';

/**
 * Hook for managing card rotation state.
 * 
 * @param rotations - Map of card rotations (cardId -> degrees)
 * @param setRotations - Setter function for rotation map
 * @returns Object with rotation management methods
 * 
 * @example
 * const { getRotation, rotateCard, setRotation } = useCardRotation(
 *   rotations,
 *   setRotations
 * );
 * 
 * // Get current rotation
 * const angle = getRotation('card-123'); // returns 0 if not rotated
 * 
 * // Rotate by delta
 * rotateCard('card-123', 90); // rotate 90° clockwise
 * 
 * // Set specific angle
 * setRotation('card-123', 180);
 */
export function useCardRotation(
  rotations: Map<string, number>,
  setRotations: (updater: (prev: Map<string, number>) => Map<string, number>) => void
) {
  /**
   * Get current rotation for a card.
   * Returns 0 if card has no rotation entry.
   */
  const getRotation = useCallback(
    (cardId: string): number => {
      return rotations.get(cardId) ?? 0;
    },
    [rotations]
  );

  /**
   * Rotate a card by a given delta (positive = clockwise, negative = counter-clockwise).
   * Automatically normalizes the result to 0-359 range.
   */
  const rotateCard = useCallback(
    (cardId: string, delta: number): void => {
      setRotations((prev) => {
        const current = prev.get(cardId) ?? 0;
        const next = calculateNextRotation(current, delta);
        const updated = new Map(prev);
        updated.set(cardId, next);
        return updated;
      });
    },
    [setRotations]
  );

  /**
   * Set a card's rotation to a specific angle.
   * Automatically normalizes the angle to 0-359 range.
   */
  const setRotation = useCallback(
    (cardId: string, degrees: number): void => {
      setRotations((prev) => {
        const normalized = normalizeRotation(degrees);
        const updated = new Map(prev);
        updated.set(cardId, normalized);
        return updated;
      });
    },
    [setRotations]
  );

  /**
   * Clear rotation for a card (set back to 0).
   */
  const clearRotation = useCallback(
    (cardId: string): void => {
      setRotations((prev) => {
        const updated = new Map(prev);
        updated.delete(cardId);
        return updated;
      });
    },
    [setRotations]
  );

  /**
   * Clear all rotations (reset all cards to 0).
   */
  const clearAllRotations = useCallback((): void => {
    setRotations(() => new Map());
  }, [setRotations]);

  /**
   * Check if a card is currently rotated (not at 0°).
   */
  const isRotated = useCallback(
    (cardId: string): boolean => {
      const rotation = rotations.get(cardId);
      return rotation !== undefined && rotation !== 0;
    },
    [rotations]
  );

  return useMemo(
    () => ({
      getRotation,
      rotateCard,
      setRotation,
      clearRotation,
      clearAllRotations,
      isRotated,
    }),
    [getRotation, rotateCard, setRotation, clearRotation, clearAllRotations, isRotated]
  );
}
