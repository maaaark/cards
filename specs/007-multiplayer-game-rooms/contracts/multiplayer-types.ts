/**
 * Type Contracts: Multiplayer Game Rooms
 * 
 * Feature: 007-multiplayer-game-rooms
 * Purpose: Define TypeScript interfaces and types for multiplayer functionality
 * 
 * IMPORTANT: These contracts represent the DATA STRUCTURES only.
 * Implementation details (components, hooks, utilities) are not included here.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// DATABASE ENTITIES
// ============================================================================

/**
 * Player entity representing a user in a multiplayer game session.
 * 
 * Privacy: hand_state is private (RLS enforced) - only visible to owning player.
 * Other players can only see: display_name, is_online, joined_at.
 */
export interface Player {
  /** Database primary key (UUID) */
  id: string;
  
  /** Reference to game session (UUID) */
  game_id: string;
  
  /** Client-generated session identifier (stored in sessionStorage, UUID) */
  player_id: string;
  
  /** Optional custom display name (max 50 chars) */
  display_name: string;
  
  /** True if this player created the game room */
  is_creator: boolean;
  
  /** Private array of cards in player's hand (max 20 cards, RLS protected) */
  hand_state: Card[];
  
  /** Real-time presence indicator (updated by Presence API) */
  is_online: boolean;
  
  /** Last activity timestamp (ISO 8601) */
  last_seen: string;
  
  /** When player joined the game (ISO 8601) */
  joined_at: string;
  
  /** Last database update timestamp (ISO 8601) */
  updated_at: string;
}

/**
 * Extended GameSession entity with multiplayer metadata.
 * Extends existing game_sessions table from feature 001-card-sandbox.
 */
export interface GameSession {
  /** Unique game session identifier (UUID, used in URLs) */
  id: string;
  
  /** Array of cards on shared playfield (visible to all players) */
  playfield_state: PlayfieldCard[];
  
  /** Maximum concurrent players allowed (default 4) */
  max_players: number;
  
  /** Flag indicating game is closed by creator (prevents new joins) */
  is_closed: boolean;
  
  /** Reference to player who created the game (UUID, nullable) */
  creator_player_id: string | null;
  
  /** Cached count of active players (updated by triggers) */
  player_count: number;
  
  /** When game was created (ISO 8601) */
  created_at: string;
  
  /** Last database update timestamp (ISO 8601) */
  updated_at: string;
}

/**
 * Card entity on the shared playfield (visible to all players).
 * Extends Card with position and rotation for playfield rendering.
 */
export interface PlayfieldCard {
  /** Unique card identifier */
  id: string;
  
  /** Card name/title */
  name: string;
  
  /** URL to card image asset */
  image_url: string;
  
  /** X-coordinate on playfield (pixels from left) */
  x: number;
  
  /** Y-coordinate on playfield (pixels from top) */
  y: number;
  
  /** Rotation angle in degrees (0-360) */
  rotation: number;
}

/**
 * Base card entity (used in hands and decks).
 * Does not include position/rotation (only relevant on playfield).
 */
export interface Card {
  /** Unique card identifier */
  id: string;
  
  /** Card name/title */
  name: string;
  
  /** URL to card image asset */
  image_url: string;
}

// ============================================================================
// REALTIME TYPES
// ============================================================================

/**
 * Realtime channel wrapper for game room communication.
 * Encapsulates Supabase Realtime channel with game context.
 */
export interface GameRoomChannel {
  /** Supabase Realtime channel instance */
  channel: RealtimeChannel;
  
  /** Game session ID this channel is subscribed to */
  gameId: string;
}

/**
 * Presence state for tracking online players in game room.
 * Broadcasted via Realtime Presence API.
 */
export interface PresenceState {
  /** Player session identifier (matches Player.player_id) */
  player_id: string;
  
  /** Player's display name */
  display_name: string;
  
  /** Timestamp when player came online (ISO 8601) */
  online_at: string;
}

/**
 * Payload structure for playfield state update events.
 * Received via Realtime postgres_changes subscription.
 */
export interface PlayfieldUpdatePayload {
  /** Updated game session data */
  new: GameSession;
  
  /** Previous game session data (before update) */
  old: GameSession;
  
  /** Always 'UPDATE' for playfield changes */
  eventType: 'UPDATE';
  
  /** Timestamp of the database change (ISO 8601) */
  commit_timestamp: string;
}

/**
 * Payload structure for player state update events.
 * Received via Realtime postgres_changes subscription.
 */
export interface PlayerUpdatePayload {
  /** Updated or new player data */
  new: Player;
  
  /** Previous player data (before update, null for INSERT) */
  old: Player | null;
  
  /** Type of database operation */
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  
  /** Timestamp of the database change (ISO 8601) */
  commit_timestamp: string;
}

// ============================================================================
// CLIENT-SIDE STATE TYPES
// ============================================================================

/**
 * Client-side game room state (aggregates database and Realtime data).
 * Used by React components for rendering game UI.
 */
export interface GameRoomState {
  /** Current game session metadata */
  session: GameSession;
  
  /** Current player's data (includes private hand) */
  currentPlayer: Player;
  
  /** Other players in the game (hand_state excluded by RLS) */
  otherPlayers: Player[];
  
  /** Realtime connection status */
  connectionStatus: ConnectionStatus;
  
  /** Error message if any (null if no error) */
  error: string | null;
}

/**
 * Realtime connection status indicator.
 */
export type ConnectionStatus = 
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

/**
 * Player display data for rendering player list (excludes hand_state).
 * This is what other players can see about a player.
 */
export interface PlayerDisplayData {
  /** Player session identifier */
  player_id: string;
  
  /** Display name */
  display_name: string;
  
  /** Online/offline status */
  is_online: boolean;
  
  /** Number of cards in hand (count only, not contents) */
  hand_card_count: number;
  
  /** True if this player created the game */
  is_creator: boolean;
  
  /** When player joined (ISO 8601) */
  joined_at: string;
}

// ============================================================================
// ACTION TYPES (for state management)
// ============================================================================

/**
 * Game room actions for state reducer or event handlers.
 * Defines all possible multiplayer interactions.
 */
export type GameRoomAction =
  | { type: 'CREATE_GAME'; payload: { maxPlayers: number } }
  | { type: 'JOIN_GAME'; payload: { gameId: string; displayName: string } }
  | { type: 'LEAVE_GAME' }
  | { type: 'CLOSE_GAME' }
  | { type: 'UPDATE_PLAYFIELD'; payload: { playfieldState: PlayfieldCard[] } }
  | { type: 'UPDATE_HAND'; payload: { handState: Card[] } }
  | { type: 'MOVE_CARD_TO_PLAYFIELD'; payload: { cardId: string; x: number; y: number } }
  | { type: 'MOVE_PLAYFIELD_CARD'; payload: { cardId: string; x: number; y: number } }
  | { type: 'ROTATE_PLAYFIELD_CARD'; payload: { cardId: string; rotation: number } }
  | { type: 'PLAYER_JOINED'; payload: { player: Player } }
  | { type: 'PLAYER_LEFT'; payload: { playerId: string } }
  | { type: 'PLAYER_PRESENCE_CHANGED'; payload: { playerId: string; isOnline: boolean } }
  | { type: 'CONNECTION_STATUS_CHANGED'; payload: { status: ConnectionStatus } }
  | { type: 'ERROR'; payload: { message: string } };

// ============================================================================
// VALIDATION CONSTRAINTS
// ============================================================================

/**
 * Validation constraints for multiplayer game rooms.
 * Enforced by application logic (not database constraints).
 */
export const MULTIPLAYER_CONSTRAINTS = {
  /** Maximum cards allowed in a player's hand */
  MAX_HAND_SIZE: 20,
  
  /** Maximum concurrent players per game room */
  MAX_PLAYERS_PER_GAME: 4,
  
  /** Maximum length for display names */
  MAX_DISPLAY_NAME_LENGTH: 50,
  
  /** Player session expiration time (milliseconds) */
  PLAYER_SESSION_EXPIRY_MS: 24 * 60 * 60 * 1000, // 24 hours
  
  /** Debounce interval for playfield updates (milliseconds) */
  PLAYFIELD_UPDATE_DEBOUNCE_MS: 100,
  
  /** Presence heartbeat interval (milliseconds) */
  PRESENCE_HEARTBEAT_MS: 30 * 1000, // 30 seconds
  
  /** Reconnection retry intervals (milliseconds, exponential backoff) */
  RECONNECT_RETRY_INTERVALS: [1000, 2000, 5000, 10000, 30000],
} as const;

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Multiplayer-specific error types.
 */
export type MultiplayerError =
  | { type: 'GAME_NOT_FOUND'; gameId: string }
  | { type: 'GAME_FULL'; gameId: string; maxPlayers: number }
  | { type: 'GAME_CLOSED'; gameId: string }
  | { type: 'HAND_LIMIT_EXCEEDED'; currentSize: number; maxSize: number }
  | { type: 'UNAUTHORIZED_ACTION'; action: string; reason: string }
  | { type: 'CONNECTION_FAILED'; reason: string }
  | { type: 'DATABASE_ERROR'; message: string }
  | { type: 'VALIDATION_ERROR'; field: string; message: string };

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Omit hand_state from Player for displaying other players' data.
 * This matches what RLS policies return for other players.
 */
export type PlayerWithoutHand = Omit<Player, 'hand_state'> & {
  /** Card count is computed from hand_state length, exposed to other players */
  hand_card_count: number;
};

/**
 * Partial player update payload (for optimistic UI updates).
 */
export type PlayerUpdate = Partial<Pick<Player, 'display_name' | 'hand_state' | 'is_online'>>;

/**
 * Partial game session update payload (for optimistic UI updates).
 */
export type GameSessionUpdate = Partial<Pick<GameSession, 'playfield_state' | 'is_closed'>>;
