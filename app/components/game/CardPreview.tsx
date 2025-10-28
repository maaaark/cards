/**
 * CardPreview Component
 * 
 * Renders a larger preview of a card near the mouse cursor.
 * Uses React Portal to render above all other content.
 * 
 * @module components/game/CardPreview
 */

'use client';

import { useState, memo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { CardPreviewProps } from '@/app/lib/types/card-preview';
import { PREVIEW_Z_INDEX } from '@/app/lib/types/card-preview';

/**
 * CardPreview component.
 * Renders a large preview card using React Portal for overlay rendering.
 * 
 * Performance: Uses memo to prevent re-renders when position changes frequently.
 * 
 * @example
 * ```tsx
 * {previewState.isActive && previewState.card && previewPosition && (
 *   <CardPreview
 *     card={previewState.card}
 *     position={previewPosition}
 *     dimensions={previewDimensions}
 *   />
 * )}
 * ```
 */
function CardPreviewComponent({
  card,
  position,
  dimensions,
  className = '',
}: CardPreviewProps) {
  const [imageError, setImageError] = useState(false);

  // Check if we're on the client side (SSR safety)
  if (typeof window === 'undefined') return null;

  const previewContent = (
    <div
      className={`fixed pointer-events-none ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        zIndex: PREVIEW_Z_INDEX,
      }}
    >
      {/* Card container with shadow */}
      <div className="relative w-full h-full shadow-2xl rounded-lg overflow-hidden">
        {/* Card image - full size */}
        {card.imageUrl && !imageError ? (
          <Image
            src={card.imageUrl}
            alt={card.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
            priority
          />
        ) : (
          /* Fallback card with border and title when no image */
          <div className="absolute inset-0 border-4 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex flex-col items-center justify-center gap-6 p-6 rounded-lg">
            <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 text-center break-words">
              {card.name}
            </div>
            <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            {imageError && (
              <div className="text-sm text-red-500 dark:text-red-400 text-center">
                Image unavailable
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Render into document.body using Portal
  return createPortal(previewContent, document.body);
}

/**
 * Memoized CardPreview component.
 * Optimizes performance by only re-rendering when card or position changes.
 */
export const CardPreview = memo(CardPreviewComponent);
