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
  draggable = false,
  isDragging = false,
  position,
  dragOffset,
  onDragStart,
  rotation = 0,
  onMouseEnter: onMouseEnterProp,
  onMouseLeave: onMouseLeaveProp,
}: CardProps) {
  const [imageError, setImageError] = useState(false);
  const { showPreview, hidePreview } = useCardPreview();
  const isClickable = onClick && !disabled;
  
  // Inline styles for absolute positioning, drag transform, and rotation
  const outerInlineStyles: React.CSSProperties | undefined = position
    ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isDragging ? 9999 : position.zIndex,
        transform: dragOffset 
          ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`
          : `rotate(${rotation}deg)`,
        // Disable all transitions when dragging or when we have a drag offset
        // Only enable rotation transitions when card is stationary
        transition: (isDragging || dragOffset) ? 'none' : 'transform 0.3s ease-in-out',
      }
    : undefined;
  
  // Inner card styles (relative positioning for content layout)
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
  
  // Drag styles
  const dragStyles = draggable ? 'cursor-grab active:cursor-grabbing' : '';
  const draggingStyles = isDragging ? 'scale-105 shadow-2xl z-[999]' : '';
  
  // Disabled styles
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  // Responsive sizing
  const sizeStyles = location === 'deck'
    ? 'w-20 sm:w-24 md:w-28'
    : 'w-20 sm:w-24 md:w-28 lg:w-32';
  
  const cardClasses = `${baseStyles} ${locationStyles[location]} ${interactiveStyles} ${dragStyles} ${draggingStyles} ${disabledStyles} ${sizeStyles} ${className}`.trim();
  
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

  // Preview and hover handlers
  const handleMouseEnter = () => {
    showPreview(card);
    onMouseEnterProp?.(card);
  };

  const handleMouseLeave = () => {
    hidePreview(card.id);
    onMouseLeaveProp?.(card);
  };
  
  // Drag handlers
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (draggable && onDragStart && !disabled) {
      // Prevent text selection during drag
      event.preventDefault();
      onDragStart(card, event);
    }
  };
  
  // Card content (always relative for internal layout)
  const cardContent = (
    <div
      className={cardClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
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
  );
  
  // Wrap in absolute positioning wrapper if on playfield
  if (position) {
    return (
      <div className="absolute" style={outerInlineStyles}>
        {cardContent}
      </div>
    );
  }
  
  // Otherwise return card content directly
  return cardContent;
}

/**
 * Memoized Card component for performance optimization.
 * Prevents unnecessary re-renders when parent state changes.
 */
export const Card = memo(CardComponent);
