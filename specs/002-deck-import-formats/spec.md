# Feature Specification: Deck Import Formats

**Feature Branch**: `002-deck-import-formats`  
**Created**: October 27, 2025  
**Status**: Draft  
**Input**: User description: "I want to enable to card import. I has multiple options to import a deck: JSON and TTS. Both options have a textarea as input field."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import Deck via TTS Format (Priority: P1)

A user wants to import a card deck using the Tabletop Simulator (TTS) format by pasting card codes into a text area. The system parses the codes, constructs image URLs, and adds the cards to the game deck.

**Why this priority**: TTS format is the primary import method with a concrete example provided. It enables users to quickly import decks from a common card game platform.

**Independent Test**: Can be fully tested by pasting TTS card codes (e.g., "OGN-253-1 OGN-004-1") into the import field and verifying that 2 cards appear in the deck with correct images from riftmana.com.

**Acceptance Scenarios**:

1. **Given** the user is on the deck import screen, **When** they select TTS format and paste "OGN-253-1 OGN-004-1 OGN-009-1 OGN-009-1 OGN-227-1" into the textarea, **Then** the system creates a deck with 5 cards
2. **Given** a TTS card code "OGN-253-1", **When** the system processes the import, **Then** it strips the "-1" suffix and constructs the image URL as "https://riftmana.com/wp-content/uploads/Cards/OGN-253.webp"
3. **Given** duplicate card codes in the import (e.g., "OGN-009-1" appears twice), **When** the system processes the import, **Then** both instances are added as separate cards to the deck
4. **Given** a successful TTS import, **When** the user views their deck, **Then** each card displays the full card image fetched from the constructed URL

---

### User Story 2 - Import Deck via JSON Format (Priority: P2)

A user wants to import a card deck using a JSON format by pasting JSON data into a text area. The system parses the JSON structure matching the existing sample-deck.json format and adds the specified cards to the game deck.

**Why this priority**: JSON format provides flexibility for structured data import with rich metadata (card names, types, power, cost, etc.), enabling future features like card search and filtering.

**Independent Test**: Can be fully tested by pasting valid JSON matching the sample-deck.json structure into the import field and verifying cards are added to the deck with their id, name, and metadata properties preserved.

**Acceptance Scenarios**:

1. **Given** the user is on the deck import screen, **When** they select JSON format and paste valid JSON data with structure `{"name": "Deck Name", "cards": [...]}` into the textarea, **Then** the system parses the JSON and creates cards with their id, name, and metadata
2. **Given** invalid JSON data, **When** the user attempts to import, **Then** the system displays a clear error message indicating the JSON format is invalid
3. **Given** a successful JSON import, **When** the user views their deck, **Then** all cards from the JSON are present with their specified id, name, and metadata attributes

---

### User Story 3 - Switch Between Import Formats (Priority: P3)

A user wants to switch between TTS and JSON import formats without losing their current input, allowing them to choose the most convenient format for their deck source.

**Why this priority**: Enhances user experience by providing format flexibility, but can be implemented after core import functionality is working.

**Independent Test**: Can be tested by entering data in one format, switching to another format, then switching back to verify the original data is preserved.

**Acceptance Scenarios**:

1. **Given** the user has entered TTS card codes in the textarea, **When** they switch to JSON format, **Then** the textarea content is preserved (not cleared)
2. **Given** the user is viewing the import interface, **When** they select a format option, **Then** the interface clearly indicates which format is currently active
3. **Given** the user has selected a format, **When** they paste data, **Then** the system validates the data according to the selected format

---

### Edge Cases

- What happens when a TTS card code is malformed (e.g., missing hyphen, invalid format)?
- What happens when the constructed image URL returns a 404 error (card image not found)?
- What happens when the user pastes empty content or only whitespace into the textarea?
- How does the system handle very large imports (e.g., 1000+ cards)?
- What happens when a TTS card code has multiple hyphens (e.g., "SET-SUB-123-1")?
- What happens when the user attempts to import while a game session is already in progress?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide two import format options: TTS and JSON
- **FR-002**: System MUST display a textarea input field for both TTS and JSON formats
- **FR-003**: System MUST allow users to select which import format they want to use
- **FR-004**: System MUST parse TTS format card codes separated by spaces (e.g., "OGN-253-1 OGN-004-1")
- **FR-005**: System MUST strip the trailing "-1" suffix from TTS card codes when constructing image URLs
- **FR-006**: System MUST construct image URLs for TTS cards using the pattern: "https://riftmana.com/wp-content/uploads/Cards/{CODE}.webp"
- **FR-007**: System MUST create individual card instances for duplicate codes in the import (e.g., two "OGN-009-1" entries result in two separate cards)
- **FR-008**: System MUST display the full card image for each imported card
- **FR-009**: System MUST add imported cards to the current deck for the session
- **FR-010**: System MUST validate TTS card codes match expected format before processing
- **FR-011**: System MUST provide error feedback when import data is invalid or malformed
- **FR-012**: System MUST accept JSON format imports using the existing deck schema structure with deck name and cards array containing id, name, and metadata properties
- **FR-013**: System MUST validate JSON structure before processing JSON imports
- **FR-014**: Imported decks MUST be temporary and exist only for the current session (not persisted to database)

### Key Entities

- **Deck Import Request**: Represents a user's deck import attempt, containing the format type (TTS or JSON) and the raw input data
- **Card Code**: For TTS format, a string identifier following the pattern "{SET}-{NUMBER}-{QUANTITY}" that maps to a card image
- **Imported Card**: A card instance created from import data, containing an image URL and temporary identifier for the session
- **Import Format**: An enumeration defining available import types (TTS, JSON)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully import a 5-card TTS deck in under 10 seconds (from paste to visible cards)
- **SC-002**: The TTS card code parser correctly processes 100% of valid card codes in the format "{SET}-{NUMBER}-1"
- **SC-003**: Card images load and display at full resolution within 3 seconds on standard broadband connection
- **SC-004**: Import validation provides clear error messages within 1 second of user action for invalid inputs
- **SC-005**: The import interface is accessible via keyboard navigation (tab, enter, escape keys)
- **SC-006**: The import textarea and format selection controls use consistent styling with the existing design system
- **SC-007**: Users can import decks containing duplicate cards, and the correct quantity appears in the deck
- **SC-008**: The import feature works seamlessly in both light and dark modes without visual glitches

## Assumptions

- **A-001**: JSON import format follows the existing `sample-deck.json` schema structure with deck name and cards array
- **A-002**: Cards in JSON format contain `id`, `name`, and `metadata` properties matching the current project structure
- **A-003**: TTS card codes follow the pattern `{SET}-{NUMBER}-{QUANTITY}` where the quantity suffix (e.g., "-1") is always present and needs to be stripped
- **A-004**: Image URLs for TTS cards are always hosted at `https://riftmana.com/wp-content/uploads/Cards/` with `.webp` extension
- **A-005**: For JSON imports, if card images are not specified, the system will use the card `id` to attempt loading a default image or display a placeholder
- **A-006**: Import operations are synchronous and complete before the user can interact with the deck
