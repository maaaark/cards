/**
 * usePlayfieldPositions Hook
 * 
 * Manages card positions and z-index stacking on the playfield.
 * Handles position storage, z-index incrementation, and bring-to-front operations.
 * 
 * @module hooks/usePlayfieldPositions
 */

'use client';

import { useState, useCallback } from 'react';
import type { CardPosition, Position2D } from './useDragAndDrop';

// ============================================================================
// Constants
// ============================================================================

const MAX_Z_INDEX = 10000;

// ============================================================================
// Hook
// ============================================================================

export function usePlayfieldPositions(
  initialPositions: Map<string, CardPosition> = new Map(),
  initialNextZIndex: number = 1
) {
  const [positions, setPositions] = useState<Map<string, CardPosition>>(initialPositions);
  const [nextZIndex, setNextZIndex] = useState<number>(initialNextZIndex);

  // ============================================================================
  // Position Operations
  // ============================================================================

  const setCardPosition = useCallback(
    (cardId: string, position: Position2D): CardPosition => {
      const newPosition: CardPosition = {
        cardId,
        x: position.x,
        y: position.y,
        zIndex: nextZIndex,
      };

      setPositions((prev) => {
        const updated = new Map(prev);
        updated.set(cardId, newPosition);
        return updated;
      });

      setNextZIndex((prev) => (prev >= MAX_Z_INDEX ? 1 : prev + 1));

      return newPosition;
    },
    [nextZIndex]
  );

  const removeCardPosition = useCallback((cardId: string) => {
    setPositions((prev) => {
      const updated = new Map(prev);
      updated.delete(cardId);
      return updated;
    });
  }, []);

  const bringToFront = useCallback((cardId: string) => {
    setPositions((prev) => {
      const existing = prev.get(cardId);
      if (!existing) return prev;

      const updated = new Map(prev);
      updated.set(cardId, {
        ...existing,
        zIndex: nextZIndex,
      });
      return updated;
    });

    setNextZIndex((prev) => (prev >= MAX_Z_INDEX ? 1 : prev + 1));
  }, [nextZIndex]);

  const getCardPosition = useCallback(
    (cardId: string): CardPosition | undefined => {
      return positions.get(cardId);
    },
    [positions]
  );

  const clearPositions = useCallback(() => {
    setPositions(new Map());
    setNextZIndex(1);
  }, []);

  const loadPositions = useCallback(
    (newPositions: Map<string, CardPosition>, newNextZIndex?: number) => {
      setPositions(newPositions);
      
      // If nextZIndex not provided, calculate from max existing z-index
      if (newNextZIndex !== undefined) {
        setNextZIndex(newNextZIndex);
      } else {
        let maxZIndex = 0;
        newPositions.forEach((pos) => {
          if (pos.zIndex > maxZIndex) {
            maxZIndex = pos.zIndex;
          }
        });
        setNextZIndex(maxZIndex + 1);
      }
    },
    []
  );

  // ============================================================================
  // Z-Index Normalization
  // ============================================================================

  const normalizeZIndexes = useCallback(() => {
    // Sort positions by z-index
    const sorted = Array.from(positions.entries())
      .sort(([, a], [, b]) => a.zIndex - b.zIndex);

    // Reassign z-indexes starting from 1
    const normalized = new Map<string, CardPosition>();
    sorted.forEach(([cardId, pos], index) => {
      normalized.set(cardId, {
        ...pos,
        zIndex: index + 1,
      });
    });

    setPositions(normalized);
    setNextZIndex(sorted.length + 1);
  }, [positions]);

  // ============================================================================
  // Public API
  // ============================================================================

  return {
    positions,
    nextZIndex,
    setCardPosition,
    removeCardPosition,
    bringToFront,
    getCardPosition,
    clearPositions,
    loadPositions,
    normalizeZIndexes,
  };
}
