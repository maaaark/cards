/**
 * useSupabase Hook
 * 
 * Custom React hook for Supabase database operations.
 * Provides functions to load, save, and delete game sessions.
 * 
 * @module hooks/useSupabase
 */

'use client';

import { useState, useCallback } from 'react';
import { supabase } from '../supabase/client';
import type { GameState, Deck, Hand, Playfield, DeckMetadata, Card, CardPosition } from '../types/game';
import type { UseSupabaseReturn } from '../types/game';
import type { Database } from '../types/database';

type GameSessionRow = Database['public']['Tables']['game_sessions']['Row'];
type GameSessionInsert = Database['public']['Tables']['game_sessions']['Insert'];

/**
 * Hook for Supabase database operations.
 * 
 * Note: RLS (Row Level Security) is configured using current_setting('app.player_id')
 * in database policies. The player ID is automatically managed by the client.
 * 
 * @returns Object with database operation functions and loading/error state
 * 
 * @example
 * const { loadGameState, saveGameState, isLoading, error } = useSupabase();
 * 
 * // Load state
 * const state = await loadGameState('session-id-123');
 * 
 * // Save state
 * await saveGameState('session-id-123', {
 *   deck: { cards: [], originalCount: 20 },
 *   hand: { cards: [] },
 *   playfield: { cards: [] },
 * });
 */
export function useSupabase(): UseSupabaseReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  /**
   * Loads game state from Supabase by session ID.
   */
  const loadGameState = useCallback(async (sessionId: string): Promise<GameState | null> => {
    setIsLoading(true);
    setError(undefined);

    try {
      const { data, error: fetchError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single<GameSessionRow>();

      if (fetchError) {
        // If no session found, return null (not an error)
        if (fetchError.code === 'PGRST116') {
          return null;
        }
        throw fetchError;
      }

      if (!data) {
        return null;
      }

      // Convert database row to GameState
      const deckState = data.deck_state as unknown as { cards: unknown[]; originalCount: number; name?: string };
      const handState = data.hand_state as unknown as { cards: unknown[]; maxSize?: number };
      const playfieldState = data.playfield_state as unknown as { 
        cards: unknown[]; 
        positions?: Record<string, unknown>; 
        rotations?: Record<string, number>; 
        nextZIndex?: number 
      };
      
      const gameState: GameState = {
        sessionId: data.session_id,
        deck: {
          cards: deckState.cards as Card[],
          originalCount: deckState.originalCount,
          name: deckState.name,
        },
        hand: {
          cards: handState.cards as Card[],
          maxSize: handState.maxSize,
        },
        playfield: {
          cards: playfieldState.cards as Card[],
          positions: new Map(
            playfieldState.positions 
              ? Object.entries(playfieldState.positions) as [string, CardPosition][]
              : []
          ),
          rotations: new Map(
            playfieldState.rotations 
              ? Object.entries(playfieldState.rotations)
              : []
          ),
          nextZIndex: playfieldState.nextZIndex ?? 1,
        },
        deckMetadata: data.deck_metadata ? {
          name: (data.deck_metadata as {name: string}).name,
          originalCardCount: (data.deck_metadata as {originalCardCount: number}).originalCardCount,
          importedAt: new Date((data.deck_metadata as {importedAt: string}).importedAt),
        } : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return gameState;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load game state';
      setError(errorMessage);
      console.error('Error loading game state:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Saves game state to Supabase.
   * Creates new session if doesn't exist, updates if it does.
   */
  const saveGameState = useCallback(async (
    sessionId: string,
    state: {
      deck: Deck;
      hand: Hand;
      playfield: Playfield;
      deckMetadata?: DeckMetadata;
    }
  ): Promise<void> => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Prepare data for database
      const dbData: GameSessionInsert = {
        session_id: sessionId,
        deck_state: JSON.parse(JSON.stringify({
          cards: state.deck.cards,
          originalCount: state.deck.originalCount,
          name: state.deck.name,
        })),
        hand_state: JSON.parse(JSON.stringify({
          cards: state.hand.cards,
          maxSize: state.hand.maxSize,
        })),
        playfield_state: JSON.parse(JSON.stringify({
          cards: state.playfield.cards,
          positions: Object.fromEntries(state.playfield.positions),
          rotations: Object.fromEntries(state.playfield.rotations),
          nextZIndex: state.playfield.nextZIndex,
        })),
        deck_metadata: state.deckMetadata ? JSON.parse(JSON.stringify({
          name: state.deckMetadata.name,
          originalCardCount: state.deckMetadata.originalCardCount,
          importedAt: state.deckMetadata.importedAt.toISOString(),
        })) : undefined,
      };

      // Upsert (insert or update)
      const { error: upsertError } = await supabase
        .from('game_sessions')
        .upsert(dbData, {
          onConflict: 'session_id',
        });

      if (upsertError) {
        throw upsertError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save game state';
      setError(errorMessage);
      console.error('Error saving game state:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Deletes a game session from Supabase.
   */
  const deleteGameState = useCallback(async (sessionId: string): Promise<void> => {
    setIsLoading(true);
    setError(undefined);

    try {
      const { error: deleteError } = await supabase
        .from('game_sessions')
        .delete()
        .eq('session_id', sessionId);

      if (deleteError) {
        throw deleteError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete game session';
      setError(errorMessage);
      console.error('Error deleting game session:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    loadGameState,
    saveGameState,
    deleteGameState,
    isLoading,
    error,
  };
}
