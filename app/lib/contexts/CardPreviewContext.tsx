/**
 * CardPreviewContext
 * 
 * React Context for managing card preview state.
 * Provides centralized state for preview card, position, and interaction tracking.
 * 
 * @module contexts/CardPreviewContext
 */

'use client';

import { createContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Card } from '../types/game';
import type { PreviewState } from '../types/card-preview';
import { useAltKey } from '../hooks/useAltKey';

/**
 * Context value interface
 */
interface CardPreviewContextValue {
  previewState: PreviewState;
  showPreview: (card: Card) => void;
  hidePreview: (cardId: string) => void;
  updateMousePosition: (x: number, y: number) => void;
}

/**
 * Context for card preview state
 */
export const CardPreviewContext = createContext<CardPreviewContextValue | undefined>(undefined);

/**
 * Provider Props
 */
interface CardPreviewProviderProps {
  children: ReactNode;
}

/**
 * CardPreviewProvider Component
 * 
 * Manages card preview state and mouse tracking.
 * Automatically hides preview when ALT key is released.
 * Uses requestAnimationFrame for smooth 60fps position updates.
 * 
 * Performance: Conditionally attaches mousemove listener only when preview is active.
 * 
 * @example
 * ```tsx
 * <CardPreviewProvider>
 *   <YourGameUI />
 * </CardPreviewProvider>
 * ```
 */
export function CardPreviewProvider({ children }: CardPreviewProviderProps) {
  const { isAltPressed } = useAltKey();
  
  const [previewState, setPreviewState] = useState<PreviewState>({
    isActive: false,
    card: null,
    hoveredCardId: null,
    mouseX: 0,
    mouseY: 0,
  });

  /**
   * Show preview for a card.
   * Tracks the hovered card regardless of CTRL state.
   */
  const showPreview = useCallback((card: Card) => {
    setPreviewState(prev => ({
      ...prev,
      card,
      hoveredCardId: card.id,
    }));
  }, []);

  /**
   * Hide preview.
   * Only hides if the cardId matches currently hovered card.
   */
  const hidePreview = useCallback((cardId: string) => {
    setPreviewState(prev => {
      if (prev.hoveredCardId !== cardId) return prev;
      
      return {
        ...prev,
        card: null,
        hoveredCardId: null,
      };
    });
  }, []);

  /**
   * Update mouse position.
   * Throttled using requestAnimationFrame for 60fps performance.
   */
  const updateMousePosition = useCallback((x: number, y: number) => {
    setPreviewState(prev => ({
      ...prev,
      mouseX: x,
      mouseY: y,
    }));
  }, []);

  /**
   * Derived state: preview is only active if ALT is pressed AND a card is hovered.
   * This automatically shows preview when ALT is pressed while hovering,
   * and hides it when ALT is released.
   */
  const effectivePreviewState: PreviewState = {
    ...previewState,
    isActive: isAltPressed && previewState.card !== null,
  };

  /**
   * Attach mousemove listener when a card is hovered (to track position).
   * This ensures mouse position is known when CTRL is pressed.
   */
  useEffect(() => {
    // Track mouse position whenever a card is hovered OR preview is active
    if (!previewState.card && !effectivePreviewState.isActive) return;

    let rafId: number | null = null;
    let latestX = previewState.mouseX;
    let latestY = previewState.mouseY;

    const handleMouseMove = (event: MouseEvent) => {
      latestX = event.clientX;
      latestY = event.clientY;

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          updateMousePosition(latestX, latestY);
          rafId = null;
        });
      }
    };

    // Immediately capture current mouse position if it's still at 0,0
    if (previewState.mouseX === 0 && previewState.mouseY === 0) {
      const captureInitialPosition = (event: MouseEvent) => {
        updateMousePosition(event.clientX, event.clientY);
        window.removeEventListener('mousemove', captureInitialPosition);
      };
      window.addEventListener('mousemove', captureInitialPosition, { once: true });
    }

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [previewState.card, effectivePreviewState.isActive, previewState.mouseX, previewState.mouseY, updateMousePosition]);

  return (
    <CardPreviewContext.Provider
      value={{
        previewState: effectivePreviewState,
        showPreview,
        hidePreview,
        updateMousePosition,
      }}
    >
      {children}
    </CardPreviewContext.Provider>
  );
}
