/**
 * useCardPreview Hook
 * 
 * Custom hook that provides access to card preview state and actions.
 * Must be used within a CardPreviewProvider.
 * 
 * @module hooks/useCardPreview
 */

'use client';

import { useContext, useMemo } from 'react';
import { CardPreviewContext } from '../contexts/CardPreviewContext';
import type { UseCardPreviewReturn } from '../types/card-preview';
import { DEFAULT_PREVIEW_DIMENSIONS } from '../types/card-preview';
import { calculatePreviewPosition } from '../utils/card-preview-position';

/**
 * Hook to access card preview state and actions.
 * 
 * @returns Object containing preview state and control functions
 * @throws Error if used outside CardPreviewProvider
 * 
 * @example
 * ```tsx
 * function Card({ card }) {
 *   const { showPreview, hidePreview } = useCardPreview();
 *   
 *   return (
 *     <div
 *       onMouseEnter={() => showPreview(card)}
 *       onMouseLeave={() => hidePreview(card.id)}
 *     >
 *       {card.title}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCardPreview(): UseCardPreviewReturn {
  const context = useContext(CardPreviewContext);

  if (context === undefined) {
    throw new Error('useCardPreview must be used within a CardPreviewProvider');
  }

  // Calculate preview position based on current state
  const previewPosition = useMemo(() => {
    if (!context.previewState.isActive) {
      return null;
    }

    return calculatePreviewPosition({
      mouseX: context.previewState.mouseX,
      mouseY: context.previewState.mouseY,
      previewWidth: DEFAULT_PREVIEW_DIMENSIONS.width,
      previewHeight: DEFAULT_PREVIEW_DIMENSIONS.height,
      viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
      viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 1080,
    });
  }, [
    context.previewState.isActive,
    context.previewState.mouseX,
    context.previewState.mouseY,
  ]);

  return {
    previewState: context.previewState,
    showPreview: context.showPreview,
    hidePreview: context.hidePreview,
    previewPosition,
    previewDimensions: DEFAULT_PREVIEW_DIMENSIONS,
  };
}
