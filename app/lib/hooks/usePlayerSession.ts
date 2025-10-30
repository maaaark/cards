/**
 * usePlayerSession Hook
 * 
 * React hook for managing player session state with sessionStorage persistence.
 * Provides player ID and display name management for anonymous multiplayer sessions.
 * 
 * @module hooks/usePlayerSession
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getPlayerSession,
  createPlayerSession,
  updatePlayerDisplayName as updateDisplayNameInStorage,
  clearPlayerSession,
  getCurrentPlayerId,
} from '../utils/player-session';
import type { UsePlayerSessionReturn } from '../types/multiplayer';

/**
 * Hook for managing player session state.
 * 
 * Automatically loads existing session from sessionStorage on mount.
 * Provides functions to create, update, and clear player sessions.
 * 
 * @returns Player session state and management functions
 * 
 * @example
 * const { playerId, displayName, setDisplayName, clearSession } = usePlayerSession();
 * 
 * // Create new session
 * setDisplayName('Player 1');
 * 
 * // Clear session
 * clearSession();
 */
export function usePlayerSession(): UsePlayerSessionReturn {
  const [playerId, setPlayerId] = useState<string>('');
  const [displayName, setDisplayNameState] = useState<string>('');

  // Load existing session on mount
  useEffect(() => {
    const loadSession = () => {
      const session = getPlayerSession();
      if (session) {
        setPlayerId(session.playerId);
        setDisplayNameState(session.displayName);
      }
    };
    loadSession();
  }, []);

  /**
   * Update player display name.
   * Creates new session if none exists.
   */
  const setDisplayName = useCallback((newName: string) => {
    if (!newName.trim()) {
      console.warn('Display name cannot be empty');
      return;
    }

    // If session exists, update it
    const existingId = getCurrentPlayerId();
    if (existingId) {
      try {
        updateDisplayNameInStorage(newName);
        setDisplayNameState(newName);
      } catch (error) {
        console.error('Failed to update display name:', error);
      }
    } else {
      // Create new session
      const session = createPlayerSession(newName);
      setPlayerId(session.playerId);
      setDisplayNameState(session.displayName);
    }
  }, []);

  /**
   * Clear player session.
   * Removes all session data from storage.
   */
  const clearSession = useCallback(() => {
    clearPlayerSession();
    setPlayerId('');
    setDisplayNameState('');
  }, []);

  return {
    playerId,
    displayName,
    setDisplayName,
    clearSession,
  };
}
