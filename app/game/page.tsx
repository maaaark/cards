/**
 * Game Page
 * 
 * Main game page that renders the playfield and manages game state.
 * Initializes game with test deck and handles all game operations.
 * 
 * @module app/game/page
 */

'use client';

import { useState } from 'react';
import { useGameState } from '@/app/lib/hooks/useGameState';
import { useDragAndDrop } from '@/app/lib/hooks/useDragAndDrop';
import { Playfield } from '@/app/components/game/Playfield';
import { Hand } from '@/app/components/game/Hand';
import { DeckImport } from '@/app/components/game/DeckImport';
import { Button } from '@/app/components/ui/Button';
import { ThemeToggle } from '@/app/components/ui/ThemeToggle';
import { AltKeyProvider } from '@/app/lib/contexts/AltKeyContext';
import { CardPreviewProvider } from '@/app/lib/contexts/CardPreviewContext';
import { CardPreview } from '@/app/components/game/CardPreview';
import { useCardPreview } from '@/app/lib/hooks/useCardPreview';
import type { Card } from '@/app/lib/types/game';

/**
 * Inner game page component (needs to be inside providers).
 */
function GamePageInner() {
  const {
    deck,
    hand,
    playfield,
    drawCard,
    importDeck,
    resetGame,
    isLoading,
    error,
    moveCardToPlayfield,
    updateCardPosition,
    moveCardToHand,
    discardCard,
  } = useGameState();

  const { previewState, previewPosition, previewDimensions } = useCardPreview();
  const { startDrag } = useDragAndDrop();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  // Handle card drag start from hand or playfield
  const handleCardDragStart = (card: Card, event: React.MouseEvent) => {
    // Determine source based on where the card is
    const isOnPlayfield = playfield.cards.some(c => c.id === card.id);
    const source = isOnPlayfield ? 'playfield' : 'hand';
    
    // Get original position if on playfield
    const originalPosition = isOnPlayfield
      ? playfield.positions.get(card.id)
      : undefined;
    
    const originalPositionWithCardId = originalPosition
      ? { ...originalPosition, cardId: card.id }
      : undefined;
    
    startDrag({
      card,
      source,
      event,
      originalPosition: originalPositionWithCardId,
    });
  };

  const handleImport = (deckImport: { name: string; cards: Array<{ id: string; name: string; imageUrl?: string; metadata?: Record<string, unknown> }> }) => {
    importDeck(deckImport);
    setStatusMessage(`✓ Imported deck: ${deckImport.name} (${deckImport.cards.length} cards)`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleImportError = (errorMsg: string) => {
    setStatusMessage(`✗ Import failed: ${errorMsg}`);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleReset = () => {
    if (confirm('Reset game to test deck? This will clear your current game.')) {
      resetGame();
      setStatusMessage('✓ Game reset to test deck');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">Loading game...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center max-w-md">
          <div className="text-red-500 dark:text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Error Loading Game
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Game info header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Card Sandbox
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Deck: {deck.cards.length}/{deck.originalCount} cards
              {deck.name && ` • ${deck.name}`}
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 sm:gap-6 text-sm">
            <div className="text-center hidden sm:block">
              <div className="text-zinc-500 dark:text-zinc-400">Hand</div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {hand.cards.length}
              </div>
            </div>
            <div className="text-center hidden sm:block">
              <div className="text-zinc-500 dark:text-zinc-400">Playfield</div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {playfield.cards.length}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <ThemeToggle />
              <DeckImport onImport={handleImport} onError={handleImportError} />
              <Button variant="secondary" size="sm" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>
        </div>
        
        {/* Status message */}
        {statusMessage && (
          <div className="max-w-7xl mx-auto mt-2">
            <div className={`text-sm px-3 py-2 rounded-lg ${
              statusMessage.startsWith('✓') 
                ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}>
              {statusMessage}
            </div>
          </div>
        )}
      </header>

      {/* Playfield */}
      <Playfield
        playfield={playfield}
        deck={deck}
        onDrawCard={drawCard}
        onMoveCardToPlayfield={moveCardToPlayfield}
        onUpdateCardPosition={updateCardPosition}
        onMoveCardToHand={moveCardToHand}
        onDiscardCard={discardCard}
      />
      
      {/* Hand - fixed at bottom */}
      <Hand 
        hand={hand}
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
    </main>
  );
}

/**
 * Game page component with providers.
 */
export default function GamePage() {
  return (
    <AltKeyProvider>
      <CardPreviewProvider>
        <GamePageInner />
      </CardPreviewProvider>
    </AltKeyProvider>
  );
}
