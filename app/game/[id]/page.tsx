/**
 * Multiplayer Game Room Page
 * 
 * Main page for multiplayer game sessions. Handles real-time synchronization,
 * player management, and game state updates.
 * 
 * @module app/game/[id]/page
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameRoom } from '@/app/lib/hooks/useGameRoom';
import { useRealtimeGameRoom } from '@/app/lib/hooks/useRealtimeGameRoom';
import { usePlayerSession } from '@/app/lib/hooks/usePlayerSession';
import { useGameState } from '@/app/lib/hooks/useGameState';
import { useCardPreview } from '@/app/lib/hooks/useCardPreview';
import { useDragAndDrop } from '@/app/lib/hooks/useDragAndDrop';
import { AltKeyProvider } from '@/app/lib/contexts/AltKeyContext';
import { CardPreviewProvider } from '@/app/lib/contexts/CardPreviewContext';
import { PlayerList } from '@/app/components/game/PlayerList';
import { ConnectionStatus } from '@/app/components/game/ConnectionStatus';
import { Playfield } from '@/app/components/game/Playfield';
import { Hand } from '@/app/components/game/Hand';
import { CardPreview } from '@/app/components/game/CardPreview';
import { Button } from '@/app/components/ui/Button';
import type { CardPosition } from '@/app/lib/hooks/useDragAndDrop';
import type { Card } from '@/app/lib/types/game';

/**
 * Inner multiplayer game page component (needs to be inside providers).
 */
function MultiplayerGamePageInner() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const { playerId } = usePlayerSession();
  const { gameRoom, loadGameRoom, leaveGameRoom, closeGameRoom, updatePlayfieldState } = useGameRoom();
  const { connectionState, subscribe, unsubscribe } = useRealtimeGameRoom();

  const [isInitializing, setIsInitializing] = useState(true);
  const [showPlayerList, setShowPlayerList] = useState(true);
  const [hasLoadedInitialState, setHasLoadedInitialState] = useState(false);
  
  // Game state hook for card management
  const gameState = useGameState();
  
  // Card preview hook
  const { previewState, previewPosition, previewDimensions } = useCardPreview();
  
  // Drag and drop hook
  const { startDrag, dragState, endDrag, getDropZone, setDropZoneConfig } = useDragAndDrop();
  
  // Track hovered card for rotation
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  
  const playfieldRef = useRef<HTMLDivElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced sync function
  const syncPlayfieldState = useCallback(() => {
    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Debounce the sync to avoid too many updates
    syncTimeoutRef.current = setTimeout(() => {
      updatePlayfieldState({
        cards: gameState.playfield.cards,
        positions: Object.fromEntries(gameState.playfield.positions),
        rotations: Object.fromEntries(gameState.playfield.rotations),
        nextZIndex: gameState.playfield.nextZIndex,
      });
    }, 300); // 300ms debounce
  }, [gameState.playfield, updatePlayfieldState]);

  // Unified handler for all card drag starts (hand or playfield)
  const handleCardDragStart = useCallback((card: Card, event: React.MouseEvent) => {
    // Determine if card is on playfield or in hand
    const isOnPlayfield = gameState.playfield.cards.some(c => c.id === card.id);
    const source = isOnPlayfield ? 'playfield' : 'hand';
    
    // Get current position if on playfield
    const currentPosition = gameState.playfield.positions.get(card.id);
    
    const originalPosition = currentPosition
      ? { ...currentPosition, cardId: card.id }
      : undefined;
    
    // Calculate offset for drag
    let customOffset: { x: number; y: number } | undefined;
    
    if (isOnPlayfield && currentPosition && playfieldRef.current) {
      // For playfield cards: calculate offset relative to playfield coordinates
      const playfieldRect = playfieldRef.current.getBoundingClientRect();
      const mouseX = event.clientX - playfieldRect.left;
      const mouseY = event.clientY - playfieldRect.top;
      customOffset = {
        x: mouseX - currentPosition.x,
        y: mouseY - currentPosition.y,
      };
    } else if (!isOnPlayfield) {
      // For hand cards: use default centered offset
      customOffset = undefined;
    }
    
    startDrag({
      card,
      source,
      event,
      originalPosition,
      customOffset,
    });
  }, [gameState.playfield.cards, gameState.playfield.positions, startDrag]);

  // Handler for card mouse enter (for rotation)
  const handleCardMouseEnter = useCallback((card: Card) => {
    setHoveredCardId(card.id);
  }, []);

  // Handler for card mouse leave (for rotation)
  const handleCardMouseLeave = useCallback(() => {
    setHoveredCardId(null);
  }, []);

  // Keyboard handler for card rotation (E and Q keys)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if a card is hovered and it's on the playfield
      if (!hoveredCardId || !gameState.playfield.cards.some(c => c.id === hoveredCardId)) {
        return;
      }
      
      // Check for E key (rotate 90° clockwise)
      if (event.key === 'e' || event.key === 'E') {
        event.preventDefault();
        gameState.rotateCard(hoveredCardId, 90);
      }
      // Check for Q key (rotate 90° counter-clockwise)
      else if (event.key === 'q' || event.key === 'Q') {
        event.preventDefault();
        gameState.rotateCard(hoveredCardId, -90);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredCardId]);

  // Initialize game room and Realtime connection
  useEffect(() => {
    if (!playerId || !gameId) return;

    const initialize = async () => {
      try {
        // Load game room state into the hook
        await loadGameRoom(gameId);

        // Subscribe to real-time updates (state sync will happen via callbacks)
        await subscribe(gameId, {
          onGameSessionUpdate: (session) => {
            console.log('Game session updated:', session);
            
            // Update local playfield state from server
            if (session.playfieldState) {
              const { cards, positions, rotations, nextZIndex } = session.playfieldState;
              
              // Convert position/rotation objects to Maps
              const positionsMap = new Map(Object.entries(positions || {}).map(([id, pos]) => [id, pos]));
              const rotationsMap = new Map(Object.entries(rotations || {}).map(([id, rot]) => [id, rot]));
              
              // Update playfield state
              gameState.loadPlayfieldState({
                cards: cards || [],
                positions: positionsMap,
                rotations: rotationsMap,
                nextZIndex: nextZIndex || 1,
              });
            }
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
        // If loading failed, redirect to lobby
        router.push('/lobby');
      }
    };

    initialize();

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, gameId]);

  // Load initial playfield state from game room after it's loaded
  useEffect(() => {
    if (gameRoom.session?.playfieldState && !hasLoadedInitialState) {
      const { cards, positions, rotations, nextZIndex } = gameRoom.session.playfieldState;
      
      // Convert position/rotation objects to Maps
      const positionsMap = new Map(Object.entries(positions || {}).map(([id, pos]) => [id, pos]));
      const rotationsMap = new Map(Object.entries(rotations || {}).map(([id, rot]) => [id, rot]));
      
      // Update playfield state
      gameState.loadPlayfieldState({
        cards: cards || [],
        positions: positionsMap,
        rotations: rotationsMap,
        nextZIndex: nextZIndex || 1,
      });
      
      // Mark initial state as loaded (delayed to avoid cascading renders)
      queueMicrotask(() => setHasLoadedInitialState(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameRoom.session, hasLoadedInitialState]);

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
  
  // Handle card actions (synced after each action)
  const handleDrawCard = () => {
    gameState.drawCard();
    // No sync needed - deck/hand are local
  };
  
  const handleMoveCardToPlayfield = (cardId: string, position: CardPosition) => {
    gameState.moveCardToPlayfield(cardId, position);
    syncPlayfieldState();
  };
  
  const handleUpdateCardPosition = (cardId: string, position: CardPosition) => {
    gameState.updateCardPosition(cardId, position);
    syncPlayfieldState();
  };
  
  const handleMoveCardToHand = (cardId: string) => {
    gameState.moveCardToHand(cardId);
    syncPlayfieldState();
  };
  
  const handleDiscardCard = (cardId: string) => {
    gameState.discardCard(cardId);
    syncPlayfieldState();
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
                  onCardDragStart={handleCardDragStart}
                  onCardMouseEnter={handleCardMouseEnter}
                  onCardMouseLeave={handleCardMouseLeave}
                  playfieldRef={playfieldRef}
                  dragState={dragState}
                  endDrag={endDrag}
                  getDropZone={getDropZone}
                  setDropZoneConfig={setDropZoneConfig}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hand - fixed at bottom */}
      <Hand 
        hand={gameState.hand}
        onCardDragStart={handleCardDragStart}
      />

      {/* Card preview overlay (renders when ALT+hover) */}
      {previewState.isActive && previewState.card && previewPosition && (
        <CardPreview
          card={previewState.card}
          position={previewPosition}
          dimensions={previewDimensions}
        />
      )}
    </div>
  );
}

/**
 * Multiplayer game page component with providers.
 */
export default function MultiplayerGamePage() {
  return (
    <AltKeyProvider>
      <CardPreviewProvider>
        <MultiplayerGamePageInner />
      </CardPreviewProvider>
    </AltKeyProvider>
  );
}
