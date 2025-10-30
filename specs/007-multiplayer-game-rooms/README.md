# Multiplayer Game Rooms - Feature 007

## Overview

Multiplayer game rooms enable real-time collaborative card gaming with up to 8 players. Players can create or join game rooms, share a common playfield, and maintain private hand states synchronized via Supabase Realtime.

## Features Implemented

### ✅ Phase 1: Database Setup
- **Migration 002**: Complete multiplayer schema
  - `players` table with hand state (JSONB)
  - Extended `game_sessions` with max_players, is_closed, creator_player_id, player_count
  - RLS policies for private hand access
  - Automatic player count triggers

### ✅ Phase 2: Core Utilities
- **player-session.ts**: Anonymous player session management (24h expiry)
- **game-room.ts**: CRUD operations for game rooms
  - Create, join, leave game rooms
  - Update playfield and hand states
  - List available rooms with filters

### ✅ Phase 3: React Hooks & UI Components
- **usePlayerSession**: Player identity and display name
- **useGameRoom**: Game room operations
- **useRealtimeGameRoom**: WebSocket subscriptions (Presence, Broadcast, Postgres Changes)
- **GameRoomLobby**: Browse and create game rooms
- **PlayerList**: Display players with online status
- **ConnectionStatus**: Real-time connection state indicator
- **Multiplayer Game Page**: Full game room with playfield and hand integration

## Architecture

### Database-First Sync
- **Latency**: 200ms for state propagation
- **Conflict Resolution**: Last-Write-Wins via PostgreSQL timestamps
- **Playfield State**: Shared JSONB in game_sessions.playfield_state
- **Hand State**: Private JSONB per player in players.hand_state

### Realtime Channels
1. **Postgres Changes**: Subscribe to game_sessions and players table updates
2. **Presence**: Track online/offline status of players
3. **Broadcast**: Send game actions (card_moved, card_rotated) to all players

### Free Tier Budget
- **Message Limit**: 200k/month
- **Concurrent Connections**: 200
- **Estimated Capacity**: ~416 game sessions/month (4 players, 30 min each, 100ms debounce)

## Usage

### 1. Start the Application
```powershell
npm run dev
```

### 2. Navigate to Lobby
Open http://localhost:3000/lobby in your browser

### 3. Create a Game Room
- Enter your display name
- Select max players (2-8)
- Click "Create Room"

### 4. Join from Another Browser/Tab
- Open lobby in another browser/incognito tab
- Click "Join Room" on the available game
- Enter your display name

### 5. Play Collaboratively
- **Shared Playfield**: All players see the same cards and positions
- **Private Hand**: Each player's hand is visible only to them
- **Real-time Sync**: Card movements update instantly for all players
- **Online Status**: See who's connected with green indicators

## File Structure

```
app/
├── components/game/
│   ├── GameRoomLobby.tsx      # Browse/create game rooms
│   ├── PlayerList.tsx          # Display players with status
│   ├── ConnectionStatus.tsx    # Realtime connection indicator
│   ├── Playfield.tsx           # Shared playfield (updated for multiplayer)
│   └── Hand.tsx                # Private hand (updated for multiplayer)
├── game/[id]/
│   └── page.tsx                # Multiplayer game room page
├── lobby/
│   └── page.tsx                # Lobby page
└── lib/
    ├── hooks/
    │   ├── usePlayerSession.ts      # Player session management
    │   ├── useGameRoom.ts           # Game room operations
    │   └── useRealtimeGameRoom.ts   # Realtime subscriptions
    ├── utils/
    │   ├── player-session.ts        # Session storage utilities
    │   └── game-room.ts             # Database operations
    └── types/
        └── multiplayer.ts           # TypeScript interfaces

supabase/migrations/
└── 002_create_multiplayer_tables.sql  # Database schema
```

## Technical Details

### Session Management
- **Storage**: Browser sessionStorage (24-hour expiry)
- **Player ID**: Auto-generated UUID
- **Display Name**: User-provided, editable
- **Game Tracking**: Current game ID stored in session

### State Synchronization
- **Playfield Updates**: Debounced 100ms to reduce message count
- **Hand Updates**: Immediate on card draw/play
- **Presence Updates**: 30s interval heartbeat
- **Offline Detection**: 60s threshold

### Connection Management
- **Auto-reconnection**: Max 5 attempts, 2000ms delay
- **Connection States**: disconnected, connecting, connected, reconnecting, error
- **Manual Reconnect**: Available via UI button

### Security
- **RLS Policies**: Enforce private hand state access
- **Anonymous Auth**: No authentication required (session-based)
- **Creator Permissions**: Only room creator can close rooms

## Testing

### Manual Testing Checklist
1. ✅ Create game room with valid display name
2. ✅ Join game room from second browser/tab
3. ✅ Verify player list shows both players
4. ✅ Verify online status indicators (green dots)
5. ✅ Draw cards and verify hand updates
6. ✅ Drag card to playfield and verify sync to other player
7. ✅ Move card on playfield and verify position sync
8. ✅ Close game room and verify new players blocked
9. ✅ Leave game room and verify player count updates
10. ✅ Disconnect/reconnect and verify presence updates

### Browser Testing
- ✅ Chrome/Edge (primary)
- ✅ Firefox
- ✅ Safari (if available)
- ✅ Mobile browsers (responsive design)

## Known Limitations

1. **Anonymous Sessions**: No persistent user accounts (sessions expire in 24h)
2. **No Game History**: Games are not persisted after all players leave
3. **No Spectator Mode**: Must join as a player to view game
4. **Fixed Playfield Size**: 1200x500px (not resizable)
5. **No Voice/Video**: Text-based interactions only

## Future Enhancements

### Phase 4: User Stories (Not Yet Implemented)
- **US4**: Turn-based gameplay with turn indicators
- **US5**: Chat system for player communication
- **US6**: Game invitations via shareable links
- **US7**: Persistent game rooms that survive player disconnects
- **US8**: Spectator mode for non-playing observers

### Phase 5: Polish (Not Yet Implemented)
- Improved error handling and user feedback
- Performance monitoring and optimization
- Mobile-first responsive improvements
- Accessibility (ARIA labels, keyboard navigation)
- Dark mode consistency

## Troubleshooting

### Connection Issues
- Check Supabase credentials in `.env.local`
- Verify Realtime is enabled in Supabase dashboard
- Check browser console for WebSocket errors

### State Sync Issues
- Verify RLS policies are enabled
- Check that migrations were applied successfully
- Ensure player_id matches in session and database

### Performance Issues
- Reduce update frequency in `MULTIPLAYER_CONFIG`
- Normalize z-indexes if > 10,000 cards placed
- Clear old game sessions from database

## Support

For issues or questions:
1. Check browser console for error messages
2. Review Supabase logs in dashboard
3. Verify migration status: `npm run migrate:status`
4. Test with single player first before multiplayer

## License

This feature is part of the cards project. See main README for license information.
