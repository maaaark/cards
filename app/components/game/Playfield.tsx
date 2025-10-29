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
import { useCardRotation } from '@/app/lib/hooks/useCardRotation';
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
  onCardDragStart,
  onCardMouseEnter,
  onCardMouseLeave,
  playfieldRef: externalPlayfieldRef,
  dragState: externalDragState,
  endDrag: externalEndDrag,
  getDropZone: externalGetDropZone,
  setDropZoneConfig: externalSetDropZoneConfig,
}: PlayfieldProps) {
  const internalPlayfieldRef = useRef<HTMLDivElement>(null);
  const playfieldRef = externalPlayfieldRef || internalPlayfieldRef;
  
  // Use external drag state if provided, otherwise use internal
  const internalDragAndDrop = useDragAndDrop();
  const dragState = externalDragState || internalDragAndDrop.dragState;
  const endDrag = externalEndDrag || internalDragAndDrop.endDrag;
  const getDropZone = externalGetDropZone || internalDragAndDrop.getDropZone;
  const setDropZoneConfig = externalSetDropZoneConfig || internalDragAndDrop.setDropZoneConfig;
  
  // Initialize rotation hook (read-only, actual state managed by parent)
  // We'll use getRotation to fetch rotation for each card
  const { getRotation } = useCardRotation(
    playfield.rotations,
    () => {} // No-op setter since Playfield doesn't modify rotations
  );
  
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
    if (!dragState.isDragging || !dragState.draggedCardId) {
      return;
    }
    
    const dropZone = getDropZone({ x: event.clientX, y: event.clientY });
    const playfieldElement = playfieldRef.current;
    
    // Check if card is on playfield
    const isOnPlayfield = playfield.cards.some(c => c.id === dragState.draggedCardId);
    const wasFromHand = dragState.draggedCardSource === 'hand';
    
    // Handle drop based on zone
    if (dropZone === 'playfield' && playfieldElement) {
      const rect = playfieldElement.getBoundingClientRect();
      
      // Account for the offset (where on the card the user clicked)
      const x = event.clientX - rect.left - dragState.offset.x;
      const y = event.clientY - rect.top - dragState.offset.y;
      
      // Find card for logging
      const card = playfield.cards.find((c: { id: string }) => c.id === dragState.draggedCardId);
      
      if (wasFromHand && onMoveCardToPlayfield) {
        // Move from hand to playfield
        console.log('🎴 Card placed:', {
          name: card?.name || dragState.draggedCardId.substring(0, 8),
          position: { x: Math.round(x), y: Math.round(y) },
          zIndex: playfield.nextZIndex,
          totalCardsOnPlayfield: playfield.cards.length + 1
        });
        
        onMoveCardToPlayfield(dragState.draggedCardId, {
          cardId: dragState.draggedCardId,
          x,
          y,
          zIndex: playfield.nextZIndex,
        });
      } else if (isOnPlayfield && onUpdateCardPosition) {
        // Update position of card already on playfield
        console.log('🎴 Card moved:', {
          name: card?.name || dragState.draggedCardId.substring(0, 8),
          position: { x: Math.round(x), y: Math.round(y) },
          zIndex: playfield.nextZIndex,
          totalCardsOnPlayfield: playfield.cards.length
        });
        
        onUpdateCardPosition(dragState.draggedCardId, {
          cardId: dragState.draggedCardId,
          x,
          y,
          zIndex: playfield.nextZIndex,
        });
      }
    } else if (dropZone === 'hand' && onMoveCardToHand) {
      // Move from playfield to hand (only if card was on playfield)
      if (isOnPlayfield) {
        onMoveCardToHand(dragState.draggedCardId);
      }
    } else if (dropZone === 'discard' && onDiscardCard) {
      // Discard card permanently (only if card was on playfield)
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
        className="bg-gradient-to-br from-green-800 to-green-900 dark:from-green-950 dark:to-green-900 rounded-2xl shadow-2xl relative"
        style={{ width: 'fit-content', padding: '2rem' }}
        onMouseUp={handleMouseUp}
      >
        
        {/* Deck area - positioned at top left */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="inline-block">
            <Deck deck={deck} onDrawCard={onDrawCard} />
          </div>
        </div>
        
        {/* Played cards with absolute positioning - fixed dimensions */}
        <div ref={playfieldRef} className="relative border border-white/20" style={{ width: '1200px', height: '500px', overflow: 'hidden' }}>
          {/* Ghost card for hand cards being dragged */}
          {(() => {
            const showGhost = dragState.isDragging && 
                             dragState.draggedCardSource === 'hand' && 
                             dragState.currentPosition && 
                             playfieldRef.current && 
                             dragState.draggedCard;
            
            if (!showGhost || !dragState.currentPosition || !dragState.draggedCard || !playfieldRef.current) return null;
            
            const rect = playfieldRef.current.getBoundingClientRect();
            const x = dragState.currentPosition.x - rect.left - dragState.offset.x;
            const y = dragState.currentPosition.y - rect.top - dragState.offset.y;
            
            return (
              <Card
                key={`ghost-${dragState.draggedCardId}`}
                card={dragState.draggedCard}
                location="playfield"
                draggable={false}
                isDragging={true}
                position={{
                  cardId: dragState.draggedCardId!,
                  x,
                  y,
                  zIndex: 9999,
                }}
              />
            );
          })()}
          
          {playfield.cards.length > 0 ? (
            <>
              {playfield.cards.map((card) => {
                const storedPosition = playfield.positions.get(card.id);
                const rotation = getRotation(card.id);
                const isDraggingThisCard = dragState.isDragging && dragState.draggedCardId === card.id;
                
                // Calculate actual position during drag
                let position = storedPosition;
                let dragOffset: { x: number; y: number } | undefined;
                
                if (isDraggingThisCard && dragState.currentPosition && storedPosition && playfieldRef.current) {
                  // Calculate the card's position in real-time during drag
                  const rect = playfieldRef.current.getBoundingClientRect();
                  const x = dragState.currentPosition.x - rect.left - dragState.offset.x;
                  const y = dragState.currentPosition.y - rect.top - dragState.offset.y;
                  
                  // Update position to follow cursor (instant, no transition)
                  position = {
                    cardId: card.id,
                    x,
                    y,
                    zIndex: 9999, // Always on top while dragging
                  };
                  // No dragOffset needed since we're updating position directly
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
                    rotation={rotation}
                    onDragStart={onCardDragStart}
                    onMouseEnter={onCardMouseEnter}
                    onMouseLeave={onCardMouseLeave}
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
