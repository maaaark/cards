/**
 * useGameState Hook
 * 
 * Custom React hook for managing game state (deck, hand, playfield).
 * Handles state operations (draw, play, import) and auto-saves to Supabase.
 * 
 * @module hooks/useGameState
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from './useSupabase';
import { generateTestDeck, validateDeckImport } from '../utils/deck';
import { getSessionId } from '../utils/session';
import type {
  Deck,
  Hand,
  Playfield,
  DeckMetadata,
  DeckImport,
  UseGameStateReturn,
} from '../types/game';

/**
 * Hook for managing complete game state with persistence.
 * 
 * @returns Game state and operations
 * 
 * @example
 * const {
 *   deck,
 *   hand,
 *   playfield,
 *   drawCard,
 *   playCard,
 *   importDeck,
 *   resetGame,
 *   isLoading,
 *   error,
 * } = useGameState();
 */
export function useGameState(): UseGameStateReturn {
  const { loadGameState, saveGameState, error: dbError } = useSupabase();
  const [sessionId] = useState(() => getSessionId());
  
  // Game state
  const [deck, setDeck] = useState<Deck>({ cards: [], originalCount: 0 });
  const [hand, setHand] = useState<Hand>({ cards: [] });
  const [playfield, setPlayfield] = useState<Playfield>({ cards: [] });
  const [deckMetadata, setDeckMetadata] = useState<DeckMetadata | undefined>(undefined);
  
  // UI state - only for initial load, not for auto-saves
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  
  // Refs for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  /**
   * Load initial game state from Supabase or create test deck
   */
  useEffect(() => {
    async function loadInitialState() {
      setIsInitialLoading(true);
      setError(undefined);
      
      try {
        const savedState = await loadGameState(sessionId);
        
        if (savedState) {
          // Load saved state
          setDeck(savedState.deck);
          setHand(savedState.hand);
          setPlayfield(savedState.playfield);
          setDeckMetadata(savedState.deckMetadata);
        } else {
          // Initialize with test deck
          const testCards = generateTestDeck(20);
          const testDeck: Deck = {
            cards: testCards,
            originalCount: testCards.length,
            name: 'Test Deck',
          };
          
          setDeck(testDeck);
          setDeckMetadata({
            name: 'Test Deck',
            originalCardCount: testCards.length,
            importedAt: new Date(),
          });
          
          // Save initial state
          await saveGameState(sessionId, {
            deck: testDeck,
            hand: { cards: [] },
            playfield: { cards: [] },
            deckMetadata: {
              name: 'Test Deck',
              originalCardCount: testCards.length,
              importedAt: new Date(),
            },
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load game state';
        setError(errorMessage);
        console.error('Error loading initial state:', err);
      } finally {
        setIsInitialLoading(false);
        isInitialLoadRef.current = false;
      }
    }
    
    loadInitialState();
  }, [sessionId, loadGameState, saveGameState]);

  /**
   * Auto-save game state to Supabase (debounced)
   */
  useEffect(() => {
    // Skip auto-save on initial load
    if (isInitialLoadRef.current) {
      return;
    }
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      saveGameState(sessionId, {
        deck,
        hand,
        playfield,
        deckMetadata,
      }).catch(err => {
        console.error('Auto-save failed:', err);
      });
    }, 500); // AUTO_SAVE_DEBOUNCE_MS from types
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [deck, hand, playfield, deckMetadata, sessionId, saveGameState]);

  /**
   * Draw a card from deck to hand
   */
  const drawCard = useCallback(() => {
    if (deck.cards.length === 0) {
      setError('No cards remaining in deck');
      return;
    }
    
    const [drawnCard, ...remainingCards] = deck.cards;
    
    setDeck(prev => ({
      ...prev,
      cards: remainingCards,
    }));
    
    setHand(prev => ({
      ...prev,
      cards: [...prev.cards, drawnCard],
    }));
    
    setError(undefined);
  }, [deck.cards]);

  /**
   * Play a card from hand to playfield
   */
  const playCard = useCallback((cardId: string) => {
    const cardIndex = hand.cards.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      setError('Card not found in hand');
      return;
    }
    
    const card = hand.cards[cardIndex];
    const newHandCards = [...hand.cards];
    newHandCards.splice(cardIndex, 1);
    
    setHand(prev => ({
      ...prev,
      cards: newHandCards,
    }));
    
    setPlayfield(prev => ({
      ...prev,
      cards: [...prev.cards, card],
    }));
    
    setError(undefined);
  }, [hand.cards]);

  /**
   * Import a new deck from JSON
   */
  const importDeck = useCallback((deckImport: DeckImport) => {
    // Validate deck import
    const validation = validateDeckImport(deckImport);
    
    if (!validation.valid) {
      setError(`Invalid deck: ${validation.errors.join(', ')}`);
      return;
    }
    
    // Set new deck
    const newDeck: Deck = {
      cards: deckImport.cards,
      originalCount: deckImport.cards.length,
      name: deckImport.name,
    };
    
    setDeck(newDeck);
    setDeckMetadata({
      name: deckImport.name,
      originalCardCount: deckImport.cards.length,
      importedAt: new Date(),
    });
    
    // Reset hand and playfield
    setHand({ cards: [] });
    setPlayfield({ cards: [] });
    
    setError(undefined);
  }, []);

  /**
   * Reset game state to initial test deck
   */
  const resetGame = useCallback(() => {
    const testCards = generateTestDeck(20);
    const testDeck: Deck = {
      cards: testCards,
      originalCount: testCards.length,
      name: 'Test Deck',
    };
    
    setDeck(testDeck);
    setHand({ cards: [] });
    setPlayfield({ cards: [] });
    setDeckMetadata({
      name: 'Test Deck',
      originalCardCount: testCards.length,
      importedAt: new Date(),
    });
    
    setError(undefined);
  }, []);

  return {
    deck,
    hand,
    playfield,
    deckMetadata,
    isLoading: isInitialLoading,
    error: error || dbError,
    drawCard,
    playCard,
    importDeck,
    resetGame,
  };
}
