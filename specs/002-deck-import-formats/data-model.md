# Data Model: Deck Import Formats

**Feature**: Deck Import Formats  
**Branch**: `002-deck-import-formats`  
**Date**: 2025-10-27

## Overview

This document defines the data structures, entities, and state transitions for the dual-format deck import feature. The data model extends the existing game state from feature 001-card-sandbox with import-specific types.

---

## Core Entities

### 1. ImportFormat (Enum)

Defines the available deck import formats.

**Type**: Enumeration

**Values**:
- `tts` - Tabletop Simulator format (space-separated card codes)
- `json` - JSON format (structured deck data)

**Validation Rules**:
- Must be one of the two defined values
- Used for format selection UI and parser routing

**Usage**:
```typescript
type ImportFormat = 'tts' | 'json';
```

---

### 2. TTSCardCode

Represents a parsed Tabletop Simulator card code.

**Fields**:
- `raw` (string): Original code as entered (e.g., "OGN-253-1")
- `set` (string): Card set identifier (e.g., "OGN")
- `number` (string): Card number within set (e.g., "253")
- `quantity` (string): Quantity suffix (e.g., "1")
- `imageCode` (string): Code without quantity (e.g., "OGN-253")
- `imageUrl` (string): Constructed full image URL

**Validation Rules**:
- `raw` must match pattern: `/^[A-Z0-9]+-[0-9]+-[0-9]+$/`
- Must contain at least 2 hyphens
- `imageUrl` must be valid HTTPS URL to riftmana.com

**Relationships**:
- Transforms into `Card` entity for game state
- Multiple codes can have same `imageCode` (duplicates)

**State Transitions**:
```
User Input → Parse → TTSCardCode → Validate → Card
```

---

### 3. JSONDeckData

Represents the structure of imported JSON deck data.

**Fields**:
- `name` (string): Deck name/title
- `cards` (JSONCardData[]): Array of card definitions

**Validation Rules**:
- `name` must be non-empty string
- `cards` must be non-empty array (min 1 card)
- Must be valid JSON syntax
- Must conform to Zod schema

**Relationships**:
- Contains multiple `JSONCardData` entities
- Transforms into array of `Card` entities for game state

**Example**:
```json
{
  "name": "Sample Deck",
  "cards": [
    {
      "id": "card-001",
      "name": "Fire Mage",
      "metadata": {
        "type": "creature",
        "power": 5,
        "cost": 3
      }
    }
  ]
}
```

---

### 4. JSONCardData

Represents a single card definition in JSON import format.

**Fields**:
- `id` (string): Unique identifier within JSON (e.g., "wizard-001")
- `name` (string): Human-readable card name
- `metadata` (Record<string, unknown>, optional): Arbitrary card properties
- `imageUrl` (string, optional): Custom image URL override

**Validation Rules**:
- `id` must be non-empty string
- `name` must be non-empty string
- `metadata` can contain any valid JSON object (flexible)
- `imageUrl` if provided must be valid URL

**Relationships**:
- Child of `JSONDeckData`
- Transforms into `Card` entity with preserved metadata

---

### 5. ImportValidationResult

Represents the outcome of validating import input.

**Fields**:
- `valid` (boolean): Whether input passed validation
- `format` (ImportFormat): Which format was validated
- `error` (string, optional): Human-readable error message
- `cardCount` (number, optional): Number of cards found (if valid)
- `warnings` (string[], optional): Non-critical issues

**Validation Rules**:
- If `valid` is false, `error` must be present
- If `valid` is true, `cardCount` must be present and >0
- `warnings` array can contain messages even when valid

**State Transitions**:
```
Input String → Validate → ImportValidationResult
  ↓ (if valid)
Parsed Data → Transform → Card[]
```

**Example**:
```typescript
// Success case:
{
  valid: true,
  format: 'tts',
  cardCount: 5,
}

// Error case:
{
  valid: false,
  format: 'json',
  error: 'Invalid JSON: Unexpected token at position 42',
}

// Warning case:
{
  valid: true,
  format: 'tts',
  cardCount: 3,
  warnings: ['Skipped 2 invalid card codes'],
}
```

---

### 6. DeckImportState

Represents the UI state for the deck import component.

**Fields**:
- `format` (ImportFormat): Currently selected format
- `ttsInput` (string): Content of TTS textarea
- `jsonInput` (string): Content of JSON textarea
- `validation` (ImportValidationResult | null): Latest validation result
- `isImporting` (boolean): Whether import is in progress

**Validation Rules**:
- Only one format can be active at a time
- Both inputs preserved independently
- `validation` updated on input change (debounced)

**State Transitions**:
```
Initial State → User Selects Format → Format Changed
             → User Types Input → Validation Triggered
             → User Clicks Import → Cards Added to Deck
```

---

## Extended Entities (from 001-card-sandbox)

### Card (Extended)

The existing `Card` entity from feature 001 is extended to support import metadata.

**New Optional Fields**:
- `importSource` ('tts' | 'json'): Which format created this card
- `ttsCode` (string, optional): Original TTS code if from TTS import
- `jsonId` (string, optional): Original JSON id if from JSON import
- `metadata` (Record<string, unknown>, optional): Preserved from JSON import

**Rationale**:
- Allows tracking import source for debugging
- Preserves original identifiers for reference
- Enables future features (e.g., "Show import history")

---

## State Transitions

### TTS Import Flow

```
1. User Input: "OGN-253-1 OGN-004-1"
   ↓
2. Parse: Split on whitespace, trim, validate pattern
   ↓
3. TTSCardCode[]: [
     { raw: "OGN-253-1", imageCode: "OGN-253", ... },
     { raw: "OGN-004-1", imageCode: "OGN-004", ... }
   ]
   ↓
4. Transform to Card[]: [
     { id: uuid(), imageUrl: "https://...", importSource: 'tts', ttsCode: "OGN-253-1" },
     { id: uuid(), imageUrl: "https://...", importSource: 'tts', ttsCode: "OGN-004-1" }
   ]
   ↓
5. Add to GameState.deck (via useGameState hook)
```

### JSON Import Flow

```
1. User Input: '{"name": "My Deck", "cards": [...]}'
   ↓
2. Parse: JSON.parse() + Zod validation
   ↓
3. JSONDeckData: { name: "My Deck", cards: [...] }
   ↓
4. Extract JSONCardData[]: [
     { id: "wizard-001", name: "Arcane Wizard", metadata: {...} },
     { id: "warrior-001", name: "Brave Knight", metadata: {...} }
   ]
   ↓
5. Transform to Card[]: [
     { id: uuid(), name: "Arcane Wizard", metadata: {...}, importSource: 'json', jsonId: "wizard-001" },
     { id: uuid(), name: "Brave Knight", metadata: {...}, importSource: 'json', jsonId: "warrior-001" }
   ]
   ↓
6. Add to GameState.deck (via useGameState hook)
```

### Format Switching Flow

```
State: { format: 'tts', ttsInput: "OGN-253-1", jsonInput: "" }
  ↓
User clicks "JSON" format button
  ↓
State: { format: 'json', ttsInput: "OGN-253-1", jsonInput: "" }
       (ttsInput preserved but not displayed)
  ↓
User types JSON: '{"name": "Test", "cards": [...]}'
  ↓
State: { format: 'json', ttsInput: "OGN-253-1", jsonInput: '{"name": ...}' }
  ↓
User clicks "TTS" format button
  ↓
State: { format: 'tts', ttsInput: "OGN-253-1", jsonInput: '{"name": ...}' }
       (both inputs preserved, ttsInput now displayed)
```

---

## Validation Rules Summary

### TTS Format Validation

1. **Input not empty**: Trimmed input must have length >0
2. **Pattern matching**: Each code matches `/^[A-Z0-9]+-[0-9]+-[0-9]+$/`
3. **At least one valid code**: After filtering invalid codes, array not empty
4. **URL construction**: Each code can be split on last hyphen
5. **Duplicate handling**: Same code can appear multiple times (intentional)

**Error Messages**:
- Empty input: "Please enter TTS card codes (e.g., OGN-253-1)"
- No valid codes: "No valid TTS card codes found. Expected format: SET-NUMBER-QUANTITY"
- Invalid code format: "Invalid code: '{code}'. Must use format SET-NUMBER-QUANTITY"

### JSON Format Validation

1. **Valid JSON syntax**: JSON.parse() succeeds without error
2. **Schema conformance**: Matches Zod schema (DeckImportSchema)
3. **Non-empty deck**: cards array has at least 1 element
4. **Required fields**: Each card has id and name
5. **Type checking**: Fields have correct types (string, object, etc.)

**Error Messages**:
- Syntax error: "Invalid JSON: {original error message}"
- Missing field: "Missing required field: {path}"
- Wrong type: "Expected {type} at {path}, got {actual}"
- Empty deck: "Deck must contain at least one card"

---

## Database Schema Impact

**No database changes required** - imported decks are temporary (session-only per FR-014).

The existing `game_sessions` table from feature 001 already stores deck state as JSONB. Imported cards are added to the in-memory deck and then persisted via the existing `useSupabase` hook with debounced saves.

**Future Consideration**: If deck import history is desired (not in current spec), could add:
```sql
CREATE TABLE deck_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(64) REFERENCES game_sessions(session_id),
  format VARCHAR(10) NOT NULL CHECK (format IN ('tts', 'json')),
  card_count INTEGER NOT NULL,
  imported_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Performance Considerations

### Memory Usage

**TTS Format**:
- Input string: ~1KB per 20 cards
- Parsed codes: ~200 bytes per code
- Transformed cards: ~300 bytes per card
- **Total for 100 cards**: ~30KB

**JSON Format**:
- Input string: ~2KB per 20 cards (with metadata)
- Parsed object: ~400 bytes per card (with metadata)
- Transformed cards: ~400 bytes per card
- **Total for 100 cards**: ~40KB

Both well within browser memory limits.

### Processing Time

Based on research benchmarks:
- TTS parsing: ~1ms per 10 cards
- JSON parsing: ~0.5ms per 10 cards
- Validation: ~0.5ms per 10 cards
- Transformation: ~0.2ms per 10 cards

**Example**: 100-card import takes ~15-20ms total (TTS) or ~12-15ms (JSON).

---

## Error Handling Matrix

| Scenario | Detection | User Feedback | Recovery |
|----------|-----------|---------------|----------|
| Empty input | Input length check | "Please enter card codes/JSON" | User adds content |
| Invalid TTS code | Regex validation | "Invalid code: {code}" | User corrects format |
| Invalid JSON syntax | JSON.parse() exception | "Invalid JSON at position {pos}" | User fixes syntax |
| Missing required field | Zod validation | "Missing field: {path}" | User adds field |
| Empty cards array | Array length check | "Deck must have at least 1 card" | User adds cards |
| Image 404 (TTS) | Card component error handler | Show placeholder image | Automatic fallback |
| Very large import (>1000 cards) | Card count check | "Large import may be slow" | User proceeds or cancels |
| Network timeout (future) | Fetch timeout | "Failed to verify image URLs" | User retries or proceeds |

---

## Type Definitions Location

All TypeScript types defined in this data model will be implemented in:

**Primary Location**: `app/lib/types/deck-import.ts`

**Related Types** (extended from existing):
- `app/lib/types/game.ts` - Card entity extensions
- `specs/002-deck-import-formats/contracts/deck-import.ts` - Full interfaces with JSDoc

---

## Summary

**Total New Entities**: 6
1. ImportFormat (enum)
2. TTSCardCode (parsed TTS data)
3. JSONDeckData (parsed JSON data)
4. JSONCardData (JSON card definition)
5. ImportValidationResult (validation outcome)
6. DeckImportState (UI state)

**Extended Entities**: 1
- Card (added import metadata fields)

**State Transitions**: 3 flows documented
- TTS import (5 steps)
- JSON import (6 steps)
- Format switching (4 steps)

**Validation Rules**: 10 defined
- 5 for TTS format
- 5 for JSON format

**Database Impact**: None (session-only storage)

All entities support the functional requirements and success criteria from the specification.
