# Quickstart: Deck Import Formats Implementation

**Feature**: Deck Import Formats  
**Branch**: `002-deck-import-formats`  
**Date**: 2025-10-27

## Overview

This guide provides step-by-step instructions for implementing the dual-format deck import feature. Follow these steps sequentially to build a complete, working import system.

**Estimated Time**: 4-6 hours  
**Complexity**: Medium  
**Prerequisites**: Feature 001-card-sandbox completed

---

## Step 1: Install Dependencies

Install the Zod validation library for JSON schema validation.

```bash
npm install zod
```

**Why**: Zod provides type-safe runtime validation for JSON imports with excellent error messages.

**Verify**: Check that `package.json` includes `"zod": "^3.x.x"` in dependencies.

---

## Step 2: Create Type Definitions

Create the import-specific type definitions.

**File**: `app/lib/types/deck-import.ts`

```typescript
// Copy the full content from specs/002-deck-import-formats/contracts/deck-import.ts
// Replace the placeholder Card interface with:
import type { Card } from './game';

// Then export all the import-specific types:
export type ImportFormat = 'tts' | 'json';
export const TTS_IMAGE_BASE_URL = 'https://riftmana.com/wp-content/uploads/Cards/';
export const TTS_CODE_PATTERN = /^[A-Z0-9]+-[0-9]+-[0-9]+$/;
export const MAX_IMPORT_SIZE_BYTES = 5 * 1024 * 1024;

// ... (include all interfaces from contracts file)
```

**Why**: Centralizes all type definitions for type-safe development.

**Verify**: No TypeScript errors, types are importable from other files.

---

## Step 3: Extend Card Type

Extend the existing Card interface to support import metadata.

**File**: `app/lib/types/game.ts`

```typescript
// Add to existing file:

/**
 * Optional fields added by deck import feature
 */
export interface Card {
  id: string;
  name?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  
  // NEW: Import tracking fields
  importSource?: 'tts' | 'json';
  ttsCode?: string;
  jsonId?: string;
  importedAt?: Date;
}
```

**Why**: Preserves import source information for debugging and future features.

**Verify**: Existing Card components still work (new fields are optional).

---

## Step 4: Implement TTS Parser

Create the TTS format parser utility.

**File**: `app/lib/utils/parsers/tts-parser.ts`

```typescript
import {
  type TTSCardCode,
  type TTSParseResult,
  TTS_IMAGE_BASE_URL,
  TTS_CODE_PATTERN,
} from '@/app/lib/types/deck-import';

/**
 * Parse TTS format card codes from input string.
 * 
 * @param input - Raw input from textarea (e.g., "OGN-253-1 OGN-004-1")
 * @returns Parse result with codes and warnings
 * 
 * @example
 * const result = parseTTSCodes("OGN-253-1 OGN-004-1");
 * // result.codes.length === 2
 * // result.codes[0].imageUrl === "https://riftmana.com/.../OGN-253.webp"
 */
export function parseTTSCodes(input: string): TTSParseResult {
  const trimmed = input.trim();
  
  if (trimmed.length === 0) {
    return { codes: [], warnings: [], totalFound: 0 };
  }
  
  // Split on whitespace, filter empty strings
  const rawCodes = trimmed.split(/\s+/).filter(code => code.length > 0);
  
  const codes: TTSCardCode[] = [];
  const warnings: string[] = [];
  
  for (const raw of rawCodes) {
    // Validate format
    if (!TTS_CODE_PATTERN.test(raw)) {
      warnings.push(`Invalid code format: "${raw}". Expected SET-NUMBER-QUANTITY (e.g., OGN-253-1)`);
      continue;
    }
    
    // Parse components
    const lastHyphenIndex = raw.lastIndexOf('-');
    const imageCode = raw.substring(0, lastHyphenIndex);
    const quantity = raw.substring(lastHyphenIndex + 1);
    
    // Split image code into set and number
    const firstHyphenIndex = imageCode.indexOf('-');
    const set = imageCode.substring(0, firstHyphenIndex);
    const number = imageCode.substring(firstHyphenIndex + 1);
    
    // Construct image URL
    const imageUrl = `${TTS_IMAGE_BASE_URL}${imageCode}.webp`;
    
    codes.push({
      raw,
      set,
      number,
      quantity,
      imageCode,
      imageUrl,
    });
  }
  
  return {
    codes,
    warnings,
    totalFound: rawCodes.length,
  };
}
```

**Why**: Separates parsing logic from UI, makes testing easier.

**Verify**: Test with sample input:
```typescript
const result = parseTTSCodes("OGN-253-1 OGN-004-1 INVALID");
// result.codes.length === 2
// result.warnings.length === 1
```

---

## Step 5: Implement JSON Parser

Create the JSON format parser with Zod validation.

**File**: `app/lib/utils/parsers/json-parser.ts`

```typescript
import { z } from 'zod';
import type { JSONDeckData, CardMetadata } from '@/app/lib/types/deck-import';

// Define Zod schemas
const CardMetadataSchema = z.record(z.unknown());

const JSONCardSchema = z.object({
  id: z.string().min(1, 'Card ID is required'),
  name: z.string().min(1, 'Card name is required'),
  metadata: CardMetadataSchema.optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

const JSONDeckSchema = z.object({
  name: z.string().min(1, 'Deck name is required'),
  cards: z.array(JSONCardSchema).min(1, 'Deck must contain at least one card'),
});

/**
 * Parse and validate JSON deck import.
 * 
 * @param input - Raw JSON string from textarea
 * @returns Validated deck data
 * 
 * @throws {SyntaxError} If JSON is malformed
 * @throws {z.ZodError} If JSON doesn't match schema
 * 
 * @example
 * const deck = parseJSONDeck('{"name": "My Deck", "cards": [...]}');
 * // deck.cards[0].name === "Fire Mage"
 */
export function parseJSONDeck(input: string): JSONDeckData {
  // First, parse JSON syntax
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new SyntaxError(`Invalid JSON: ${error.message}`);
    }
    throw error;
  }
  
  // Then, validate against schema
  return JSONDeckSchema.parse(parsed);
}

/**
 * Export Zod schemas for testing
 */
export { JSONDeckSchema, JSONCardSchema };
```

**Why**: Zod provides robust validation with detailed error messages.

**Verify**: Test with sample JSON:
```typescript
const deck = parseJSONDeck('{"name": "Test", "cards": [{"id": "1", "name": "Card"}]}');
// deck.cards.length === 1

// Test error handling:
try {
  parseJSONDeck('invalid json');
} catch (error) {
  // error.message includes helpful details
}
```

---

## Step 6: Implement Validation Logic

Create the unified validation function.

**File**: `app/lib/utils/validators/import-validator.ts`

```typescript
import { parseTTSCodes } from '../parsers/tts-parser';
import { parseJSONDeck } from '../parsers/json-parser';
import type {
  ImportFormat,
  ImportValidationResult,
  ValidationMessage,
} from '@/app/lib/types/deck-import';
import { ZodError } from 'zod';

/**
 * Validate import input for either format.
 * 
 * @param format - Which format to validate (tts or json)
 * @param input - Raw input string from textarea
 * @returns Validation result with messages and parsed data
 * 
 * @example
 * const result = validateImport('tts', 'OGN-253-1 OGN-004-1');
 * if (result.valid) {
 *   // result.data is TTSParseResult
 *   // result.cardCount === 2
 * }
 */
export function validateImport(
  format: ImportFormat,
  input: string
): ImportValidationResult {
  const messages: ValidationMessage[] = [];
  
  // Check for empty input
  if (input.trim().length === 0) {
    return {
      valid: false,
      format,
      cardCount: 0,
      messages: [{
        severity: 'error',
        message: format === 'tts'
          ? 'Please enter TTS card codes (e.g., OGN-253-1 OGN-004-1)'
          : 'Please enter JSON deck data',
      }],
    };
  }
  
  // Check file size
  const sizeBytes = new Blob([input]).size;
  if (sizeBytes > 5 * 1024 * 1024) {
    return {
      valid: false,
      format,
      cardCount: 0,
      messages: [{
        severity: 'error',
        message: `Input too large (${(sizeBytes / 1024 / 1024).toFixed(1)}MB). Maximum is 5MB.`,
      }],
    };
  }
  
  if (format === 'tts') {
    return validateTTS(input);
  } else {
    return validateJSON(input);
  }
}

function validateTTS(input: string): ImportValidationResult {
  const result = parseTTSCodes(input);
  const messages: ValidationMessage[] = [];
  
  // Add warnings as validation messages
  for (const warning of result.warnings) {
    messages.push({
      severity: 'warning',
      message: warning,
    });
  }
  
  // Check if any valid codes found
  if (result.codes.length === 0) {
    messages.push({
      severity: 'error',
      message: 'No valid TTS card codes found. Expected format: SET-NUMBER-QUANTITY',
    });
    
    return {
      valid: false,
      format: 'tts',
      cardCount: 0,
      messages,
    };
  }
  
  // Success
  if (result.codes.length !== result.totalFound) {
    messages.push({
      severity: 'info',
      message: `Found ${result.codes.length} valid cards (${result.totalFound - result.codes.length} invalid codes skipped)`,
    });
  }
  
  return {
    valid: true,
    format: 'tts',
    cardCount: result.codes.length,
    messages,
    data: result,
  };
}

function validateJSON(input: string): ImportValidationResult {
  const messages: ValidationMessage[] = [];
  
  try {
    const deck = parseJSONDeck(input);
    
    return {
      valid: true,
      format: 'json',
      cardCount: deck.cards.length,
      messages: [{
        severity: 'info',
        message: `Valid deck: "${deck.name}" with ${deck.cards.length} cards`,
      }],
      data: deck,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      messages.push({
        severity: 'error',
        message: error.message,
      });
    } else if (error instanceof ZodError) {
      // Convert Zod errors to validation messages
      for (const issue of error.issues) {
        messages.push({
          severity: 'error',
          message: issue.message,
          path: issue.path.join('.'),
        });
      }
    } else {
      messages.push({
        severity: 'error',
        message: 'Unknown validation error',
      });
    }
    
    return {
      valid: false,
      format: 'json',
      cardCount: 0,
      messages,
    };
  }
}
```

**Why**: Centralizes validation logic with consistent error handling.

**Verify**: Test both formats with valid and invalid inputs.

---

## Step 7: Implement Card Transformer

Create the utility to transform parsed data into Card objects.

**File**: `app/lib/utils/deck.ts` (extend existing file)

```typescript
import { v4 as uuidv4 } from 'uuid';
import type { Card } from '../types/game';
import type {
  TTSParseResult,
  JSONDeckData,
  ImportFormat,
  ImportCardExtensions,
} from '../types/deck-import';
import { isTTSParseResult } from '../types/deck-import';

/**
 * Transform parsed import data into Card objects.
 * 
 * @param data - Parsed TTS or JSON data
 * @param format - Which format the data came from
 * @returns Array of Card objects ready for game state
 */
export function transformImportToCards(
  data: TTSParseResult | JSONDeckData,
  format: ImportFormat
): Array<Card & ImportCardExtensions> {
  const now = new Date();
  
  if (isTTSParseResult(data)) {
    return data.codes.map(code => ({
      id: uuidv4(),
      imageUrl: code.imageUrl,
      importSource: 'tts' as const,
      ttsCode: code.raw,
      importedAt: now,
    }));
  } else {
    return data.cards.map(card => ({
      id: uuidv4(),
      name: card.name,
      imageUrl: card.imageUrl,
      metadata: card.metadata,
      importSource: 'json' as const,
      jsonId: card.id,
      importedAt: now,
    }));
  }
}
```

**Why**: Separates transformation logic, maintains type safety.

**Verify**: Transform parsed data and check Card objects have all required fields.

---

## Step 8: Update DeckImport Component

Enhance the existing DeckImport component with format selection.

**File**: `app/components/game/DeckImport.tsx`

```typescript
'use client';

import { useState, useMemo } from 'react';
import { validateImport } from '@/app/lib/utils/validators/import-validator';
import { transformImportToCards } from '@/app/lib/utils/deck';
import type {
  ImportFormat,
  DeckImportState,
} from '@/app/lib/types/deck-import';
import { Button } from '../ui/Button';

interface DeckImportProps {
  onImport: (cards: Array<Card & ImportCardExtensions>) => void;
  disabled?: boolean;
  className?: string;
}

export function DeckImport({ onImport, disabled, className }: DeckImportProps) {
  const [state, setState] = useState<DeckImportState>({
    format: 'tts',
    ttsInput: '',
    jsonInput: '',
    validation: null,
    isImporting: false,
  });
  
  const currentInput = state.format === 'tts' ? state.ttsInput : state.jsonInput;
  
  // Validate on input change
  const validation = useMemo(() => {
    if (currentInput.trim().length === 0) {
      return null;
    }
    return validateImport(state.format, currentInput);
  }, [state.format, currentInput]);
  
  const handleFormatChange = (format: ImportFormat) => {
    setState(prev => ({ ...prev, format }));
  };
  
  const handleInputChange = (value: string) => {
    setState(prev => ({
      ...prev,
      [prev.format === 'tts' ? 'ttsInput' : 'jsonInput']: value,
    }));
  };
  
  const handleImport = () => {
    if (!validation || !validation.valid || !validation.data) {
      return;
    }
    
    setState(prev => ({ ...prev, isImporting: true }));
    
    try {
      const cards = transformImportToCards(validation.data, state.format);
      onImport(cards);
      
      // Clear input after successful import
      setState(prev => ({
        ...prev,
        [prev.format === 'tts' ? 'ttsInput' : 'jsonInput']: '',
        isImporting: false,
      }));
    } catch (error) {
      console.error('Import failed:', error);
      setState(prev => ({ ...prev, isImporting: false }));
    }
  };
  
  return (
    <div className={className}>
      {/* Format selector */}
      <div role="radiogroup" aria-label="Import format selection" className="mb-4">
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="format"
            value="tts"
            checked={state.format === 'tts'}
            onChange={() => handleFormatChange('tts')}
            disabled={disabled}
            className="sr-only"
          />
          <span className={`
            px-4 py-2 rounded-l-lg border cursor-pointer transition-colors
            ${state.format === 'tts'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }
          `}>
            TTS Format
          </span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="format"
            value="json"
            checked={state.format === 'json'}
            onChange={() => handleFormatChange('json')}
            disabled={disabled}
            className="sr-only"
          />
          <span className={`
            px-4 py-2 rounded-r-lg border-y border-r cursor-pointer transition-colors
            ${state.format === 'json'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }
          `}>
            JSON Format
          </span>
        </label>
      </div>
      
      {/* Textarea */}
      <textarea
        value={currentInput}
        onChange={(e) => handleInputChange(e.target.value)}
        disabled={disabled || state.isImporting}
        placeholder={
          state.format === 'tts'
            ? 'Enter TTS card codes (e.g., OGN-253-1 OGN-004-1 OGN-009-1)'
            : 'Paste JSON deck data here...'
        }
        className="w-full h-32 p-3 border rounded-lg font-mono text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label={`${state.format === 'tts' ? 'TTS' : 'JSON'} import input`}
      />
      
      {/* Validation messages */}
      {validation && (
        <div className="mt-2 space-y-1">
          {validation.messages.map((msg, idx) => (
            <div
              key={idx}
              className={`text-sm ${
                msg.severity === 'error'
                  ? 'text-red-600 dark:text-red-400'
                  : msg.severity === 'warning'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              {msg.path && <span className="font-mono">[{msg.path}] </span>}
              {msg.message}
            </div>
          ))}
        </div>
      )}
      
      {/* Import button */}
      <Button
        onClick={handleImport}
        disabled={disabled || !validation?.valid || state.isImporting}
        className="mt-4"
      >
        {state.isImporting ? 'Importing...' : `Import ${validation?.cardCount || 0} Cards`}
      </Button>
    </div>
  );
}
```

**Why**: Provides complete UI with format selection, validation, and import.

**Verify**: Component renders correctly, format switching works, validation shows messages.

---

## Step 9: Integrate with Game State

Connect the DeckImport component to the game state.

**File**: `app/game/page.tsx` (or wherever DeckImport is used)

```typescript
'use client';

import { DeckImport } from '../components/game/DeckImport';
import { useGameState } from '../lib/hooks/useGameState';

export default function GamePage() {
  const { addCardsToDeck } = useGameState();
  
  const handleImport = (cards) => {
    addCardsToDeck(cards);
    // Optionally show success message
    console.log(`Imported ${cards.length} cards`);
  };
  
  return (
    <div>
      {/* Existing game components */}
      
      <DeckImport onImport={handleImport} />
    </div>
  );
}
```

**File**: `app/lib/hooks/useGameState.ts` (extend existing hook)

```typescript
// Add to existing hook:

export function useGameState() {
  // ... existing state ...
  
  const addCardsToDeck = useCallback((cards: Card[]) => {
    setDeck(prev => [...prev, ...cards]);
  }, []);
  
  return {
    // ... existing returns ...
    addCardsToDeck,
  };
}
```

**Why**: Completes the data flow from import to game state.

**Verify**: Imported cards appear in deck, can be drawn and played.

---

## Testing Checklist

### TTS Format Testing

- [ ] Valid single card: "OGN-253-1"
- [ ] Multiple cards: "OGN-253-1 OGN-004-1 OGN-009-1"
- [ ] Duplicate cards: "OGN-009-1 OGN-009-1"
- [ ] Extra spaces: "OGN-253-1    OGN-004-1"
- [ ] Newlines: Cards separated by newlines
- [ ] Invalid code: Mixed valid/invalid codes
- [ ] Empty input: Shows appropriate error
- [ ] Multi-hyphen codes: "SET-SUB-123-1"

### JSON Format Testing

- [ ] Valid sample-deck.json: Paste existing sample file
- [ ] Single card deck: Minimal valid JSON
- [ ] Missing required field: Triggers validation error
- [ ] Invalid JSON syntax: Shows clear error message
- [ ] Empty cards array: Validation catches it
- [ ] Optional imageUrl: Works with and without
- [ ] Large deck: 100+ cards imports successfully

### UI Testing

- [ ] Format switching: Content preserved when switching
- [ ] Validation messages: Show immediately on input
- [ ] Import button: Disabled when invalid
- [ ] Dark mode: All components styled correctly
- [ ] Keyboard navigation: Tab through controls, arrow keys for radio
- [ ] Responsive: Works on mobile/tablet/desktop
- [ ] Loading state: Shows "Importing..." during import

### Integration Testing

- [ ] Cards added to deck: Appear in deck component
- [ ] Cards can be drawn: Click deck draws imported cards
- [ ] Cards can be played: Play imported card to playfield
- [ ] Session persistence: Imported cards survive refresh
- [ ] Multiple imports: Can import multiple times
- [ ] Clear after import: Textarea clears on success

---

## Performance Verification

### Benchmarks to Check

```typescript
// Add performance logging:
console.time('TTS Parse 100 cards');
const result = parseTTSCodes(/* 100 cards */);
console.timeEnd('TTS Parse 100 cards');
// Expected: <15ms

console.time('JSON Parse 100 cards');
const deck = parseJSONDeck(/* 100 cards JSON */);
console.timeEnd('JSON Parse 100 cards');
// Expected: <10ms

console.time('Transform 100 cards');
const cards = transformImportToCards(result, 'tts');
console.timeEnd('Transform 100 cards');
// Expected: <5ms
```

### Success Criteria Verification

- [ ] **SC-001**: 5-card TTS import completes in <10 seconds ✓ (should be <1s)
- [ ] **SC-002**: TTS parser processes 100% of valid codes ✓
- [ ] **SC-003**: Card images load within 3 seconds ✓ (network dependent)
- [ ] **SC-004**: Validation feedback appears <1 second ✓ (synchronous)
- [ ] **SC-005**: Keyboard navigation works ✓
- [ ] **SC-006**: Consistent styling with design system ✓
- [ ] **SC-007**: Duplicate cards handled correctly ✓
- [ ] **SC-008**: Works in light and dark modes ✓

---

## Troubleshooting

### Common Issues

**Issue**: TypeScript errors about Card type
- **Fix**: Ensure Card type is properly imported from `@/app/lib/types/game`

**Issue**: Zod validation errors not showing
- **Fix**: Check that ZodError is properly caught in validateJSON()

**Issue**: Images not loading (404 errors)
- **Fix**: Verify TTS URL construction, check riftmana.com availability

**Issue**: Format switching clears input
- **Fix**: Ensure separate state variables (ttsInput, jsonInput) are used

**Issue**: Import button stays disabled
- **Fix**: Check validation.valid condition, inspect validation result

---

## Next Steps

After completing implementation:

1. **Manual Testing**: Go through entire testing checklist
2. **Performance Testing**: Verify benchmarks with console.time()
3. **Constitution Check**: Re-verify all 4 core principles
4. **Documentation**: Update README if needed
5. **Phase 2**: Run `/speckit.tasks` to generate implementation tasks

---

## Support

If issues arise during implementation:

1. Check TypeScript errors first (most issues are type-related)
2. Review contracts file for correct type definitions
3. Test parsers independently before integration
4. Use browser DevTools to debug validation logic
5. Check console for performance metrics and warnings

**Remember**: All imports are temporary (session-only, not persisted to database per FR-014).
