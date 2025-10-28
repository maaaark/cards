# Quickstart: Card Drag and Drop

## Feature Overview

The Card Drag and Drop feature enables intuitive card manipulation in the game sandbox. Players can:
- **Drag cards from hand to playfield** - Place cards anywhere with pixel-perfect positioning
- **Reposition playfield cards** - Organize and rearrange cards freely
- **Return cards to hand** - Drag playfield cards back to hand
- **Discard cards** - Drag cards off playfield to remove them
- **Z-index stacking** - Most recently moved card appears on top

## Quick Demo

### Basic Usage
1. **Draw cards** - Click deck to draw cards to your hand
2. **Drag to playfield** - Click and hold a hand card, drag onto green playfield, release to place
3. **Reposition** - Click and hold any playfield card, drag to new position, release
4. **Return to hand** - Drag playfield card down to hand area, release to add back to hand
5. **Discard** - Drag playfield card outside playfield/hand areas, release to remove permanently

### Keyboard Shortcuts
- **ESC** - Cancel current drag operation (returns card to original position)

## User Stories

### Story 1: Playing Cards from Hand
> *"As a player, I want to drag cards from my hand onto the playfield so I can position them exactly where I want."*

**Steps**:
1. Click and hold on a card in your hand (bottom of screen)
2. Drag the card onto the green playfield area
3. Position the card where you want it
4. Release the mouse button to drop the card
5. Card is removed from your hand and placed on the playfield

**Visual Feedback**:
- Card becomes semi-transparent (70% opacity) while dragging
- Playfield shows green border when card is over valid drop zone
- Cursor changes to "grabbing" during drag

### Story 2: Organizing Cards on Playfield
> *"As a player, I want to reorganize cards on the playfield so I can group related cards together."*

**Steps**:
1. Click and hold on any card on the playfield
2. Drag to a new position
3. Release to place at new location
4. Card is automatically brought to the top (appears above other cards)

**Stacking Behavior**:
- Most recently moved card always appears on top
- Overlapping cards stack in order of last movement

### Story 3: Returning Cards to Hand
> *"As a player, I want to return cards from playfield to my hand so I can play them again later."*

**Steps**:
1. Click and hold on a playfield card
2. Drag down to the hand area (bottom of screen)
3. Hand area shows green border when card is over it
4. Release to add card back to hand
5. Card is removed from playfield and added to end of hand

### Story 4: Discarding Cards
> *"As a player, I want to remove cards from play by dragging them off the board."*

**Steps**:
1. Click and hold on a playfield card
2. Drag to any area outside playfield and hand (e.g., sides, top)
3. Area shows orange border to indicate discard zone
4. Release to permanently remove the card
5. Card is deleted (not added to hand or deck)

**Note**: There's a 50px forgiving threshold at playfield edges to prevent accidental discards.

### Story 5: Canceling a Drag
> *"As a player, I want to cancel a drag operation if I change my mind."*

**Steps**:
1. Start dragging any card
2. Press the **ESC** key
3. Card returns to its original position
4. No state changes occur

## Technical Overview

### Architecture

**Components**:
- `Card.tsx` - Individual card with drag handlers
- `Hand.tsx` - Hand container with drop zone for playfield cards
- `Playfield.tsx` - Main game area with absolute positioning

**Hooks**:
- `useDragAndDrop.ts` - Manages drag state and operations
- `usePlayfieldPositions.ts` - Manages card positions and z-index
- `useGameState.ts` - Manages game state (extended with drag actions)

**State Structure**:
```typescript
// Drag state (transient)
{
  isDragging: boolean,
  draggedCardId: string | null,
  currentPosition: { x, y },
  // ...
}

// Playfield state (persisted)
{
  cards: Card[],
  positions: {
    "card-1": { x: 100, y: 200, zIndex: 1 },
    "card-2": { x: 300, y: 150, zIndex: 2 }
  },
  nextZIndex: 3
}
```

### Key Features

**Absolute Positioning**:
- Cards use absolute positioning on playfield
- Positions stored as pixel coordinates (x, y)
- Relative to playfield container (responsive)

**Z-Index Management**:
- Auto-incrementing z-index counter
- Most recently moved card gets highest z-index
- Automatic normalization when counter exceeds 10,000

**Performance Optimization**:
- Debounced position updates (16ms for 60fps)
- CSS transforms for GPU acceleration
- Debounced auto-save (500ms after drag)
- Optimistic UI updates

**Persistence**:
- Positions saved to Supabase database
- Auto-save triggered 500ms after drag completes
- Positions restored on page load

## API Reference

### useDragAndDrop Hook

```typescript
const {
  dragState,
  startDrag,
  updateDragPosition,
  endDrag,
  cancelDrag,
  getDropZone,
} = useDragAndDrop();
```

**Methods**:
- `startDrag(data: DragStartData)` - Initiate drag operation
- `updateDragPosition(event: MouseEvent)` - Update position during drag
- `endDrag(event: MouseEvent)` - Complete drag and finalize position
- `cancelDrag()` - Cancel drag and reset state
- `getDropZone(position: Position2D)` - Determine drop zone for position

### usePlayfieldPositions Hook

```typescript
const {
  positions,
  nextZIndex,
  setCardPosition,
  removeCardPosition,
  bringToFront,
  getCardPosition,
} = usePlayfieldPositions();
```

**Methods**:
- `setCardPosition(cardId, position)` - Set/update card position
- `removeCardPosition(cardId)` - Remove position data
- `bringToFront(cardId)` - Bring card to top of z-index stack
- `getCardPosition(cardId)` - Get position for card

## Configuration

### Constants

```typescript
export const DRAG_DROP_CONFIG = {
  DRAG_THRESHOLD: 5,           // Min px movement to trigger drag
  MAX_Z_INDEX: 10000,          // Max z-index before normalization
  EDGE_THRESHOLD: 50,          // Forgiving edge detection (px)
  DRAG_OPACITY: 0.7,           // Opacity during drag
  DRAG_Z_INDEX: 9999,          // Z-index during drag
  DRAG_CURSOR: 'grabbing',     // Cursor during drag
  POSITION_UPDATE_DEBOUNCE: 16, // Position update delay (ms)
  AUTO_SAVE_DEBOUNCE: 500,     // Auto-save delay (ms)
};
```

## Testing

### Manual Testing Checklist

- [ ] Drag card from hand to playfield center
- [ ] Drag card to all four edges of playfield
- [ ] Drag card to all four corners of playfield
- [ ] Reposition playfield card multiple times
- [ ] Drag overlapping cards (verify z-index order)
- [ ] Drag card from playfield back to hand
- [ ] Drag card off playfield to discard
- [ ] Cancel drag with ESC key (from hand and playfield)
- [ ] Refresh page and verify positions are restored
- [ ] Test with 50+ cards (performance check)

### Integration Testing

**Scenario**: Complete card lifecycle
1. Draw card from deck to hand
2. Drag card from hand to playfield
3. Reposition card on playfield
4. Drag card back to hand
5. Drag card to playfield again
6. Drag card off playfield to discard
7. Verify all state changes are correct

## Troubleshooting

### Issue: Cards snap back to original position after drag
**Solution**: Check that drop zone is correctly detected. Playfield must be large enough and mouse must be over valid area when releasing.

### Issue: Drag doesn't start (card doesn't follow cursor)
**Solution**: Ensure you're clicking on the card itself (not background). Check console for errors. Verify drag threshold (5px movement) is exceeded.

### Issue: Z-index is wrong (wrong card appears on top)
**Solution**: Check nextZIndex counter is incrementing correctly. Verify z-index is being saved and restored from database.

### Issue: Positions are not restored after page refresh
**Solution**: Check database save operation completed successfully. Check browser console for save errors. Verify auto-save debounce is not preventing save.

### Issue: Performance is poor (frame drops during drag)
**Solution**: Check number of cards on playfield. Verify CSS transforms are being used (not left/top positioning). Check browser DevTools performance profiler.

## Known Limitations

- **Touch devices**: Mouse events only. Touch support planned for v2.
- **Keyboard users**: No keyboard alternatives for dragging. Document as accessibility limitation. Planned for v2.
- **Multiplayer**: No real-time position sync. Single-player only in v1.
- **Undo/redo**: No undo for drag operations. Planned for future enhancement.

## Next Steps

After implementing drag-and-drop:
1. Test thoroughly with manual testing checklist
2. Run performance benchmarks (60fps target with 50 cards)
3. Test cross-browser compatibility (Chrome, Firefox, Safari, Edge)
4. Verify persistence across page refreshes
5. Check for conflicts with existing features (ALT-hover preview, click interactions)
6. Document any discovered edge cases or limitations

## Resources

- Full specification: `spec.md`
- Implementation plan: `plan.md`
- Data model: `data-model.md`
- Task breakdown: `tasks.md`
- Type contracts: `contracts/card-drag-drop.ts`
