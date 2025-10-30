/**
 * useRealtimeGameRoom Hook
 * 
 * React hook for Supabase Realtime subscriptions to game room updates.
 * Manages WebSocket connections, presence tracking, and real-time synchronization.
 * 
 * @module hooks/useRealtimeGameRoom
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  UseRealtimeGameRoomReturn,
  ConnectionState,
  RealtimeCallbacks,
  BroadcastMessage,
  MultiplayerGameSession,
  Player,
  PresencePayload,
} from '../types/multiplayer';
import { getCurrentPlayerId } from '../utils/player-session';
import { MULTIPLAYER_CONFIG } from '../types/multiplayer';

/**
 * Hook for Realtime game room subscriptions.
 * 
 * Manages WebSocket connections to Supabase Realtime for live updates,
 * presence tracking, and broadcast messaging.
 * 
 * @returns Realtime connection state and management functions
 * 
 * @example
 * const { connectionState, subscribe, unsubscribe, broadcast } = useRealtimeGameRoom();
 * 
 * // Subscribe to game room updates
 * await subscribe('game-id-123', {
 *   onGameSessionUpdate: (session) => console.log('Session updated:', session),
 *   onPlayerUpdate: (player) => console.log('Player updated:', player),
 *   onPresenceChange: (state) => console.log('Presence changed:', state),
 * });
 * 
 * // Broadcast a message
 * broadcast({ type: 'card_moved', payload: { cardId: '123', x: 100, y: 200 } });
 * 
 * // Unsubscribe when done
 * unsubscribe();
 */
export function useRealtimeGameRoom(): UseRealtimeGameRoomReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    reconnectAttempts: 0,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbacksRef = useRef<RealtimeCallbacks>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Unsubscribe from current channel.
   */
  const unsubscribe = useCallback(async () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setConnectionState({
      status: 'disconnected',
      reconnectAttempts: 0,
    });
  }, []);

  /**
   * Subscribe to game room updates.
   */
  const subscribe = useCallback(async (
    gameId: string,
    callbacks: RealtimeCallbacks
  ): Promise<void> => {
    // Unsubscribe from previous channel if exists
    if (channelRef.current) {
      await unsubscribe();
    }

    callbacksRef.current = callbacks;
    setConnectionState(prev => ({ ...prev, status: 'connecting' }));

    try {
      const playerId = getCurrentPlayerId();
      if (!playerId) {
        throw new Error('No player session found');
      }

      // Create channel for this game room
      const channel = supabase.channel(`game-room:${gameId}`, {
        config: {
          presence: {
            key: playerId,
          },
        },
      });

      // Subscribe to database changes (game_sessions table)
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          if (callbacks.onGameSessionUpdate) {
            const session = payload.new as unknown as MultiplayerGameSession;
            callbacks.onGameSessionUpdate(session);
          }
        }
      );

      // Subscribe to player changes
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (callbacks.onPlayerUpdate) {
            const player = (payload.new || payload.old) as unknown as Player;
            callbacks.onPlayerUpdate(player);
          }
        }
      );

      // Subscribe to presence (online/offline status)
      channel.on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState() as PresencePayload;
        if (callbacks.onPresenceChange) {
          callbacks.onPresenceChange(presenceState);
        }
      });

      // Subscribe to broadcast messages
      channel.on('broadcast', { event: 'game-action' }, (payload) => {
        if (callbacks.onBroadcast) {
          callbacks.onBroadcast(payload.payload as BroadcastMessage);
        }
      });

      // Handle reconnection inline
      const attemptReconnect = () => {
        setConnectionState(prev => {
          const attempts = prev.reconnectAttempts + 1;
          
          if (attempts >= MULTIPLAYER_CONFIG.MAX_RECONNECT_ATTEMPTS) {
            if (callbacks.onError) {
              callbacks.onError('Max reconnection attempts reached');
            }
            return {
              status: 'error',
              error: 'Max reconnection attempts reached',
              reconnectAttempts: attempts,
            };
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            subscribe(gameId, callbacks).catch(err => {
              console.error('Reconnection failed:', err);
            });
          }, MULTIPLAYER_CONFIG.RECONNECT_DELAY);

          return {
            status: 'reconnecting',
            reconnectAttempts: attempts,
          };
        });
      };

      // Subscribe to channel
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionState({
            status: 'connected',
            reconnectAttempts: 0,
            lastConnectedAt: new Date(),
          });

          await channel.track({
            playerId,
            online_at: new Date().toISOString(),
          });
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionState(prev => ({
            ...prev,
            status: 'error',
            error: 'Channel subscription failed',
          }));

          if (callbacks.onError) {
            callbacks.onError('Channel subscription failed');
          }

          attemptReconnect();
        } else if (status === 'TIMED_OUT') {
          setConnectionState(prev => ({
            ...prev,
            status: 'reconnecting',
          }));

          attemptReconnect();
        }
      });

      channelRef.current = channel;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe';
      setConnectionState({
        status: 'error',
        error: errorMessage,
        reconnectAttempts: 0,
      });

      if (callbacks.onError) {
        callbacks.onError(errorMessage);
      }

      throw error;
    }
  }, [unsubscribe]);

  /**
   * Broadcast message to all players in the channel.
   */
  const broadcast = useCallback((message: Omit<BroadcastMessage, 'senderId' | 'timestamp'>) => {
    if (!channelRef.current) {
      console.warn('Cannot broadcast: not subscribed to a channel');
      return;
    }

    const playerId = getCurrentPlayerId();
    if (!playerId) {
      console.warn('Cannot broadcast: no player session');
      return;
    }

    const fullMessage: BroadcastMessage = {
      ...message,
      senderId: playerId,
      timestamp: Date.now(),
    };

    channelRef.current.send({
      type: 'broadcast',
      event: 'game-action',
      payload: fullMessage,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    connectionState,
    subscribe,
    unsubscribe,
    broadcast,
  };
}
