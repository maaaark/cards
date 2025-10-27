/**
 * Hand Component
 * 
 * Displays player's hand of cards fixed at the bottom of the screen.
 * Uses horizontal scrolling for many cards with responsive design.
 * 
 * @module components/game/Hand
 */

'use client';

import { Card } from './Card';
import type { HandProps } from '@/app/lib/types/game';

/**
 * Hand component with fixed bottom positioning.
 * 
 * @example
 * <Hand
 *   hand={{ cards: [...] }}
 *   onPlayCard={handlePlayCard}
 * />
 */
export function Hand({ hand, onPlayCard }: HandProps) {
  const isEmpty = hand.cards.length === 0;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-zinc-100 dark:bg-zinc-800 border-t-2 border-zinc-300 dark:border-zinc-700 shadow-2xl z-50"
      role="list"
      aria-label="Your hand"
    >
      <div className="max-w-screen-xl mx-auto">
        {isEmpty ? (
          // Empty state
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
            <svg
              className="w-12 h-12 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-sm font-medium">Your hand is empty</p>
            <p className="text-xs mt-1">Click the deck to draw cards</p>
          </div>
        ) : (
          // Cards display
          <div className="p-4 overflow-x-auto">
            <div className="flex gap-3 sm:gap-4 justify-center min-w-min">
              {hand.cards.map((card, index) => (
                <div
                  key={card.id}
                  role="listitem"
                  className="flex-shrink-0"
                  style={{
                    // Slight stagger animation for visual interest
                    animation: `slideUp 0.3s ease-out ${index * 0.05}s both`,
                  }}
                >
                  <Card
                    card={card}
                    location="hand"
                    onClick={() => onPlayCard(card.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
