/**
 * Card Component
 * 
 * Displays a single playing card with proper aspect ratio and styling.
 * Supports dark mode, hover states, and accessibility.
 * 
 * @module components/game/Card
 */

'use client';

import { memo } from 'react';
import Image from 'next/image';
import type { CardProps } from '@/app/lib/types/game';

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
  const isClickable = onClick && !disabled;
  
  // Base styles with aspect ratio
  const baseStyles = 'relative aspect-[5/7] rounded-lg border-2 shadow-md transition-all duration-200';
  
  // Location-specific styles
  const locationStyles = {
    deck: 'bg-zinc-800 border-zinc-700 dark:bg-zinc-900 dark:border-zinc-800',
    hand: 'bg-white border-zinc-300 dark:bg-zinc-800 dark:border-zinc-600',
    playfield: 'bg-white border-zinc-300 dark:bg-zinc-800 dark:border-zinc-600',
  };
  
  // Interactive styles
  const interactiveStyles = isClickable
    ? 'cursor-pointer hover:scale-105 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 active:scale-95'
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
  
  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={`${card.name}${disabled ? ' (disabled)' : ''}`}
      aria-disabled={disabled}
    >
      {/* Card content */}
      <div className="absolute inset-0 p-2 sm:p-3 flex flex-col justify-between">
        {/* Card name - top */}
        <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 break-words">
          {card.name}
        </div>
        
        {/* Card image placeholder - center */}
        {card.imageUrl ? (
          <div className="flex-1 flex items-center justify-center relative">
            <Image
              src={card.imageUrl}
              alt={card.name}
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          </div>
        )}
        
        {/* Card ID - bottom (for development) */}
        <div className="text-[0.6rem] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {card.id.slice(0, 8)}
        </div>
      </div>
      
      {/* Focus ring */}
      <div className="absolute inset-0 rounded-lg ring-2 ring-transparent focus-within:ring-blue-500 dark:focus-within:ring-blue-400" />
    </div>
  );
}

/**
 * Memoized Card component for performance optimization.
 * Prevents unnecessary re-renders when parent state changes.
 */
export const Card = memo(CardComponent);
