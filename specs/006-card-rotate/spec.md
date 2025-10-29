# Feature Specification: Card Tap/Rotate

**Feature Branch**: `006-card-rotate`  
**Created**: 2025-10-29  
**Status**: Draft  
**Input**: User description: "i want to have have a new feature where i can 'Tap' a card. When a hover a card and Press 'E', then i want the hovered card to rotate 90° right. With Q i want it to rotate 90° left. Q, E should be have a prevent default."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Card Tapping (Priority: P1)

A player hovers over a card in their hand or on the playfield and presses the 'E' key to tap (rotate) the card 90° clockwise, indicating the card has been used or activated this turn. This is a common mechanic in card games where tapped cards cannot be used again until untapped.

**Why this priority**: This is the core functionality - the ability to tap a card right (clockwise). Without this, the feature provides no value. This single action represents the most common use case in card games.

**Independent Test**: Can be fully tested by hovering any card and pressing 'E', then verifying the card rotates 90° clockwise and delivers immediate visual feedback that the card state has changed.

**Acceptance Scenarios**:

1. **Given** a card is displayed in its normal upright position, **When** user hovers over the card and presses 'E', **Then** the card rotates 90° clockwise
2. **Given** a card is already rotated 90° clockwise (tapped once), **When** user hovers over the card and presses 'E' again, **Then** the card rotates another 90° clockwise (now 180° from original)
3. **Given** a card is rotated 270° clockwise, **When** user hovers over the card and presses 'E', **Then** the card rotates 90° clockwise and returns to its original upright position (0° or 360°)

---

### User Story 2 - Counter-Clockwise Untapping (Priority: P2)

A player hovers over a tapped card and presses the 'Q' key to untap (rotate counter-clockwise) the card 90°, allowing quick reversal of the tap action or rotating cards in the opposite direction for different game states.

**Why this priority**: Provides the opposite rotation action, essential for correcting mistakes or implementing game mechanics that require counter-clockwise rotation. Less critical than P1 since many games primarily use clockwise tapping.

**Independent Test**: Can be fully tested by hovering any card and pressing 'Q', then verifying the card rotates 90° counter-clockwise and delivers immediate visual feedback of the state change.

**Acceptance Scenarios**:

1. **Given** a card is displayed in its normal upright position, **When** user hovers over the card and presses 'Q', **Then** the card rotates 90° counter-clockwise (270° position)
2. **Given** a card is rotated 90° clockwise, **When** user hovers over the card and presses 'Q', **Then** the card rotates 90° counter-clockwise and returns to its original upright position
3. **Given** a card is rotated 180°, **When** user hovers over the card and presses 'Q', **Then** the card rotates to 90° clockwise position

---

### User Story 3 - Keyboard Event Handling (Priority: P1)

When pressing 'Q' or 'E' keys while hovering a card, the default browser behavior for these keys is prevented to avoid conflicts with browser shortcuts or other page functionality.

**Why this priority**: Critical for proper functionality - without preventing default, the keys might trigger unwanted browser actions, interfere with other features, or cause inconsistent behavior.

**Independent Test**: Can be fully tested by pressing 'Q' and 'E' while hovering cards and verifying that only the card rotation occurs without any browser default actions (like quick find, scroll, or other shortcuts).

**Acceptance Scenarios**:

1. **Given** user is hovering over a card, **When** user presses 'E', **Then** only the card rotation occurs and no browser default action is triggered
2. **Given** user is hovering over a card, **When** user presses 'Q', **Then** only the card rotation occurs and no browser default action is triggered
3. **Given** user is not hovering over any card, **When** user presses 'Q' or 'E', **Then** no card rotation occurs (keys only work when hovering)

---

### Edge Cases

- What happens when user rapidly presses 'E' or 'Q' multiple times (rapid tapping)?
- What happens when user presses 'E' and 'Q' simultaneously?
- What happens when a card is mid-rotation animation and user presses another rotation key?
- What happens when user moves mouse away from card while rotation animation is in progress?
- What happens when user has multiple cards overlapping and hovers the stack?
- What happens when rotation keys are pressed but no card is currently hovered?
- How does the system handle cards that are being dragged while rotation keys are pressed?
- What happens when user presses modifier keys (Ctrl, Shift, Alt) combined with 'Q' or 'E'?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST rotate a hovered card 90° clockwise when user presses the 'E' key
- **FR-002**: System MUST rotate a hovered card 90° counter-clockwise when user presses the 'Q' key
- **FR-003**: System MUST prevent default browser behavior for 'Q' and 'E' keys when a card is hovered
- **FR-004**: System MUST only respond to 'Q' and 'E' keys when user is actively hovering over a card
- **FR-005**: System MUST track the current rotation state of each card (0°, 90°, 180°, 270°)
- **FR-006**: System MUST apply rotation transformations cumulatively (each key press adds/subtracts 90° to current rotation)
- **FR-007**: System MUST persist card rotation state so rotated cards maintain their orientation during the game session
- **FR-008**: System MUST provide visual feedback during rotation transition (smooth animation)
- **FR-009**: System MUST normalize rotation values (e.g., 360° becomes 0°, -90° becomes 270°)
- **FR-010**: System MUST work with cards in all locations (hand, playfield, deck view)
- **FR-011**: System MUST allow rotation keys to work during card hover preview if preview is active
- **FR-012**: System MUST handle rotation state when cards are moved between locations (e.g., hand to playfield)

### Key Entities

- **Card Rotation State**: Represents the current rotational orientation of a card, stored as an angle in degrees (0°, 90°, 180°, 270°), associated with each card instance regardless of its location

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can tap/untap any visible card with a single key press ('E' or 'Q') and see immediate visual response within 50ms
- **SC-002**: Card rotation animations complete smoothly within 200-300ms providing clear visual feedback
- **SC-003**: Rotation state persists throughout the game session - rotated cards maintain their orientation when moved between hand and playfield
- **SC-004**: No browser default actions are triggered when pressing 'Q' or 'E' while hovering cards (100% prevention rate)
- **SC-005**: Rotation feature works consistently across all card locations (hand, playfield, preview) with identical behavior
- **SC-006**: Users can successfully rotate cards at least 10 times per second without visual glitches or state inconsistencies

## Assumptions

- Card rotation follows standard card game conventions (clockwise = tapped/used, counter-clockwise = untapped/available)
- Rotation increments are fixed at 90° steps (quarter turns) rather than arbitrary angles
- 'Q' and 'E' keys are chosen for ergonomic reasons (adjacent to WASD gaming controls) and don't conflict with existing application shortcuts
- Only the currently hovered card should respond to rotation keys (no multi-card rotation)
- Rotation state is ephemeral and only needs to persist during the active game session (not saved to database between sessions)
- Rotation animations use standard easing for smooth visual transitions
- Card hit detection for hover already exists from previous features (003-card-hover-preview)
- Rotation should work independently from other card interactions (drag, preview, etc.)
