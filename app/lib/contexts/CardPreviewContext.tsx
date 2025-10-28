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
   * Only activates if ALT key is pressed.
   */
  const showPreview = useCallback((card: Card) => {
    if (!isAltPressed) return;

    setPreviewState(prev => ({
      ...prev,
      isActive: true,
      card,
      hoveredCardId: card.id,
    }));
  }, [isAltPressed]);

  /**
   * Hide preview.
   * Only hides if the cardId matches currently hovered card.
   */
  const hidePreview = useCallback((cardId: string) => {
    setPreviewState(prev => {
      if (prev.hoveredCardId !== cardId) return prev;
      
      return {
        ...prev,
        isActive: false,
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
   * Derived state: preview is only active if both ALT is pressed AND preview was activated.
   * This automatically hides the preview when ALT is released.
   */
  const effectivePreviewState: PreviewState = {
    ...previewState,
    isActive: previewState.isActive && isAltPressed,
  };

  /**
   * Attach mousemove listener when preview is active.
   * Detach when preview is inactive for performance.
   */
  useEffect(() => {
    if (!effectivePreviewState.isActive) return;

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

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [effectivePreviewState.isActive, previewState.mouseX, previewState.mouseY, updateMousePosition]);

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
