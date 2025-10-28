/**
 * Card Component
 * 
 * Displays a single playing card with proper aspect ratio and styling.
 * Supports dark mode, hover states, accessibility, and ALT+hover preview.
 * 
 * @module components/game/Card
 */

'use client';

import { memo, useState } from 'react';
import Image from 'next/image';
import type { CardProps } from '@/app/lib/types/game';
import { useCardPreview } from '@/app/lib/hooks/useCardPreview';

/**
 * Card component with standard trading card aspect ratio (5:7).
 * 
 * @example
 * <Card
 *   card={{ id: '1', name: 'Lightning Bolt' }}
 *   location="hand"
 *   onClick={handleClick}
 * />
 */
function CardComponent({
  card,
  onClick,
  disabled = false,
  className = '',
  location,
}: CardProps) {
  const [imageError, setImageError] = useState(false);
  const { showPreview, hidePreview } = useCardPreview();
  const isClickable = onClick && !disabled;
  
  // Base styles with aspect ratio - borderless
  const baseStyles = 'relative aspect-[5/7] transition-all duration-200';
  
  // Location-specific styles (minimal background for empty state)
  const locationStyles = {
    deck: 'bg-zinc-800 dark:bg-zinc-900',
    hand: 'bg-zinc-100 dark:bg-zinc-800',
    playfield: 'bg-zinc-100 dark:bg-zinc-800',
  };
  
  // Interactive styles
  const interactiveStyles = isClickable
    ? 'cursor-pointer hover:scale-105 hover:shadow-xl active:scale-95'
    : '';
  
  // Disabled styles
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  // Responsive sizing
  const sizeStyles = location === 'deck'
    ? 'w-20 sm:w-24 md:w-28'
    : 'w-20 sm:w-24 md:w-28 lg:w-32';
  
  const cardClasses = `${baseStyles} ${locationStyles[location]} ${interactiveStyles} ${disabledStyles} ${sizeStyles} ${className}`.trim();
  
  const handleClick = () => {
    if (isClickable) {
      onClick(card);
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick(card);
    }
  };

  // Preview handlers
  const handleMouseEnter = () => {
    showPreview(card);
  };

  const handleMouseLeave = () => {
    hidePreview(card.id);
  };
  
  return (
    <>
      <div
        className={cardClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={`${card.name}${disabled ? ' (disabled)' : ''}`}
        aria-disabled={disabled}
      >
        {/* Card image - full size */}
        {card.imageUrl && !imageError ? (
          <Image
            src={card.imageUrl}
            alt={card.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          /* Fallback card with border and title when no image */
          <div className="absolute inset-0 border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex flex-col items-center justify-center gap-3 p-3">
            <div className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 text-center break-words">
              {card.name}
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            {imageError && (
              <div className="text-xs text-red-500 dark:text-red-400 text-center">
                Image unavailable
              </div>
            )}
          </div>
        )}
        
        {/* Focus ring */}
        <div className="absolute inset-0 ring-2 ring-transparent focus-within:ring-blue-500 dark:focus-within:ring-blue-400" />
      </div>
    </>
  );
}

/**
 * Memoized Card component for performance optimization.
 * Prevents unnecessary re-renders when parent state changes.
 */
export const Card = memo(CardComponent);
