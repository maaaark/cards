/**
 * Database Type Definitions
 * 
 * TypeScript types for Supabase database schema.
 * This file is typically auto-generated but we define it manually for now.
 * 
 * @module types/database
 */

import type { Card } from './game';

/**
 * Database schema type.
 */
export type Database = {
  public: {
    Tables: {
      game_sessions: {
        Row: GameSessionRow;
        Insert: GameSessionInsert;
        Update: GameSessionUpdate;
      };
    };
  };
};

/**
 * Game session row from database.
 */
export interface GameSessionRow {
  id: string;
  session_id: string;
  deck_state: {
    cards: Card[];
    originalCount: number;
    name?: string;
  };
  hand_state: {
    cards: Card[];
    maxSize?: number;
  };
  playfield_state: {
    cards: Card[];
    positions?: Record<string, { cardId: string; x: number; y: number; zIndex: number }>;
    nextZIndex?: number;
  };
  deck_metadata?: {
    name: string;
    originalCardCount: number;
    importedAt: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Insert type for game_sessions table.
 */
export interface GameSessionInsert {
  session_id: string;
  deck_state: GameSessionRow['deck_state'];
  hand_state: GameSessionRow['hand_state'];
  playfield_state: GameSessionRow['playfield_state'];
  deck_metadata?: GameSessionRow['deck_metadata'];
}

/**
 * Update type for game_sessions table.
 */
export interface GameSessionUpdate {
  deck_state?: GameSessionRow['deck_state'];
  hand_state?: GameSessionRow['hand_state'];
  playfield_state?: GameSessionRow['playfield_state'];
  deck_metadata?: GameSessionRow['deck_metadata'];
}
