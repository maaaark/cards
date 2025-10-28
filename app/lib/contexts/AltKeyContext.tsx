/**
 * AltKeyContext
 * 
 * Global React Context for tracking ALT key state.
 * Provides centralized ALT key press detection for the entire application.
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
 * Manages global ALT key state using two keyboard event listeners.
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
     * Sets isAltPressed to true when ALT is pressed.
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Alt') {
        setIsAltPressed(true);
      }
    };

    /**
     * Handle keyup event.
     * Sets isAltPressed to false when ALT is released.
     */
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Alt') {
        setIsAltPressed(false);
      }
    };

    /**
     * Handle window blur event.
     * Resets ALT state when window loses focus to prevent stuck ALT key.
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
