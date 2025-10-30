/**
 * useGameRoom Hook
 * 
 * React hook for managing multiplayer game room operations.
 * Provides functions to create, join, leave, and manage game rooms.
 * 
 * @module hooks/useGameRoom
 */

'use client';

import { useState, useCallback } from 'react';
import { supabase } from '../supabase/client';
import {
  createGameRoom as createGameRoomUtil,
  joinGameRoom as joinGameRoomUtil,
  leaveGameRoom as leaveGameRoomUtil,
  getGameRoom,
  closeGameRoom as closeGameRoomUtil,
  updatePlayerDisplayName,
  updatePlayfieldState as updatePlayfieldStateUtil,
} from '../utils/game-room';
import {
  getCurrentPlayerId,
  setCurrentGameId,
  clearCurrentGameId,
  getCurrentGameId,
} from '../utils/player-session';
import type { UseGameRoomReturn, GameRoomState, MultiplayerGameSession } from '../types/multiplayer';

/**
 * Hook for game room management.
 * 
 * Provides comprehensive game room operations including creation, joining,
 * leaving, and state synchronization.
 * 
 * @returns Game room state and management functions
 * 
 * @example
 * const { gameRoom, createGameRoom, joinGameRoom, leaveGameRoom } = useGameRoom();
 * 
 * // Create a new game room
 * const gameId = await createGameRoom('Player 1', 4);
 * 
 * // Join an existing game room
 * await joinGameRoom('game-id-123', 'Player 2');
 * 
 * // Leave current game room
 * await leaveGameRoom();
 */
export function useGameRoom(): UseGameRoomReturn {
  const [gameRoom, setGameRoom] = useState<GameRoomState>({
    session: null,
    currentPlayer: null,
    connectionState: {
      status: 'disconnected',
      reconnectAttempts: 0,
    },
    isLoading: false,
    error: undefined,
  });

  /**
   * Create a new game room.
   */
  const createGameRoom = useCallback(async (
    displayName: string,
    maxPlayers: number = 4
  ): Promise<string> => {
    setGameRoom(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const playerId = getCurrentPlayerId();
      if (!playerId) {
        throw new Error('No player session found. Please set a display name first.');
      }

      const sessionId = crypto.randomUUID();
      
      // Create game room with empty deck initially
      const gameId = await createGameRoomUtil(supabase, {
        sessionId,
        creatorPlayerId: playerId,
        displayName,
        maxPlayers,
        deckState: {
          cards: [],
          originalCount: 0,
          name: 'Empty Deck',
        },
      });

      // Store current game ID
      setCurrentGameId(gameId);

      // Load the created game room
      const session = await getGameRoom(supabase, gameId);
      if (session) {
        const currentPlayer = session.players.find(p => p.playerId === playerId);
        setGameRoom({
          session,
          currentPlayer: currentPlayer || null,
          connectionState: {
            status: 'connected',
            reconnectAttempts: 0,
          },
          isLoading: false,
          error: undefined,
        });
      }

      return gameId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create game room';
      setGameRoom(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  /**
   * Join an existing game room.
   */
  const joinGameRoom = useCallback(async (
    gameId: string,
    displayName: string
  ): Promise<void> => {
    setGameRoom(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const playerId = getCurrentPlayerId();
      if (!playerId) {
        throw new Error('No player session found. Please set a display name first.');
      }

      await joinGameRoomUtil(supabase, {
        gameId,
        playerId,
        displayName,
      });

      // Store current game ID
      setCurrentGameId(gameId);

      // Load the joined game room
      const session = await getGameRoom(supabase, gameId);
      if (session) {
        const currentPlayer = session.players.find(p => p.playerId === playerId);
        setGameRoom({
          session,
          currentPlayer: currentPlayer || null,
          connectionState: {
            status: 'connected',
            reconnectAttempts: 0,
          },
          isLoading: false,
          error: undefined,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join game room';
      setGameRoom(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  /**
   * Leave current game room.
   */
  const leaveGameRoom = useCallback(async (): Promise<void> => {
    setGameRoom(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const playerId = getCurrentPlayerId();
      const gameId = getCurrentGameId();
      
      if (!playerId || !gameId) {
        throw new Error('No active game session');
      }

      await leaveGameRoomUtil(supabase, {
        gameId,
        playerId,
      });

      // Clear current game ID
      clearCurrentGameId();

      // Reset state
      setGameRoom({
        session: null,
        currentPlayer: null,
        connectionState: {
          status: 'disconnected',
          reconnectAttempts: 0,
        },
        isLoading: false,
        error: undefined,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave game room';
      setGameRoom(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  /**
   * Update current player's display name.
   */
  const updateDisplayName = useCallback(async (newName: string): Promise<void> => {
    const playerId = getCurrentPlayerId();
    const gameId = getCurrentGameId();
    
    if (!playerId || !gameId) {
      throw new Error('No active game session');
    }

    try {
      await updatePlayerDisplayName(supabase, {
        gameId,
        playerId,
        displayName: newName,
      });

      // Update local state
      if (gameRoom.currentPlayer) {
        setGameRoom(prev => ({
          ...prev,
          currentPlayer: prev.currentPlayer ? {
            ...prev.currentPlayer,
            displayName: newName,
          } : null,
        }));
      }
    } catch (error) {
      console.error('Failed to update display name:', error);
      throw error;
    }
  }, [gameRoom.currentPlayer]);

  /**
   * Close game room to new players (creator only).
   */
  const closeGameRoom = useCallback(async (): Promise<void> => {
    const playerId = getCurrentPlayerId();
    const gameId = getCurrentGameId();
    
    if (!playerId || !gameId) {
      throw new Error('No active game session');
    }

    try {
      await closeGameRoomUtil(supabase, {
        gameId,
        creatorPlayerId: playerId,
      });

      // Update local state
      if (gameRoom.session) {
        setGameRoom(prev => ({
          ...prev,
          session: prev.session ? {
            ...prev.session,
            isClosed: true,
          } : null,
        }));
      }
    } catch (error) {
      console.error('Failed to close game room:', error);
      throw error;
    }
  }, [gameRoom.session]);

  /**
   * Update shared playfield state.
   */
  const updatePlayfieldState = useCallback(async (
    state: MultiplayerGameSession['playfieldState']
  ): Promise<void> => {
    const gameId = getCurrentGameId();
    
    if (!gameId) {
      throw new Error('No active game session');
    }

    try {
      await updatePlayfieldStateUtil(supabase, {
        gameId,
        playfieldState: state,
      });

      // Update local state
      if (gameRoom.session) {
        setGameRoom(prev => ({
          ...prev,
          session: prev.session ? {
            ...prev.session,
            playfieldState: state,
          } : null,
        }));
      }
    } catch (error) {
      console.error('Failed to update playfield state:', error);
      throw error;
    }
  }, [gameRoom.session]);

  /**
   * Broadcast message to all players (placeholder for Realtime).
   */
  const broadcastMessage = useCallback((message: { type: string; payload: unknown }) => {
    // This will be implemented when we add Realtime support
    console.log('Broadcasting message:', message);
  }, []);

  return {
    gameRoom,
    createGameRoom,
    joinGameRoom,
    leaveGameRoom,
    updateDisplayName,
    closeGameRoom,
    updatePlayfieldState,
    broadcastMessage,
  };
}
