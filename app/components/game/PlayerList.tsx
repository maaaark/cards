/**
 * PlayerList Component
 * 
 * Displays a list of players in the current game room with online status.
 * Shows player names, creator badge, and online indicators.
 * 
 * @module components/game/PlayerList
 */

'use client';

import type { PlayerListProps } from '@/app/lib/types/multiplayer';

/**
 * PlayerList component for displaying game room participants.
 */
export function PlayerList({
  players,
  currentPlayerId,
  showOnlineStatus = true,
  className = '',
}: PlayerListProps) {
  if (players.length === 0) {
    return (
      <div className={`text-center py-4 text-gray-500 dark:text-gray-400 ${className}`}>
        No players in the room
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {players.map((player) => {
        const isCurrentPlayer = player.playerId === currentPlayerId;
        
        return (
          <div
            key={player.id}
            className={`
              flex items-center justify-between p-3 rounded-lg border
              ${isCurrentPlayer 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }
            `}
          >
            <div className="flex items-center gap-3">
              {/* Player Avatar/Initial */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${isCurrentPlayer
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                  }
                `}
              >
                {player.displayName.charAt(0).toUpperCase()}
              </div>

              {/* Player Info */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {player.displayName}
                  </span>
                  
                  {isCurrentPlayer && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                      You
                    </span>
                  )}
                  
                  {player.isCreator && (
                    <span className="text-yellow-500" title="Room Creator">
                      ★
                    </span>
                  )}
                </div>
                
                {showOnlineStatus && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <span
                      className={`
                        w-2 h-2 rounded-full
                        ${player.isOnline ? 'bg-green-500' : 'bg-gray-400'}
                      `}
                    />
                    {player.isOnline ? 'Online' : 'Offline'}
                  </div>
                )}
              </div>
            </div>

            {/* Player Stats (Cards in hand) */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {player.handState.cards.length} cards
            </div>
          </div>
        );
      })}
    </div>
  );
}
