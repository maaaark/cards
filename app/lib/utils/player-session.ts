/**
 * Player Session Management
 * 
 * Utilities for managing anonymous player sessions in sessionStorage.
 * Players are identified by a persistent session ID that survives browser refresh
 * but expires after 24 hours or when browser is closed.
 * 
 * @module utils/player-session
 */

import { MULTIPLAYER_STORAGE_KEYS } from '../types/multiplayer';

/**
 * Player session data stored in sessionStorage.
 */
interface PlayerSessionData {
  /** Unique player ID (UUID format) */
  playerId: string;
  
  /** Display name */
  displayName: string;
  
  /** When session was created */
  createdAt: string;
  
  /** When session expires (24 hours from creation) */
  expiresAt: string;
}

/**
 * Session expiration time (24 hours in milliseconds).
 */
const SESSION_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Generate a unique player ID.
 */
function generatePlayerId(): string {
  return crypto.randomUUID();
}

/**
 * Get current timestamp as ISO string.
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Calculate expiration timestamp (24 hours from now).
 */
function getExpirationTimestamp(): string {
  return new Date(Date.now() + SESSION_EXPIRATION_MS).toISOString();
}

/**
 * Check if session has expired.
 */
function isSessionExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Get player session from sessionStorage.
 * Returns null if session doesn't exist or has expired.
 */
export function getPlayerSession(): PlayerSessionData | null {
  try {
    const sessionJson = sessionStorage.getItem(MULTIPLAYER_STORAGE_KEYS.PLAYER_ID);
    if (!sessionJson) {
      return null;
    }
    
    const session = JSON.parse(sessionJson) as PlayerSessionData;
    
    // Check expiration
    if (isSessionExpired(session.expiresAt)) {
      clearPlayerSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Failed to get player session:', error);
    return null;
  }
}

/**
 * Create a new player session.
 */
export function createPlayerSession(displayName: string): PlayerSessionData {
  const session: PlayerSessionData = {
    playerId: generatePlayerId(),
    displayName,
    createdAt: getCurrentTimestamp(),
    expiresAt: getExpirationTimestamp(),
  };
  
  try {
    sessionStorage.setItem(
      MULTIPLAYER_STORAGE_KEYS.PLAYER_ID,
      JSON.stringify(session)
    );
  } catch (error) {
    console.error('Failed to save player session:', error);
  }
  
  return session;
}

/**
 * Update player display name in session.
 */
export function updatePlayerDisplayName(displayName: string): void {
  const session = getPlayerSession();
  if (!session) {
    throw new Error('No active player session');
  }
  
  const updatedSession: PlayerSessionData = {
    ...session,
    displayName,
  };
  
  try {
    sessionStorage.setItem(
      MULTIPLAYER_STORAGE_KEYS.PLAYER_ID,
      JSON.stringify(updatedSession)
    );
  } catch (error) {
    console.error('Failed to update display name:', error);
    throw error;
  }
}

/**
 * Clear player session from sessionStorage.
 */
export function clearPlayerSession(): void {
  try {
    sessionStorage.removeItem(MULTIPLAYER_STORAGE_KEYS.PLAYER_ID);
    sessionStorage.removeItem(MULTIPLAYER_STORAGE_KEYS.DISPLAY_NAME);
    sessionStorage.removeItem(MULTIPLAYER_STORAGE_KEYS.CURRENT_GAME_ID);
  } catch (error) {
    console.error('Failed to clear player session:', error);
  }
}

/**
 * Get or create player session.
 * Returns existing session if valid, otherwise creates new one.
 */
export function getOrCreatePlayerSession(displayName: string): PlayerSessionData {
  const existingSession = getPlayerSession();
  if (existingSession) {
    return existingSession;
  }
  
  return createPlayerSession(displayName);
}

/**
 * Get current player ID.
 * Returns null if no active session.
 */
export function getCurrentPlayerId(): string | null {
  const session = getPlayerSession();
  return session?.playerId ?? null;
}

/**
 * Get current display name.
 * Returns null if no active session.
 */
export function getCurrentDisplayName(): string | null {
  const session = getPlayerSession();
  return session?.displayName ?? null;
}

/**
 * Check if player has an active session.
 */
export function hasActiveSession(): boolean {
  return getPlayerSession() !== null;
}

/**
 * Set current game ID in sessionStorage.
 */
export function setCurrentGameId(gameId: string): void {
  try {
    sessionStorage.setItem(MULTIPLAYER_STORAGE_KEYS.CURRENT_GAME_ID, gameId);
  } catch (error) {
    console.error('Failed to set current game ID:', error);
  }
}

/**
 * Get current game ID from sessionStorage.
 */
export function getCurrentGameId(): string | null {
  try {
    return sessionStorage.getItem(MULTIPLAYER_STORAGE_KEYS.CURRENT_GAME_ID);
  } catch (error) {
    console.error('Failed to get current game ID:', error);
    return null;
  }
}

/**
 * Clear current game ID from sessionStorage.
 */
export function clearCurrentGameId(): void {
  try {
    sessionStorage.removeItem(MULTIPLAYER_STORAGE_KEYS.CURRENT_GAME_ID);
  } catch (error) {
    console.error('Failed to clear current game ID:', error);
  }
}
