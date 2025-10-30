/**
 * Type Contracts: Multiplayer Game Rooms
 * 
 * This file defines all TypeScript interfaces and types for multiplayer functionality.
 * These contracts ensure type safety for game room management, real-time synchronization,
 * and player presence tracking.
 * 
 * @module multiplayer
 */

import type { Card, Hand } from './game';

// ============================================================================
// Core Multiplayer Types
// ============================================================================

/**
 * Represents a player in a multiplayer game session.
 */
export interface Player {
  /** Unique player record ID (from database) */
  id: string;
  
  /** Game session ID this player belongs to */
  gameId: string;
  
  /** Anonymous session ID from sessionStorage */
  playerId: string;
  
  /** Display name shown to other players */
  displayName: string;
  
  /** Whether this player created the game room */
  isCreator: boolean;
  
  /** Player's private hand state (only visible to them) */
  handState: Hand;
  
  /** Whether player is currently online */
  isOnline: boolean;
  
  /** Last activity timestamp */
  lastSeen: Date;
  
  /** When player joined the game */
  joinedAt: Date;
  
  /** Last state update timestamp */
  updatedAt: Date;
}

/**
 * Extended game session with multiplayer fields.
 */
export interface MultiplayerGameSession {
  /** Session ID */
  id: string;
  
  /** Session identifier (legacy field) */
  sessionId: string;
  
  /** Maximum players allowed */
  maxPlayers: number;
  
  /** Whether game is closed to new players */
  isClosed: boolean;
  
  /** Player ID of game creator */
  creatorPlayerId: string | null;
  
  /** Current number of players */
  playerCount: number;
  
  /** All players in this game */
  players: Player[];
  
  /** Shared playfield state */
  playfieldState: {
    cards: Card[];
    positions: Record<string, { cardId: string; x: number; y: number; zIndex: number }>;
    rotations: Record<string, number>;
    nextZIndex: number;
  };
  
  /** When session was created */
  createdAt: Date;
  
  /** Last state update timestamp */
  updatedAt: Date;
}

// ============================================================================
// Realtime Presence Types
// ============================================================================

/**
 * Presence state for a player tracked via Supabase Realtime.
 */
export interface PresenceState {
  /** Player ID */
  playerId: string;
  
  /** Display name */
  displayName: string;
  
  /** Whether player is creator */
  isCreator: boolean;
  
  /** Last activity timestamp */
  lastSeen: number; // Unix timestamp
  
  /** Optional cursor position for future features */
  cursorPosition?: { x: number; y: number };
}

/**
 * Presence payload structure for Supabase Realtime.
 */
export interface PresencePayload {
  [key: string]: PresenceState[];
}

// ============================================================================
// Connection Status Types
// ============================================================================

/**
 * Connection status for Realtime subscriptions.
 */
export type ConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'error';

/**
 * Connection state with error information.
 */
export interface ConnectionState {
  /** Current connection status */
  status: ConnectionStatus;
  
  /** Error message if status is 'error' */
  error?: string;
  
  /** Number of reconnection attempts */
  reconnectAttempts: number;
  
  /** Last successful connection timestamp */
  lastConnectedAt?: Date;
}

// ============================================================================
// Game Room State Types
// ============================================================================

/**
 * Complete game room state combining session, players, and connection.
 */
export interface GameRoomState {
  /** Current game session */
  session: MultiplayerGameSession | null;
  
  /** Current player's data */
  currentPlayer: Player | null;
  
  /** Connection state */
  connectionState: ConnectionState;
  
  /** Whether room data is loading */
  isLoading: boolean;
  
  /** Error message if any */
  error?: string;
}

// ============================================================================
// Realtime Event Types
// ============================================================================

/**
 * Postgres change event from Supabase Realtime.
 */
export interface RealtimePostgresChange<T = unknown> {
  /** Event type */
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  
  /** Table schema */
  schema: string;
  
  /** Table name */
  table: string;
  
  /** New row data (for INSERT/UPDATE) */
  new: T;
  
  /** Old row data (for UPDATE/DELETE) */
  old: Partial<T>;
  
  /** Event timestamp */
  commit_timestamp: string;
}

/**
 * Broadcast message payload structure.
 */
export interface BroadcastMessage {
  /** Message type */
  type: 'card_moved' | 'card_rotated' | 'player_action' | 'cursor_update';
  
  /** Message payload */
  payload: unknown;
  
  /** Sender player ID */
  senderId: string;
  
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useGameRoom hook.
 */
export interface UseGameRoomReturn {
  /** Current game room state */
  gameRoom: GameRoomState;
  
  /** Create a new game room */
  createGameRoom: (displayName: string, maxPlayers?: number) => Promise<string>;
  
  /** Join an existing game room */
  joinGameRoom: (gameId: string, displayName: string) => Promise<void>;
  
  /** Leave current game room */
  leaveGameRoom: () => Promise<void>;
  
  /** Load an existing game room (for direct navigation) */
  loadGameRoom: (gameId: string) => Promise<void>;
  
  /** Update current player's display name */
  updateDisplayName: (newName: string) => Promise<void>;
  
  /** Close game room to new players (creator only) */
  closeGameRoom: () => Promise<void>;
  
  /** Update shared playfield state */
  updatePlayfieldState: (state: MultiplayerGameSession['playfieldState']) => Promise<void>;
  
  /** Send broadcast message to all players */
  broadcastMessage: (message: Omit<BroadcastMessage, 'senderId' | 'timestamp'>) => void;
}

/**
 * Return type for usePlayerSession hook.
 */
export interface UsePlayerSessionReturn {
  /** Current player ID (from sessionStorage) */
  playerId: string;
  
  /** Display name */
  displayName: string;
  
  /** Update display name */
  setDisplayName: (name: string) => void;
  
  /** Clear player session */
  clearSession: () => void;
}

/**
 * Return type for usePresence hook.
 */
export interface UsePresenceReturn {
  /** All present players */
  presenceState: PresencePayload;
  
  /** Track presence for current player */
  trackPresence: (state: PresenceState) => void;
  
  /** Stop tracking presence */
  untrackPresence: () => void;
}

/**
 * Return type for useRealtimeGameRoom hook.
 */
export interface UseRealtimeGameRoomReturn {
  /** Connection state */
  connectionState: ConnectionState;
  
  /** Subscribe to game room updates */
  subscribe: (gameId: string, callbacks: RealtimeCallbacks) => Promise<void>;
  
  /** Unsubscribe from current game room */
  unsubscribe: () => void;
  
  /** Send broadcast message */
  broadcast: (message: Omit<BroadcastMessage, 'senderId' | 'timestamp'>) => void;
}

/**
 * Callbacks for Realtime subscription events.
 */
export interface RealtimeCallbacks {
  /** Called when game session is updated */
  onGameSessionUpdate?: (session: MultiplayerGameSession) => void;
  
  /** Called when a player joins/leaves/updates */
  onPlayerUpdate?: (player: Player) => void;
  
  /** Called when presence state changes */
  onPresenceChange?: (state: PresencePayload) => void;
  
  /** Called when broadcast message is received */
  onBroadcast?: (message: BroadcastMessage) => void;
  
  /** Called on connection error */
  onError?: (error: string) => void;
}

// ============================================================================
// Component Prop Types
// ============================================================================

/**
 * Props for GameRoomLobby component.
 */
export interface GameRoomLobbyProps {
  /** Handler when user creates a game */
  onCreateGame: (displayName: string, maxPlayers: number) => void;
  
  /** Handler when user joins a game */
  onJoinGame: (gameId: string, displayName: string) => void;
  
  /** Available game rooms */
  gameRooms: MultiplayerGameSession[];
  
  /** Whether data is loading */
  isLoading: boolean;
  
  /** Error message if any */
  error?: string;
}

/**
 * Props for PlayerList component.
 */
export interface PlayerListProps {
  /** Players in current game */
  players: Player[];
  
  /** Current player ID */
  currentPlayerId: string;
  
  /** Show online status indicators */
  showOnlineStatus?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for ConnectionStatus component.
 */
export interface ConnectionStatusProps {
  /** Current connection state */
  connectionState: ConnectionState;
  
  /** Handler for manual reconnection */
  onReconnect?: () => void;
  
  /** Show detailed error messages */
  showDetails?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Game room filter criteria.
 */
export interface GameRoomFilter {
  /** Only show open games */
  openOnly?: boolean;
  
  /** Minimum available slots */
  minSlots?: number;
  
  /** Maximum players */
  maxPlayers?: number;
  
  /** Created after timestamp */
  createdAfter?: Date;
}

/**
 * Player action types for optimistic updates.
 */
export type PlayerAction =
  | { type: 'JOIN'; payload: { playerId: string; displayName: string } }
  | { type: 'LEAVE'; payload: { playerId: string } }
  | { type: 'UPDATE_NAME'; payload: { playerId: string; displayName: string } }
  | { type: 'UPDATE_ONLINE'; payload: { playerId: string; isOnline: boolean } }
  | { type: 'UPDATE_HAND'; payload: { playerId: string; handState: Hand } };

// ============================================================================
// Constants
// ============================================================================

/**
 * Multiplayer configuration constants.
 */
export const MULTIPLAYER_CONFIG = {
  /** Default maximum players per game */
  DEFAULT_MAX_PLAYERS: 4,
  
  /** Maximum players allowed */
  MAX_PLAYERS_LIMIT: 8,
  
  /** Presence heartbeat interval (ms) */
  PRESENCE_INTERVAL: 30000,
  
  /** Player considered offline after (ms) */
  OFFLINE_THRESHOLD: 60000,
  
  /** Debounce delay for playfield updates (ms) */
  PLAYFIELD_UPDATE_DEBOUNCE: 100,
  
  /** Maximum reconnection attempts */
  MAX_RECONNECT_ATTEMPTS: 5,
  
  /** Reconnection delay (ms) */
  RECONNECT_DELAY: 2000,
} as const;

/**
 * Session storage keys for multiplayer.
 */
export const MULTIPLAYER_STORAGE_KEYS = {
  PLAYER_ID: 'playerSessionId',
  DISPLAY_NAME: 'playerDisplayName',
  CURRENT_GAME_ID: 'currentGameId',
} as const;

/**
 * Realtime channel names.
 */
export const REALTIME_CHANNELS = {
  GAME_ROOM: (gameId: string) => `game-room:${gameId}`,
  PRESENCE: (gameId: string) => `presence:${gameId}`,
  BROADCAST: (gameId: string) => `broadcast:${gameId}`,
} as const;
