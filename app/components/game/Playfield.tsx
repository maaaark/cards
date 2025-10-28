/**
 * Playfield Component
 * 
 * Main game area that displays the deck and played cards.
 * Supports drag-and-drop card positioning with absolute coordinates.
 * 
 * @module components/game/Playfield
 */

'use client';

import { useRef, useEffect } from 'react';
import { Deck } from './Deck';
import { Card } from './Card';
import type { PlayfieldProps, Card as CardType } from '@/app/lib/types/game';
import { useDragAndDrop } from '@/app/lib/hooks/useDragAndDrop';
import type { PlayfieldBounds } from '@/app/lib/hooks/useDragAndDrop';

/**
 * Playfield component with deck and drag-drop card positioning.
 * 
 * @example
 * <Playfield
 *   playfield={{ cards: [...], positions: new Map(), nextZIndex: 1 }}
 *   deck={{ cards: [...], originalCount: 20 }}
 *   onDrawCard={handleDrawCard}
 *   onMoveCardToPlayfield={handleMoveToPlayfield}
 *   onUpdateCardPosition={handleUpdatePosition}
 *   onMoveCardToHand={handleMoveToHand}
 *   onDiscardCard={handleDiscard}
 * />
 */
export function Playfield({ 
  playfield, 
  deck, 
  onDrawCard,
  onMoveCardToPlayfield,
  onUpdateCardPosition,
  onMoveCardToHand,
  onDiscardCard,
}: PlayfieldProps) {
  const playfieldRef = useRef<HTMLDivElement>(null);
  const { dragState, startDrag, endDrag, getDropZone, setDropZoneConfig } = useDragAndDrop();
  const playfieldBoundsRef = useRef<PlayfieldBounds | null>(null);
  
  // Calculate and update playfield bounds for drop detection
  useEffect(() => {
    if (!playfieldRef.current) return;
    
    const updateBounds = () => {
      if (!playfieldRef.current) return;
      const rect = playfieldRef.current.getBoundingClientRect();
      const bounds: PlayfieldBounds = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      };
      playfieldBoundsRef.current = bounds;
      setDropZoneConfig({
        playfieldBounds: bounds,
        edgeThreshold: 50, // Forgiving threshold at edges
      });
    };
    
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, [setDropZoneConfig]);
  
  const handleCardDragStart = (card: CardType, event: React.MouseEvent) => {
    // Get card's current position if on playfield
    const currentPosition = playfield.positions.get(card.id);
    
    // Determine source: check if card is in hand or on playfield
    const isOnPlayfield = playfield.cards.some(c => c.id === card.id);
    const source = isOnPlayfield ? 'playfield' : 'hand';
    
    const originalPosition = currentPosition
      ? { ...currentPosition, cardId: card.id }
      : undefined;
    
    // For cards on playfield, calculate offset relative to playfield coordinates
    let customOffset: { x: number; y: number } | undefined;
    if (isOnPlayfield && currentPosition && playfieldRef.current) {
      const playfieldRect = playfieldRef.current.getBoundingClientRect();
      // Mouse position relative to playfield
      const mouseX = event.clientX - playfieldRect.left;
      const mouseY = event.clientY - playfieldRect.top;
      // Offset from card's playfield position to mouse
      customOffset = {
        x: mouseX - currentPosition.x,
        y: mouseY - currentPosition.y,
      };
    }
    
    startDrag({
      card,
      source,
      event,
      originalPosition,
      customOffset,
    });
  };
  
  const handleMouseUp = (event: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedCardId) return;
    
    const dropZone = getDropZone({ x: event.clientX, y: event.clientY });
    const playfieldElement = playfieldRef.current;
    
    // Handle drop based on zone
    if (dropZone === 'playfield' && playfieldElement) {
      const rect = playfieldElement.getBoundingClientRect();
      // Account for the offset (where on the card the user clicked)
      const x = event.clientX - rect.left - dragState.offset.x;
      const y = event.clientY - rect.top - dragState.offset.y;
      
      // Check if card is already on playfield (repositioning)
      const isOnPlayfield = playfield.cards.some(c => c.id === dragState.draggedCardId);
      
      if (isOnPlayfield && onUpdateCardPosition) {
        // Update existing card position
        onUpdateCardPosition(dragState.draggedCardId, {
          cardId: dragState.draggedCardId,
          x,
          y,
          zIndex: playfield.nextZIndex,
        });
      } else if (onMoveCardToPlayfield) {
        // Move from hand to playfield
        onMoveCardToPlayfield(dragState.draggedCardId, {
          cardId: dragState.draggedCardId,
          x,
          y,
          zIndex: playfield.nextZIndex,
        });
      }
    } else if (dropZone === 'hand' && onMoveCardToHand) {
      // Move from playfield to hand
      const isOnPlayfield = playfield.cards.some(c => c.id === dragState.draggedCardId);
      if (isOnPlayfield) {
        onMoveCardToHand(dragState.draggedCardId);
      }
    } else if (dropZone === 'discard' && onDiscardCard) {
      // Discard card permanently
      const isOnPlayfield = playfield.cards.some(c => c.id === dragState.draggedCardId);
      if (isOnPlayfield) {
        onDiscardCard(dragState.draggedCardId);
      }
    }
    
    // Clear drag state
    endDrag(event.nativeEvent);
  };
  
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-40">
      {/* Main playfield container - extra bottom padding for Hand */}
      <div 
        ref={playfieldRef}
        className="bg-gradient-to-br from-green-800 to-green-900 dark:from-green-950 dark:to-green-900 rounded-2xl shadow-2xl p-6 sm:p-8 min-h-[calc(100vh-16rem)] relative transition-all duration-200"
        onMouseUp={handleMouseUp}
      >
        
        {/* Deck area - positioned at top left */}
        <div className="mb-8">
          <div className="inline-block">
            <Deck deck={deck} onDrawCard={onDrawCard} />
          </div>
        </div>
        
        {/* Played cards with absolute positioning */}
        <div className="mt-8 relative min-h-[400px]">
          {playfield.cards.length > 0 ? (
            <>
              {playfield.cards.map((card) => {
                const position = playfield.positions.get(card.id);
                const isDraggingThisCard = dragState.isDragging && dragState.draggedCardId === card.id;
                
                // Calculate drag offset for CSS transform (GPU-accelerated, smooth)
                let dragOffset: { x: number; y: number } | undefined;
                if (isDraggingThisCard && dragState.currentPosition && dragState.startPosition) {
                  // Only apply offset if mouse has moved
                  const hasMoved = 
                    dragState.currentPosition.x !== dragState.startPosition.x ||
                    dragState.currentPosition.y !== dragState.startPosition.y;
                  
                  if (hasMoved) {
                    // Transform = (current mouse - start mouse)
                    // This moves the card by exactly how much the mouse moved
                    dragOffset = {
                      x: dragState.currentPosition.x - dragState.startPosition.x,
                      y: dragState.currentPosition.y - dragState.startPosition.y,
                    };
                  }
                }
                
                return (
                  <Card
                    key={card.id}
                    card={card}
                    location="playfield"
                    draggable={true}
                    isDragging={isDraggingThisCard}
                    position={position}
                    dragOffset={dragOffset}
                    onDragStart={handleCardDragStart}
                  />
                );
              })}
            </>
          ) : (
            <div className="text-center text-zinc-100/50 dark:text-zinc-200/30 py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-lg font-medium">No cards on playfield</p>
              <p className="text-sm mt-2">Drag cards from your hand onto the playfield</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
