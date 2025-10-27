/**
 * Session Management Utilities
 * 
 * Functions for managing game session IDs in localStorage.
 * Session IDs persist across browser refreshes but not across devices.
 * 
 * @module utils/session
 */

import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS } from '../types/game';

/**
 * Retrieves the current session ID from localStorage.
 * If no session exists, creates a new one.
 * 
 * @returns Current session ID
 * 
 * @example
 * const sessionId = getSessionId();
 * console.log('Current session:', sessionId);
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering - return temporary ID
    return 'ssr-temp-session';
  }
  
  try {
    const existingId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    
    if (existingId) {
      return existingId;
    }
    
    // Create new session ID
    const newId = uuidv4();
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, newId);
    return newId;
  } catch (error) {
    console.error('Failed to access localStorage:', error);
    // Fallback to temporary session ID
    return `temp-${uuidv4()}`;
  }
}

/**
 * Creates a new session ID, replacing any existing session.
 * Useful for starting a fresh game.
 * 
 * @returns New session ID
 * 
 * @example
 * const newSessionId = createNewSession();
 * console.log('Started new session:', newSessionId);
 */
export function createNewSession(): string {
  if (typeof window === 'undefined') {
    return 'ssr-temp-session';
  }
  
  try {
    const newId = uuidv4();
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, newId);
    return newId;
  } catch (error) {
    console.error('Failed to create new session:', error);
    return `temp-${uuidv4()}`;
  }
}

/**
 * Clears the current session ID from localStorage.
 * This will cause a new session to be created on next access.
 * 
 * @example
 * clearSession();
 * console.log('Session cleared');
 */
export function clearSession(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

/**
 * Checks if localStorage is available and working.
 * 
 * @returns True if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
