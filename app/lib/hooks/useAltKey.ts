/**
 * useAltKey Hook
 * 
 * Custom hook that provides access to global ALT key state.
 * Must be used within an AltKeyProvider.
 * 
 * @module hooks/useAltKey
 */

'use client';

import { useContext } from 'react';
import { AltKeyContext } from '../contexts/AltKeyContext';
import type { UseAltKeyReturn } from '../types/card-preview';

/**
 * Hook to access ALT key state.
 * 
 * @returns Object containing ALT key state
 * @throws Error if used outside AltKeyProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAltPressed } = useAltKey();
 *   
 *   return (
 *     <div>
 *       {isAltPressed ? 'ALT is pressed' : 'ALT is not pressed'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAltKey(): UseAltKeyReturn {
  const context = useContext(AltKeyContext);

  if (context === undefined) {
    throw new Error('useAltKey must be used within an AltKeyProvider');
  }

  return {
    isAltPressed: context.isAltPressed,
  };
}
