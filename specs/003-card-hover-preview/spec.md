/speckit.tasks# Feature Specification: Card Hover Preview with ALT Key

**Feature Branch**: `003-card-hover-preview`  
**Created**: October 28, 2025  
**Status**: Draft  
**Input**: User description: "When hovering a card while holding ALT key, show a larger preview next to mouse cursor that follows mouse movement and handles visibility constraints"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic ALT+Hover Preview (Priority: P1)

A player wants to see card details more clearly during gameplay. They hover over a card while holding the ALT key, and a large preview appears near their cursor, following their mouse movements smoothly.

**Why this priority**: This is the core functionality that delivers immediate value - allowing users to inspect cards without disrupting game flow. Can be deployed independently and provides complete value on its own.

**Independent Test**: Can be fully tested by hovering any card while holding ALT and verifying a preview appears near the cursor, follows mouse movement, and disappears when releasing ALT or leaving the card. Delivers immediate value by enabling card inspection.

**Acceptance Scenarios**:

1. **Given** a card is visible on screen, **When** user hovers over the card and holds down ALT key, **Then** a larger preview of the card appears next to the mouse cursor
2. **Given** preview is showing, **When** user moves mouse while still hovering card and holding ALT, **Then** preview follows the mouse cursor smoothly
3. **Given** preview is showing, **When** user releases ALT key, **Then** preview disappears immediately
4. **Given** preview is showing, **When** user moves mouse off the card, **Then** preview disappears immediately
5. **Given** preview was dismissed, **When** user presses ALT again while hovering same card, **Then** preview reappears
6. **Given** user hovers card without holding ALT, **When** no other action occurs, **Then** no preview appears

---

### User Story 2 - Smart Viewport Positioning (Priority: P2)

A player hovers over cards near screen edges. The preview automatically positions itself to remain fully visible, never getting cut off by viewport boundaries, ensuring all card details are always readable.

**Why this priority**: Essential for usability but depends on basic preview functionality. Prevents frustration when inspecting cards near screen edges. Can be implemented and tested after P1 is working.

**Independent Test**: Can be tested by hovering cards at all viewport edges (top, bottom, left, right, corners) while holding ALT and verifying the preview adjusts position to stay fully visible within viewport bounds.

**Acceptance Scenarios**:

1. **Given** card is near right edge of viewport, **When** user ALT+hovers the card, **Then** preview appears to the left of cursor to remain fully visible
2. **Given** card is near left edge of viewport, **When** user ALT+hovers the card, **Then** preview appears to the right of cursor to remain fully visible
3. **Given** card is near top edge of viewport, **When** user ALT+hovers the card, **Then** preview adjusts vertically to remain fully visible
4. **Given** card is near bottom edge of viewport, **When** user ALT+hovers the card, **Then** preview adjusts vertically to remain fully visible
5. **Given** card is in corner of viewport, **When** user ALT+hovers the card, **Then** preview positions itself to be 100% visible within viewport
6. **Given** preview is showing and user moves near edge, **When** mouse approaches viewport boundary, **Then** preview repositions smoothly to stay visible

---

### User Story 3 - Hand Card Preview Overlay (Priority: P3)

A player wants to preview cards from their hand at the bottom of the screen. The preview appears as a full overlay on top of all game elements, including the hand container itself, ensuring clear visibility regardless of hand positioning.

**Why this priority**: Enhances user experience for hand cards but builds on P1 and P2 functionality. The overlay behavior is specific to hand cards and can be implemented after core preview mechanics work.

**Independent Test**: Can be tested by ALT+hovering cards in the hand component and verifying the preview renders as a top-level overlay (above hand container z-index) while still following all P1 and P2 behaviors.

**Acceptance Scenarios**:

1. **Given** cards are in player's hand, **When** user ALT+hovers a hand card, **Then** preview appears as overlay above hand container
2. **Given** hand card preview is showing, **When** preview would overlap hand container, **Then** preview renders on top of hand container
3. **Given** hand card preview is showing, **When** preview would overlap other game elements, **Then** preview renders on top of all game elements
4. **Given** user ALT+hovers hand card near bottom of screen, **When** viewport positioning logic runs, **Then** preview positions above cursor to avoid bottom edge

---

### Edge Cases

- What happens when user ALT+hovers card while another preview is showing? (Previous preview should be replaced with new one)
- How does system handle rapid ALT key toggling? (Should show/hide preview responsively without lag or flicker)
- What happens when user ALT+hovers while dragging? (Preview should not interfere with drag operations)
- How does system handle window resize while preview is showing? (Preview should reposition or hide if card is no longer in viewport)
- What happens when card image fails to load in preview? (Preview should show fallback card design)
- How does system handle very fast mouse movements? (Preview should follow smoothly without stuttering or lag)
- What happens when multiple cards overlap and user hovers the overlap area? (Preview should show the topmost/interactive card)
- How does system handle ALT+hover on disabled cards? (Preview should still work to show card details)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect when user holds ALT key while hovering over any card component
- **FR-002**: System MUST display a larger preview (minimum 2x original size) of the card near the mouse cursor when ALT+hover condition is met
- **FR-003**: System MUST update preview position in real-time as mouse moves while ALT key is held and card is hovered
- **FR-004**: System MUST hide preview immediately when user releases ALT key
- **FR-005**: System MUST hide preview immediately when mouse leaves the card boundary
- **FR-006**: System MUST allow preview to be toggled on/off by repeatedly pressing and releasing ALT while hovering same card
- **FR-007**: System MUST position preview to ensure 100% of preview card is visible within viewport at all times
- **FR-008**: System MUST dynamically adjust preview position when mouse moves near viewport edges to maintain full visibility
- **FR-009**: System MUST render hand card previews as overlays above all other game elements including hand container
- **FR-010**: System MUST render board card previews as overlays above board elements
- **FR-011**: System MUST use a single global keyboard event listener for ALT key detection to optimize performance
- **FR-012**: System MUST use a single global mouse move listener when preview is active to optimize performance
- **FR-013**: System MUST clean up event listeners when component unmounts or preview is dismissed
- **FR-014**: System MUST show the same card image in preview as displayed in the original card
- **FR-015**: System MUST show fallback card design in preview if card image fails to load
- **FR-016**: Preview MUST NOT interfere with existing card click/interaction behaviors
- **FR-017**: Preview MUST NOT interfere with existing drag-and-drop operations
- **FR-018**: System MUST handle preview for cards in all locations: deck, hand, and playfield

### Key Entities

- **Card Preview State**: Tracks whether preview is currently showing, which card is being previewed, current mouse position, and preview visibility state
- **Card Reference**: The card data being previewed (id, name, imageUrl)
- **Position Data**: Mouse coordinates (x, y), viewport dimensions (width, height), preview dimensions, calculated preview position
- **Keyboard State**: ALT key pressed/released state

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Preview appears within 50 milliseconds of user pressing ALT while hovering a card
- **SC-002**: Preview position updates at 60fps (16.67ms per frame) while following mouse movement
- **SC-003**: Preview never extends beyond viewport boundaries (0% clipping in all edge cases)
- **SC-004**: Preview dismisses within 16 milliseconds of releasing ALT key or mouse leaving card
- **SC-005**: Users can toggle preview on/off 10+ times per second without performance degradation
- **SC-006**: Preview functionality adds maximum 3 active event listeners during preview display (1 keyboard, 1 mouse move, 1 optional)
- **SC-007**: Preview z-index renders above all game elements (hand, playfield, deck) without visual conflicts
- **SC-008**: Preview maintains card aspect ratio (5:7) at all sizes and positions
- **SC-009**: All existing card interactions (click, keyboard navigation) work identically with preview feature enabled
- **SC-010**: Preview works consistently across all card locations (deck, hand, playfield)
- **SC-011**: Lighthouse performance score remains 90+ with preview feature enabled
- **SC-012**: Preview uses consistent styling matching existing card component design
- **SC-013**: Preview visual appearance (shadows, borders, opacity) maintains design system consistency
