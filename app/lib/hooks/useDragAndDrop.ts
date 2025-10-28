/**
 * useDragAndDrop Hook
 * 
 * Manages drag-and-drop state and operations for card interactions.
 * Handles mouse events, drop zone detection, and drag lifecycle.
 * 
 * @module hooks/useDragAndDrop
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Card } from '@/app/lib/types/game';

// ============================================================================
// Types
// ============================================================================

export type CardDragSource = 'hand' | 'playfield';
export type DropZone = 'playfield' | 'hand' | 'discard' | 'invalid';

export interface Position2D {
  x: number;
  y: number;
}

export interface CardPosition extends Position2D {
  cardId: string;
  zIndex: number;
}

export interface DragState {
  isDragging: boolean;
  draggedCardId: string | null;
  draggedCardSource: CardDragSource | null;
  startPosition: Position2D | null;
  currentPosition: Position2D | null;
  offset: Position2D;
  originalPosition: CardPosition | null;
  dragStartTime: number | null;
}

export interface PlayfieldBounds {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export interface DropZoneConfig {
  playfieldBounds: PlayfieldBounds | null;
  handBounds: PlayfieldBounds | null;
  edgeThreshold: number;
}

export interface DragStartData {
  card: Card;
  source: CardDragSource;
  event: React.MouseEvent | MouseEvent;
  originalPosition?: CardPosition;
  customOffset?: Position2D;
}

// ============================================================================
// Constants
// ============================================================================

const DRAG_THRESHOLD = 5; // pixels
const EDGE_THRESHOLD = 50; // pixels

// ============================================================================
// Hook
// ============================================================================

export function useDragAndDrop() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedCardId: null,
    draggedCardSource: null,
    startPosition: null,
    currentPosition: null,
    offset: { x: 0, y: 0 },
    originalPosition: null,
    dragStartTime: null,
  });

  const dropZoneConfigRef = useRef<DropZoneConfig>({
    playfieldBounds: null,
    handBounds: null,
    edgeThreshold: EDGE_THRESHOLD,
  });

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const isWithinBounds = useCallback(
    (point: Position2D, bounds: PlayfieldBounds | null, threshold: number = 0): boolean => {
      if (!bounds) return false;
      
      return (
        point.x >= bounds.left - threshold &&
        point.x <= bounds.right + threshold &&
        point.y >= bounds.top - threshold &&
        point.y <= bounds.bottom + threshold
      );
    },
    []
  );

  const getDropZone = useCallback(
    (position: Position2D): DropZone => {
      const config = dropZoneConfigRef.current;

      // Check hand bounds first (exact)
      if (isWithinBounds(position, config.handBounds, 0)) {
        return 'hand';
      }

      // Check playfield bounds (with forgiving threshold)
      if (isWithinBounds(position, config.playfieldBounds, config.edgeThreshold)) {
        return 'playfield';
      }

      // Outside both areas = discard
      return 'discard';
    },
    [isWithinBounds]
  );

  // ============================================================================
  // Drag Operations
  // ============================================================================

  const startDrag = useCallback((data: DragStartData) => {
    const { card, source, event, originalPosition, customOffset } = data;
    const mouseEvent = event as React.MouseEvent;

    // Calculate offset from mouse to card position
    let offset: Position2D;
    
    if (customOffset) {
      // Use provided custom offset (for cards already positioned on playfield)
      offset = customOffset;
    } else {
      // Calculate from element bounds (for cards in hand)
      const cardElement = mouseEvent.currentTarget as HTMLElement;
      const cardRect = cardElement.getBoundingClientRect();
      offset = {
        x: mouseEvent.clientX - cardRect.left,
        y: mouseEvent.clientY - cardRect.top,
      };
    }

    setDragState({
      isDragging: true,
      draggedCardId: card.id,
      draggedCardSource: source,
      startPosition: { x: mouseEvent.clientX, y: mouseEvent.clientY },
      currentPosition: { x: mouseEvent.clientX, y: mouseEvent.clientY },
      offset,
      originalPosition: originalPosition || null,
      dragStartTime: Date.now(),
    });
  }, []);

  const updateDragPosition = useCallback((event: MouseEvent) => {
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      setDragState((prev) => {
        if (!prev.isDragging) return prev;

        return {
          ...prev,
          currentPosition: { x: event.clientX, y: event.clientY },
        };
      });
    });
  }, []);

  const endDrag = useCallback(
    (event: MouseEvent) => {
      if (!dragState.isDragging) return null;

      const dropZone = getDropZone({ x: event.clientX, y: event.clientY });
      const finalPosition = { x: event.clientX, y: event.clientY };

      // Clear drag state
      setDragState({
        isDragging: false,
        draggedCardId: null,
        draggedCardSource: null,
        startPosition: null,
        currentPosition: null,
        offset: { x: 0, y: 0 },
        originalPosition: null,
        dragStartTime: null,
      });

      return {
        cardId: dragState.draggedCardId!,
        source: dragState.draggedCardSource!,
        dropZone,
        finalPosition,
        originalPosition: dragState.originalPosition,
      };
    },
    [dragState, getDropZone]
  );

  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedCardId: null,
      draggedCardSource: null,
      startPosition: null,
      currentPosition: null,
      offset: { x: 0, y: 0 },
      originalPosition: null,
      dragStartTime: null,
    });
  }, []);

  // ============================================================================
  // Check if drag is valid (passed movement threshold)
  // ============================================================================

  const isDragValid = useCallback(() => {
    if (!dragState.isDragging || !dragState.startPosition || !dragState.currentPosition) {
      return false;
    }

    const dx = dragState.currentPosition.x - dragState.startPosition.x;
    const dy = dragState.currentPosition.y - dragState.startPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance > DRAG_THRESHOLD;
  }, [dragState]);

  // ============================================================================
  // Event Listeners
  // ============================================================================

  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updateDragPosition(e);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      // endDrag will be called by the component using the hook
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isDragging, updateDragPosition]);

  // ============================================================================
  // Public API
  // ============================================================================

  const setDropZoneConfig = useCallback((config: Partial<DropZoneConfig>) => {
    dropZoneConfigRef.current = {
      ...dropZoneConfigRef.current,
      ...config,
    };
  }, []);

  return {
    dragState,
    startDrag,
    endDrag,
    cancelDrag,
    isDragValid: isDragValid(),
    getDropZone,
    setDropZoneConfig,
  };
}
