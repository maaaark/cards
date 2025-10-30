/**
 * Game Room Utilities
 * 
 * Helper functions for game room operations including CRUD operations,
 * player management, and state synchronization.
 * 
 * @module utils/game-room
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type { 
  MultiplayerGameSession, 
  Player, 
  GameRoomFilter
} from '../types/multiplayer';
import type { Card } from '../types/game';

/**
 * Create a new game room in the database.
 */
export async function createGameRoom(
  supabase: SupabaseClient<Database>,
  params: {
    sessionId: string;
    creatorPlayerId: string;
    displayName: string;
    maxPlayers?: number;
    deckState: { cards: Card[]; originalCount: number; name?: string };
  }
): Promise<string> {
  const { sessionId, creatorPlayerId, displayName, maxPlayers = 4, deckState } = params;
  
  // Create game session
  const { data: gameSession, error: sessionError } = await supabase
    .from('game_sessions')
    .insert({
      session_id: sessionId,
      creator_player_id: creatorPlayerId,
      max_players: maxPlayers,
      is_closed: false,
      player_count: 0,
      deck_state: JSON.parse(JSON.stringify(deckState)),
      hand_state: JSON.parse(JSON.stringify({ cards: [], maxSize: null })),
      playfield_state: JSON.parse(JSON.stringify({
        cards: [],
        positions: {},
        rotations: {},
        nextZIndex: 1,
      })),
    })
    .select('id')
    .single();
  
  if (sessionError || !gameSession) {
    throw new Error(`Failed to create game session: ${sessionError?.message}`);
  }
  
  // Add creator as first player
  const { error: playerError } = await supabase
    .from('players')
    .insert({
      game_id: gameSession.id,
      player_id: creatorPlayerId,
      display_name: displayName,
      is_creator: true,
      hand_state: JSON.parse(JSON.stringify({ cards: [], maxSize: null })),
      is_online: true,
    });
  
  if (playerError) {
    // Rollback game session creation
    await supabase.from('game_sessions').delete().eq('id', gameSession.id);
    throw new Error(`Failed to add creator to game: ${playerError.message}`);
  }
  
  return gameSession.id;
}

/**
 * Join an existing game room.
 */
export async function joinGameRoom(
  supabase: SupabaseClient<Database>,
  params: {
    gameId: string;
    playerId: string;
    displayName: string;
  }
): Promise<void> {
  const { gameId, playerId, displayName } = params;
  
  // Check if game exists and is open
  const { data: gameSession, error: sessionError } = await supabase
    .from('game_sessions')
    .select('is_closed, max_players, player_count')
    .eq('id', gameId)
    .single();
  
  if (sessionError || !gameSession) {
    throw new Error('Game not found');
  }
  
  if (gameSession.is_closed) {
    throw new Error('Game is closed to new players');
  }
  
  if (gameSession.player_count >= gameSession.max_players) {
    throw new Error('Game is full');
  }
  
  // Check if player already in game
  const { data: existingPlayer } = await supabase
    .from('players')
    .select('id')
    .eq('game_id', gameId)
    .eq('player_id', playerId)
    .single();
  
  if (existingPlayer) {
    // Player already in game, just update online status
    await supabase
      .from('players')
      .update({ is_online: true, last_seen: new Date().toISOString() })
      .eq('id', existingPlayer.id);
    return;
  }
  
  // Add player to game
  const { error: playerError } = await supabase
    .from('players')
    .insert({
      game_id: gameId,
      player_id: playerId,
      display_name: displayName,
      is_creator: false,
      hand_state: JSON.parse(JSON.stringify({ cards: [], maxSize: null })),
      is_online: true,
    });
  
  if (playerError) {
    throw new Error(`Failed to join game: ${playerError.message}`);
  }
}

/**
 * Leave a game room.
 */
export async function leaveGameRoom(
  supabase: SupabaseClient<Database>,
  params: {
    gameId: string;
    playerId: string;
  }
): Promise<void> {
  const { gameId, playerId } = params;
  
  // Delete player record (triggers automatic player_count update)
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('game_id', gameId)
    .eq('player_id', playerId);
  
  if (error) {
    throw new Error(`Failed to leave game: ${error.message}`);
  }
}

/**
 * Get game room with all players.
 */
export async function getGameRoom(
  supabase: SupabaseClient<Database>,
  gameId: string
): Promise<MultiplayerGameSession | null> {
  // Get game session
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', gameId)
    .single();
  
  if (sessionError || !session) {
    return null;
  }
  
  // Get all players
  const { data: playersData, error: playersError } = await supabase
    .from('players')
    .select('*')
    .eq('game_id', gameId)
    .order('joined_at', { ascending: true });
  
  if (playersError) {
    throw new Error(`Failed to fetch players: ${playersError.message}`);
  }
  
  const players: Player[] = (playersData || []).map(p => ({
    id: p.id,
    gameId: p.game_id,
    playerId: p.player_id,
    displayName: p.display_name,
    isCreator: p.is_creator,
    handState: p.hand_state as unknown as { cards: Card[]; maxSize?: number },
    isOnline: p.is_online,
    lastSeen: new Date(p.last_seen),
    joinedAt: new Date(p.joined_at),
    updatedAt: new Date(p.updated_at),
  }));
  
  return {
    id: session.id,
    sessionId: session.session_id,
    maxPlayers: session.max_players,
    isClosed: session.is_closed,
    creatorPlayerId: session.creator_player_id,
    playerCount: session.player_count,
    players,
    playfieldState: session.playfield_state as unknown as {
      cards: Card[];
      positions: Record<string, { cardId: string; x: number; y: number; zIndex: number }>;
      rotations: Record<string, number>;
      nextZIndex: number;
    },
    createdAt: new Date(session.created_at),
    updatedAt: new Date(session.updated_at),
  };
}

/**
 * List available game rooms with optional filtering.
 */
export async function listGameRooms(
  supabase: SupabaseClient<Database>,
  filter?: GameRoomFilter
): Promise<MultiplayerGameSession[]> {
  let query = supabase
    .from('game_sessions')
    .select('*')
    .order('created_at', { ascending: false });
  
  // Apply filters
  if (filter?.openOnly) {
    query = query.eq('is_closed', false);
  }
  
  if (filter?.maxPlayers) {
    query = query.lte('max_players', filter.maxPlayers);
  }
  
  if (filter?.createdAfter) {
    query = query.gte('created_at', filter.createdAfter.toISOString());
  }
  
  const { data: sessions, error } = await query;
  
  if (error) {
    throw new Error(`Failed to list game rooms: ${error.message}`);
  }
  
  if (!sessions || sessions.length === 0) {
    return [];
  }
  
  // Filter by available slots if requested
  let filteredSessions = sessions;
  if (filter?.minSlots !== undefined) {
    filteredSessions = sessions.filter(
      s => (s.max_players - s.player_count) >= (filter.minSlots!)
    );
  }
  
  // Fetch players for each game (in parallel)
  const gameRooms = await Promise.all(
    filteredSessions.map(async (session) => {
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', session.id)
        .order('joined_at', { ascending: true });
      
      const players: Player[] = (playersData || []).map(p => ({
        id: p.id,
        gameId: p.game_id,
        playerId: p.player_id,
        displayName: p.display_name,
        isCreator: p.is_creator,
        handState: p.hand_state as unknown as { cards: Card[]; maxSize?: number },
        isOnline: p.is_online,
        lastSeen: new Date(p.last_seen),
        joinedAt: new Date(p.joined_at),
        updatedAt: new Date(p.updated_at),
      }));
      
      return {
        id: session.id,
        sessionId: session.session_id,
        maxPlayers: session.max_players,
        isClosed: session.is_closed,
        creatorPlayerId: session.creator_player_id,
        playerCount: session.player_count,
        players,
        playfieldState: session.playfield_state as unknown as {
          cards: Card[];
          positions: Record<string, { cardId: string; x: number; y: number; zIndex: number }>;
          rotations: Record<string, number>;
          nextZIndex: number;
        },
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
      };
    })
  );
  
  return gameRooms;
}

/**
 * Close game room to new players (creator only).
 */
export async function closeGameRoom(
  supabase: SupabaseClient<Database>,
  params: {
    gameId: string;
    creatorPlayerId: string;
  }
): Promise<void> {
  const { gameId, creatorPlayerId } = params;
  
  const { error } = await supabase
    .from('game_sessions')
    .update({ is_closed: true })
    .eq('id', gameId)
    .eq('creator_player_id', creatorPlayerId);
  
  if (error) {
    throw new Error(`Failed to close game room: ${error.message}`);
  }
}

/**
 * Update player's online status and last seen timestamp.
 */
export async function updatePlayerPresence(
  supabase: SupabaseClient<Database>,
  params: {
    gameId: string;
    playerId: string;
    isOnline: boolean;
  }
): Promise<void> {
  const { gameId, playerId, isOnline } = params;
  
  const { error } = await supabase
    .from('players')
    .update({
      is_online: isOnline,
      last_seen: new Date().toISOString(),
    })
    .eq('game_id', gameId)
    .eq('player_id', playerId);
  
  if (error) {
    throw new Error(`Failed to update player presence: ${error.message}`);
  }
}

/**
 * Update player's display name.
 */
export async function updatePlayerDisplayName(
  supabase: SupabaseClient<Database>,
  params: {
    gameId: string;
    playerId: string;
    displayName: string;
  }
): Promise<void> {
  const { gameId, playerId, displayName } = params;
  
  const { error } = await supabase
    .from('players')
    .update({ display_name: displayName })
    .eq('game_id', gameId)
    .eq('player_id', playerId);
  
  if (error) {
    throw new Error(`Failed to update display name: ${error.message}`);
  }
}

/**
 * Update shared playfield state.
 */
export async function updatePlayfieldState(
  supabase: SupabaseClient<Database>,
  params: {
    gameId: string;
    playfieldState: {
      cards: Card[];
      positions: Record<string, { cardId: string; x: number; y: number; zIndex: number }>;
      rotations: Record<string, number>;
      nextZIndex: number;
    };
  }
): Promise<void> {
  const { gameId, playfieldState } = params;
  
  const { error } = await supabase
    .from('game_sessions')
    .update({ playfield_state: JSON.parse(JSON.stringify(playfieldState)) })
    .eq('id', gameId);
  
  if (error) {
    throw new Error(`Failed to update playfield state: ${error.message}`);
  }
}

/**
 * Update player's hand state (private).
 */
export async function updatePlayerHandState(
  supabase: SupabaseClient<Database>,
  params: {
    gameId: string;
    playerId: string;
    handState: { cards: Card[]; maxSize?: number };
  }
): Promise<void> {
  const { gameId, playerId, handState } = params;
  
  const { error } = await supabase
    .from('players')
    .update({ hand_state: JSON.parse(JSON.stringify(handState)) })
    .eq('game_id', gameId)
    .eq('player_id', playerId);
  
  if (error) {
    throw new Error(`Failed to update hand state: ${error.message}`);
  }
}
