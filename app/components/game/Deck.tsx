/**
 * Deck Component
 * 
 * Displays the card deck with remaining count and click to draw interaction.
 * Shows card back image and provides visual feedback.
 * 
 * @module components/game/Deck
 */

'use client';

import Image from 'next/image';
import type { DeckProps } from '@/app/lib/types/game';

/**
 * Deck component with card count badge.
 * 
 * @example
 * <Deck
 *   deck={{ cards: [...], originalCount: 20 }}
 *   onDrawCard={handleDrawCard}
 * />
 */
export function Deck({ deck, onDrawCard, disabled = false }: DeckProps) {
  const isEmpty = deck.cards.length === 0;
  const isDisabled = disabled || isEmpty;
  
  // Base styles
  const baseStyles = 'relative aspect-[5/7] w-20 sm:w-24 md:w-28 rounded-lg border-2 shadow-lg transition-all duration-200';
  
  // State-specific styles
  const stateStyles = isEmpty
    ? 'bg-zinc-200 border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 opacity-50'
    : 'bg-zinc-800 border-zinc-700 dark:bg-zinc-900 dark:border-zinc-700';
  
  // Interactive styles
  const interactiveStyles = !isDisabled
    ? 'cursor-pointer hover:scale-105 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 active:scale-95'
    : 'cursor-not-allowed';
  
  const deckClasses = `${baseStyles} ${stateStyles} ${interactiveStyles}`.trim();
  
  const handleClick = () => {
    if (!isDisabled) {
      onDrawCard();
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isDisabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onDrawCard();
    }
  };
  
  return (
    <div
      className={deckClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={isEmpty ? 'Deck is empty' : `Draw card from deck (${deck.cards.length} remaining)`}
      aria-disabled={isDisabled}
    >
      {/* Card back image */}
      {!isEmpty && (
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <Image
            src="/card-back.svg"
            alt="Card back"
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      
      {/* Empty state */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-zinc-500 dark:text-zinc-600">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <div className="text-xs font-medium">Empty</div>
          </div>
        </div>
      )}
      
      {/* Card count badge */}
      {!isEmpty && (
        <div className="absolute -top-2 -right-2 bg-blue-600 dark:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900">
          {deck.cards.length}
        </div>
      )}
      
      {/* Deck name tooltip (optional) */}
      {deck.name && !isEmpty && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {deck.name}
        </div>
      )}
      
      {/* Focus ring */}
      <div className="absolute inset-0 rounded-lg ring-2 ring-transparent focus-within:ring-blue-500 dark:focus-within:ring-blue-400" />
    </div>
  );
}
