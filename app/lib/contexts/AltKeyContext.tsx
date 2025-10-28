/**
 * AltKeyContext
 * 
 * Global React Context for tracking CTRL key state.
 * Provides centralized CTRL key press detection for the entire application.
 * 
 * @module contexts/AltKeyContext
 */

'use client';

import { createContext, useState, useEffect, type ReactNode } from 'react';

/**
 * Context value interface
 */
interface AltKeyContextValue {
  isAltPressed: boolean;
}

/**
 * Context for ALT key state
 */
export const AltKeyContext = createContext<AltKeyContextValue | undefined>(undefined);

/**
 * Provider Props
 */
interface AltKeyProviderProps {
  children: ReactNode;
}

/**
 * AltKeyProvider Component
 * 
 * Manages global CTRL key state using two keyboard event listeners.
 * Attaches listeners on mount, detaches on unmount.
 * 
 * Performance: Uses exactly 2 event listeners (keydown, keyup).
 * 
 * @example
 * ```tsx
 * <AltKeyProvider>
 *   <YourApp />
 * </AltKeyProvider>
 * ```
 */
export function AltKeyProvider({ children }: AltKeyProviderProps) {
  const [isAltPressed, setIsAltPressed] = useState<boolean>(false);

  useEffect(() => {
    /**
     * Handle keydown event.
     * Sets isAltPressed to true when CTRL is pressed.
     * Prevents default browser menu behavior.
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Control') {
        event.preventDefault();
        setIsAltPressed(true);
      }
    };

    /**
     * Handle keyup event.
     * Sets isAltPressed to false when CTRL is released.
     * Prevents default browser menu behavior.
     */
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Control') {
        event.preventDefault();
        setIsAltPressed(false);
      }
    };

    /**
     * Handle window blur event.
     * Resets CTRL state when window loses focus to prevent stuck CTRL key.
     */
    const handleBlur = () => {
      setIsAltPressed(false);
    };

    // Attach event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <AltKeyContext.Provider value={{ isAltPressed }}>
      {children}
    </AltKeyContext.Provider>
  );
}
