/**
 * Multiplayer Game Room Page
 * 
 * Main page for multiplayer game sessions. Handles real-time synchronization,
 * player management, and game state updates.
 * 
 * @module app/game/[id]/page
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase/client';
import { useGameRoom } from '@/app/lib/hooks/useGameRoom';
import { useRealtimeGameRoom } from '@/app/lib/hooks/useRealtimeGameRoom';
import { usePlayerSession } from '@/app/lib/hooks/usePlayerSession';
import { useGameState } from '@/app/lib/hooks/useGameState';
import { getGameRoom } from '@/app/lib/utils/game-room';
import { PlayerList } from '@/app/components/game/PlayerList';
import { ConnectionStatus } from '@/app/components/game/ConnectionStatus';
import { Playfield } from '@/app/components/game/Playfield';
import { Hand } from '@/app/components/game/Hand';
import { Button } from '@/app/components/ui/Button';
import type { CardPosition } from '@/app/lib/hooks/useDragAndDrop';

export default function MultiplayerGamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const { playerId } = usePlayerSession();
  const { gameRoom, leaveGameRoom, closeGameRoom, updatePlayfieldState } = useGameRoom();
  const { connectionState, subscribe, unsubscribe } = useRealtimeGameRoom();

  const [isInitializing, setIsInitializing] = useState(true);
  const [showPlayerList, setShowPlayerList] = useState(true);
  
  // Game state hook for card management
  const gameState = useGameState();

  // Initialize game room and Realtime connection
  useEffect(() => {
    if (!playerId || !gameId) return;

    const initialize = async () => {
      try {
        // Load initial game room state
        const room = await getGameRoom(supabase, gameId);
        if (!room) {
          console.error('Game room not found');
          router.push('/lobby');
          return;
        }

        // Subscribe to real-time updates (state sync will happen via callbacks)
        await subscribe(gameId, {
          onGameSessionUpdate: (session) => {
            console.log('Game session updated:', session);
          },
          onPlayerUpdate: (player) => {
            console.log('Player updated:', player);
          },
          onPresenceChange: (state) => {
            console.log('Presence changed:', state);
          },
          onBroadcast: (message) => {
            console.log('Broadcast received:', message);
          },
          onError: (error) => {
            console.error('Realtime error:', error);
          },
        });

        setIsInitializing(false);
      } catch (error) {
        console.error('Failed to initialize:', error);
        setIsInitializing(false);
      }
    };

    initialize();

    return () => {
      unsubscribe();
    };
  }, [playerId, gameId, subscribe, unsubscribe, router]);

  const handleLeaveRoom = async () => {
    if (confirm('Are you sure you want to leave this game room?')) {
      try {
        await leaveGameRoom();
        router.push('/lobby');
      } catch (error) {
        console.error('Failed to leave room:', error);
      }
    }
  };

  const handleCloseRoom = async () => {
    if (confirm('Close this room to new players?')) {
      try {
        await closeGameRoom();
      } catch (error) {
        console.error('Failed to close room:', error);
      }
    }
  };
  
  // Handle card actions with sync + broadcast
  const handleDrawCard = () => {
    gameState.drawCard();
  };
  
  const handleMoveCardToPlayfield = (cardId: string, position: CardPosition) => {
    gameState.moveCardToPlayfield(cardId, position);
    // Sync playfield only (not full game state)
    updatePlayfieldState({
      cards: gameState.playfield.cards,
      positions: Object.fromEntries(gameState.playfield.positions),
      rotations: Object.fromEntries(gameState.playfield.rotations),
      nextZIndex: gameState.playfield.nextZIndex,
    });
  };
  
  const handleUpdateCardPosition = (cardId: string, position: CardPosition) => {
    gameState.updateCardPosition(cardId, position);
    updatePlayfieldState({
      cards: gameState.playfield.cards,
      positions: Object.fromEntries(gameState.playfield.positions),
      rotations: Object.fromEntries(gameState.playfield.rotations),
      nextZIndex: gameState.playfield.nextZIndex,
    });
  };
  
  const handleMoveCardToHand = (cardId: string) => {
    gameState.moveCardToHand(cardId);
    updatePlayfieldState({
      cards: gameState.playfield.cards,
      positions: Object.fromEntries(gameState.playfield.positions),
      rotations: Object.fromEntries(gameState.playfield.rotations),
      nextZIndex: gameState.playfield.nextZIndex,
    });
  };
  
  const handleDiscardCard = (cardId: string) => {
    gameState.discardCard(cardId);
    updatePlayfieldState({
      cards: gameState.playfield.cards,
      positions: Object.fromEntries(gameState.playfield.positions),
      rotations: Object.fromEntries(gameState.playfield.rotations),
      nextZIndex: gameState.playfield.nextZIndex,
    });
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading game room...</p>
        </div>
      </div>
    );
  }

  if (!gameRoom.session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Game room not found or you&apos;re not a member.
          </p>
          <Button onClick={() => router.push('/lobby')}>
            Return to Lobby
          </Button>
        </div>
      </div>
    );
  }

  const isCreator = gameRoom.currentPlayer?.isCreator || false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Game Room
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {gameRoom.session.playerCount} / {gameRoom.session.maxPlayers} players
              {gameRoom.session.isClosed && ' • Closed'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowPlayerList(!showPlayerList)}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white"
            >
              {showPlayerList ? 'Hide' : 'Show'} Players
            </Button>
            
            {isCreator && !gameRoom.session.isClosed && (
              <Button
                onClick={handleCloseRoom}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Close Room
              </Button>
            )}
            
            <Button
              onClick={handleLeaveRoom}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
            >
              Leave Room
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Connection Status */}
        <div className="mb-4">
          <ConnectionStatus
            connectionState={connectionState}
            onReconnect={() => subscribe(gameId, {})}
            showDetails={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Player List Sidebar */}
          {showPlayerList && (
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Players
                </h2>
                <PlayerList
                  players={gameRoom.session.players}
                  currentPlayerId={playerId}
                  showOnlineStatus={true}
                />
              </div>
            </div>
          )}

          {/* Game Area */}
          <div className={showPlayerList ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <div className="space-y-4">
              {/* Playfield */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Playfield (Shared) • {gameState.playfield.cards.length} cards
                  </h2>
                </div>
                <Playfield
                  playfield={gameState.playfield}
                  deck={gameState.deck}
                  onDrawCard={handleDrawCard}
                  onMoveCardToPlayfield={handleMoveCardToPlayfield}
                  onUpdateCardPosition={handleUpdateCardPosition}
                  onMoveCardToHand={handleMoveCardToHand}
                  onDiscardCard={handleDiscardCard}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hand - fixed at bottom */}
      <Hand hand={gameState.hand} />
    </div>
  );
}
