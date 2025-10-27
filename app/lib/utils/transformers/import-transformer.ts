/**
 * Import Transformer
 * 
 * Transforms parsed TTS and JSON data into unified Card[] arrays.
 * Handles ID generation, image URL construction, and import metadata.
 * 
 * @module import-transformer
 */

import { v4 as uuidv4 } from 'uuid';
import type { Card } from '@/app/lib/types/game';
import type {
  TTSParseResult,
  JSONDeckData,
  TTSCardCode,
  JSONCardData
} from '@/app/lib/types/deck-import';

/**
 * Transforms TTS parse result into Card array.
 * 
 * @param parseResult - Parsed TTS codes
 * @returns Array of Card objects with TTS metadata
 * 
 * @example
 * ```typescript
 * const cards = transformTTSToCards({
 *   codes: [{ raw: "OGN-253-1", ... }],
 *   warnings: [],
 *   totalFound: 1
 * });
 * // cards[0].importSource === 'tts'
 * ```
 */
export function transformTTSToCards(parseResult: TTSParseResult): Card[] {
  const now = new Date();
  
  return parseResult.codes.map(code => 
    transformTTSCodeToCard(code, now)
  );
}

/**
 * Transforms a single TTS code into a Card.
 * 
 * @param code - TTS card code
 * @param importedAt - Import timestamp
 * @returns Card object
 */
function transformTTSCodeToCard(code: TTSCardCode, importedAt: Date): Card {
  return {
    id: uuidv4(),
    name: generateCardNameFromTTS(code),
    imageUrl: code.imageUrl,
    metadata: {
      set: code.set,
      number: code.number,
      imageCode: code.imageCode
    },
    importSource: 'tts',
    ttsCode: code.raw,
    importedAt
  };
}

/**
 * Generates a human-readable card name from TTS code.
 * 
 * @param code - TTS card code
 * @returns Generated name (e.g., "OGN-253" or "Card OGN-253")
 */
function generateCardNameFromTTS(code: TTSCardCode): string {
  // Use imageCode (without quantity) as name
  return code.imageCode;
}

/**
 * Transforms JSON deck data into Card array.
 * 
 * @param deckData - Parsed JSON deck
 * @returns Array of Card objects with JSON metadata
 * 
 * @example
 * ```typescript
 * const cards = transformJSONToCards({
 *   name: "My Deck",
 *   cards: [{ id: "1", name: "Card 1" }]
 * });
 * // cards[0].importSource === 'json'
 * ```
 */
export function transformJSONToCards(deckData: JSONDeckData): Card[] {
  const now = new Date();
  
  return deckData.cards.map(cardData => 
    transformJSONCardToCard(cardData, now)
  );
}

/**
 * Transforms a single JSON card into a Card.
 * 
 * @param cardData - JSON card data
 * @param importedAt - Import timestamp
 * @returns Card object
 */
function transformJSONCardToCard(cardData: JSONCardData, importedAt: Date): Card {
  return {
    id: uuidv4(),
    name: cardData.name,
    imageUrl: cardData.imageUrl,
    metadata: cardData.metadata,
    importSource: 'json',
    jsonId: cardData.id,
    importedAt
  };
}

/**
 * Extracts deck name from parsed data.
 * 
 * @param data - Either TTS or JSON parsed data
 * @returns Deck name or default
 */
export function extractDeckName(data: TTSParseResult | JSONDeckData): string {
  if ('name' in data) {
    // JSON format has explicit name
    return data.name;
  } else {
    // TTS format: generate name from first card or use default
    if (data.codes.length > 0) {
      const firstSet = data.codes[0].set;
      return `TTS Deck (${firstSet})`;
    }
    return 'Imported TTS Deck';
  }
}

/**
 * Counts total cards from parsed data.
 * 
 * @param data - Either TTS or JSON parsed data
 * @returns Card count
 */
export function countCards(data: TTSParseResult | JSONDeckData): number {
  if ('cards' in data && Array.isArray(data.cards)) {
    // JSON format
    return data.cards.length;
  } else if ('codes' in data) {
    // TTS format
    return data.codes.length;
  }
  return 0;
}

/**
 * Transforms any valid parsed data to Cards.
 * Automatically detects format and routes to appropriate transformer.
 * 
 * @param data - Either TTS or JSON parsed data
 * @returns Card array
 */
export function transformToCards(data: TTSParseResult | JSONDeckData): Card[] {
  if ('codes' in data) {
    return transformTTSToCards(data);
  } else {
    return transformJSONToCards(data);
  }
}

/**
 * Validates that transformed cards are valid.
 * 
 * @param cards - Card array to validate
 * @returns True if all cards have required fields
 */
export function validateTransformedCards(cards: Card[]): boolean {
  return cards.every(card => 
    card.id && 
    card.name && 
    card.importSource &&
    card.importedAt
  );
}

/**
 * Filters duplicate cards by name (keeps first occurrence).
 * 
 * @param cards - Card array that may contain duplicates
 * @returns Deduplicated card array
 */
export function deduplicateCards(cards: Card[]): Card[] {
  const seen = new Set<string>();
  return cards.filter(card => {
    if (seen.has(card.name)) {
      return false;
    }
    seen.add(card.name);
    return true;
  });
}

/**
 * Sorts cards by name alphabetically.
 * 
 * @param cards - Card array to sort
 * @returns Sorted card array (new array)
 */
export function sortCardsByName(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => a.name.localeCompare(b.name));
}
