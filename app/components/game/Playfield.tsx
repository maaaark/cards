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
import type { PlayfieldProps } from '@/app/lib/types/game';
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
  onUpdateCardPosition,
  onMoveCardToHand,
  onDiscardCard,
  onCardDragStart,
  playfieldRef: externalPlayfieldRef,
}: PlayfieldProps) {
  const internalPlayfieldRef = useRef<HTMLDivElement>(null);
  const playfieldRef = externalPlayfieldRef || internalPlayfieldRef;
  const { dragState, endDrag, getDropZone, setDropZoneConfig } = useDragAndDrop();
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
    // playfieldRef is stable and doesn't need to be in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setDropZoneConfig]);
  
  const handleMouseUp = (event: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedCardId) return;
    
    const dropZone = getDropZone({ x: event.clientX, y: event.clientY });
    const playfieldElement = playfieldRef.current;
    
    // Check if card is on playfield
    const isOnPlayfield = playfield.cards.some(c => c.id === dragState.draggedCardId);
    
    // Handle drop based on zone
    if (dropZone === 'playfield' && playfieldElement && isOnPlayfield) {
      // Card is already on playfield (either was there, or we moved it on mousedown)
      // Update position if it was repositioned
      const rect = playfieldElement.getBoundingClientRect();
      // Account for the offset (where on the card the user clicked)
      const x = event.clientX - rect.left - dragState.offset.x;
      const y = event.clientY - rect.top - dragState.offset.y;
      
      if (onUpdateCardPosition) {
        onUpdateCardPosition(dragState.draggedCardId, {
          cardId: dragState.draggedCardId,
          x,
          y,
          zIndex: playfield.nextZIndex,
        });
      }
    } else if (dropZone === 'hand' && onMoveCardToHand) {
      // Move from playfield to hand
      if (isOnPlayfield) {
        onMoveCardToHand(dragState.draggedCardId);
      }
    } else if (dropZone === 'discard' && onDiscardCard) {
      // Discard card permanently
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
                    onDragStart={onCardDragStart}
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
