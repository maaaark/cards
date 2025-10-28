# Feature Specification: Remove Click-to-Place Card Behavior

**Feature Branch**: `005-hand-playfield-drag`  
**Created**: October 28, 2025  
**Status**: Draft  
**Input**: User description: "I want a feature where i can drag my cards from the hand to the playfield and back. Right now, when i click on a card in my hand, it will place at a specific position on the board, this can be removed. The cards on my hand can be dragged to the board and be placed anywhere like currently implemented. When i grab a card on the playfield, and move it to the 'handcards' div, it should be placed inside my hand cards and removed from the playboard."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove Click-to-Place Behavior (Priority: P1)

A player currently has two ways to move cards from hand to playfield: clicking (which places at a predefined position) and dragging (which places at cursor position). This creates confusion and inconsistency. The click-to-place behavior should be removed, leaving only the drag interaction.

**Why this priority**: This is a cleanup/refinement of existing drag-drop functionality (feature 004). Removing the redundant click behavior creates a clearer, more consistent interaction model. Essential to prevent user confusion about which interaction method to use.

**Independent Test**: Can be fully tested by clicking a card in hand and verifying no placement occurs, then dragging the same card to playfield and verifying it places at the drop position.

**Acceptance Scenarios**:

1. **Given** player has cards in hand, **When** user clicks on a hand card (without dragging), **Then** no action occurs and card remains in hand
2. **Given** player has cards in hand, **When** user clicks and drags a card to playfield, **Then** card is placed at the exact drop position (existing drag behavior continues to work)
3. **Given** drag-drop functionality works, **When** user tests card placement, **Then** only drag interaction places cards on playfield (click has no effect)

---

### User Story 2 - Verify Playfield-to-Hand Drag (Priority: P2)

Ensure the existing functionality for dragging cards from playfield back to hand continues to work correctly. This is a verification story to confirm feature 004 implementation is intact.

**Why this priority**: This functionality already exists from feature 004 (User Story 5), but needs verification to ensure it works as expected after removing the click handler. Lower priority because it's existing functionality, not new development.

**Independent Test**: Can be tested by placing a card on playfield via drag, then dragging it over the hand area and releasing to verify it's removed from playfield and added to hand.

**Acceptance Scenarios**:

1. **Given** cards are on playfield, **When** user drags a playfield card over hand container, **Then** hand area shows visual feedback (highlight or border)
2. **Given** user is dragging playfield card over hand, **When** user releases mouse button, **Then** card is removed from playfield and added to end of hand
3. **Given** card is returned to hand, **When** card is added, **Then** card appears in hand at the rightmost position
4. **Given** user drags playfield card to hand, **When** operation completes, **Then** card's playfield position data is cleared from game state

---

### Edge Cases

- What happens when user clicks a card while a drag is in progress? (Should be ignored or only one interaction active at a time)
- What happens when user rapidly clicks multiple cards? (No action should occur)
- What happens when click event fires during a very short drag (< 5px movement)? (Should be treated as drag, not click)
- How does the system differentiate between a click and a drag start? (Drag threshold detection already implemented in feature 004)

## Requirements *(mandatory)*

### Functional Requirements

#### Click Behavior Removal
- **FR-001**: System MUST NOT place cards on playfield when user clicks a hand card without dragging
- **FR-002**: System MUST remove the onClick handler that triggers card placement from hand cards
- **FR-003**: System MUST preserve all existing drag-and-drop functionality when removing click handler

#### Drag-Only Interaction
- **FR-004**: System MUST continue to support dragging cards from hand to playfield at cursor position (existing functionality from feature 004)
- **FR-005**: System MUST continue to support dragging cards from playfield back to hand (existing functionality from feature 004)
- **FR-006**: System MUST continue to support repositioning cards on playfield (existing functionality from feature 004)

#### Playfield-to-Hand Verification
- **FR-007**: System MUST remove card from playfield when dropped on hand container
- **FR-008**: System MUST add returned card to hand at the end position (rightmost)
- **FR-009**: System MUST show visual feedback (border/highlight) when dragging card over hand area
- **FR-010**: System MUST clear card's playfield position data when moved to hand
- **FR-011**: System MUST update game state and persist changes when card moves from playfield to hand

### Key Entities

This feature modifies interaction with existing entities from feature 004:

- **Card**: Represents a game card that can be in hand or on playfield
- **Hand**: Container for cards available to player (bottom of screen)
- **Playfield**: Game area where cards are positioned with x, y coordinates
- **Drag State**: Tracks active drag operation (source, position, card)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users cannot place cards on playfield by clicking hand cards (100% of click attempts result in no action)
- **SC-002**: Users can drag cards from hand to playfield with exact positioning (100% accuracy maintained from feature 004)
- **SC-003**: Users can drag cards from playfield to hand successfully (100% of drop attempts in hand area result in card transfer)
- **SC-004**: Card drag interactions maintain 60fps performance (no regression from feature 004)
- **SC-005**: Visual feedback for hand drop zone appears within 16ms of card entering area
- **SC-006**: Game state updates persist correctly when cards move from playfield to hand (verified by page refresh)
- **SC-007**: No console errors or warnings when clicking cards (clean removal of click handler)
- **SC-008**: All acceptance scenarios pass manual testing
- **SC-009**: Lighthouse performance score remains 90+ (no regression)
- **SC-010**: Existing drag-drop functionality works identically to feature 004 implementation
