/**
 * Playfield Component
 * 
 * Main game area that displays the deck and played cards.
 * Uses CSS Grid for responsive card layout.
 * 
 * @module components/game/Playfield
 */

'use client';

import { Deck } from './Deck';
import { Card } from './Card';
import type { PlayfieldProps } from '@/app/lib/types/game';

/**
 * Playfield component with deck and card grid.
 * 
 * @example
 * <Playfield
 *   playfield={{ cards: [...] }}
 *   deck={{ cards: [...], originalCount: 20 }}
 *   onDrawCard={handleDrawCard}
 * />
 */
export function Playfield({ playfield, deck, onDrawCard }: PlayfieldProps) {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-40">
      {/* Main playfield container - extra bottom padding for Hand */}
      <div className="bg-gradient-to-br from-green-800 to-green-900 dark:from-green-950 dark:to-green-900 rounded-2xl shadow-2xl p-6 sm:p-8 min-h-[calc(100vh-16rem)]">
        
        {/* Deck area - positioned at top left */}
        <div className="mb-8">
          <div className="inline-block">
            <Deck deck={deck} onDrawCard={onDrawCard} />
          </div>
        </div>
        
        {/* Played cards grid */}
        <div className="mt-8">
          {playfield.cards.length > 0 ? (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
              {playfield.cards.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  location="playfield"
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-zinc-100/50 dark:text-zinc-200/30 py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-lg font-medium">No cards on playfield</p>
              <p className="text-sm mt-2">Draw cards from the deck and play them to see them here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
