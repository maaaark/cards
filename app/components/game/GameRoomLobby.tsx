/**
 * GameRoomLobby Component
 * 
 * UI component for browsing, creating, and joining multiplayer game rooms.
 * Displays a list of available game rooms with real-time updates.
 * 
 * @module components/game/GameRoomLobby
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { listGameRooms } from '@/app/lib/utils/game-room';
import { usePlayerSession } from '@/app/lib/hooks/usePlayerSession';
import { useGameRoom } from '@/app/lib/hooks/useGameRoom';
import { createPlayerSession } from '@/app/lib/utils/player-session';
import type { MultiplayerGameSession } from '@/app/lib/types/multiplayer';
import { Button } from '../ui/Button';

/**
 * GameRoomLobby component for browsing and managing game rooms.
 */
export function GameRoomLobby() {
  const [availableRooms, setAvailableRooms] = useState<MultiplayerGameSession[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [maxPlayersInput, setMaxPlayersInput] = useState(4);
  const [error, setError] = useState<string>('');

  const { playerId, displayName, setDisplayName } = usePlayerSession();
  const { createGameRoom, joinGameRoom } = useGameRoom();

  // Load available game rooms
  useEffect(() => {
    loadRooms();
    
    // Subscribe to game_sessions changes for real-time updates
    const channel = supabase
      .channel('lobby-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
        },
        () => {
          loadRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRooms = async () => {
    try {
      setIsLoadingRooms(true);
      const rooms = await listGameRooms(supabase, { openOnly: true });
      setAvailableRooms(rooms);
    } catch (err) {
      console.error('Failed to load rooms:', err);
      setError('Failed to load game rooms');
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!displayNameInput.trim()) {
      setError('Please enter a display name');
      return;
    }

    try {
      setError('');
      
      // Ensure player session exists BEFORE creating room
      let currentPlayerId = playerId;
      if (!currentPlayerId) {
        const session = createPlayerSession(displayNameInput);
        currentPlayerId = session.playerId;
        // Update hook state (but don't wait for it)
        setDisplayName(displayNameInput);
      }

      const gameId = await createGameRoom(displayNameInput, maxPlayersInput);
      
      // Navigate to game page
      window.location.href = `/game/${gameId}`;
    } catch (err) {
      console.error('Failed to create room:', err);
      setError(err instanceof Error ? err.message : 'Failed to create room');
    }
  };

  const handleJoinRoom = async (gameId: string) => {
    if (!displayName && !displayNameInput.trim()) {
      setError('Please enter a display name first');
      return;
    }

    try {
      setError('');
      
      // Ensure player session exists BEFORE joining room
      let currentPlayerId = playerId;
      if (!currentPlayerId) {
        const session = createPlayerSession(displayNameInput);
        currentPlayerId = session.playerId;
        // Update hook state (but don't wait for it)
        setDisplayName(displayNameInput);
      }

      await joinGameRoom(gameId, displayName || displayNameInput);
      
      // Navigate to game page
      window.location.href = `/game/${gameId}`;
    } catch (err) {
      console.error('Failed to join room:', err);
      setError(err instanceof Error ? err.message : 'Failed to join room');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Game Lobby
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Join an existing game or create your own
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Player Info */}
        {playerId && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-900 dark:text-blue-100">
              Playing as: <strong>{displayName}</strong>
            </p>
          </div>
        )}

        {/* Create Room Section */}
        {!showCreateModal ? (
          <div className="mb-8">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
            >
              + Create New Game Room
            </Button>
          </div>
        ) : (
          <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Create New Game Room
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Display Name
                </label>
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Players
                </label>
                <select
                  value={maxPlayersInput}
                  onChange={(e) => setMaxPlayersInput(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num} players
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateRoom}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Create Room
                </Button>
                <Button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Available Rooms */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Available Game Rooms
          </h2>

          {isLoadingRooms ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading rooms...</p>
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No game rooms available. Create one to get started!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableRooms.map((room) => (
                <div
                  key={room.id}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Room #{room.id.slice(0, 8)}
                      </h3>
                      {room.isClosed && (
                        <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">
                          Closed
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {room.playerCount} / {room.maxPlayers} players
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Players:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {room.players.map((player) => (
                        <span
                          key={player.id}
                          className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded"
                        >
                          {player.displayName}
                          {player.isCreator && (
                            <span className="ml-1 text-yellow-500">★</span>
                          )}
                          {player.isOnline && (
                            <span className="ml-1 w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  {!room.isClosed && room.playerCount < room.maxPlayers && (
                    <Button
                      onClick={() => handleJoinRoom(room.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Join Room
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
