/**
 * JSON Deck Parser
 * 
 * Parses JSON format deck files matching sample-deck.json structure:
 * { name: string, cards: [...] }
 * 
 * @module json-parser
 */

import { z } from 'zod';
import { 
  JSONDeckData, 
  JSONCardData,
  MAX_IMPORT_SIZE_BYTES 
} from '@/app/lib/types/deck-import';

/**
 * Zod schema for validating JSON card data.
 */
const CardSchema = z.object({
  id: z.string().min(1, 'Card ID cannot be empty'),
  name: z.string().min(1, 'Card name cannot be empty'),
  metadata: z.record(z.string(), z.unknown()).optional(),
  imageUrl: z.string().url().optional().or(z.literal(''))
});

/**
 * Zod schema for validating complete JSON deck.
 */
const DeckSchema = z.object({
  name: z.string().min(1, 'Deck name cannot be empty'),
  cards: z.array(CardSchema).min(1, 'Deck must contain at least one card')
});

/**
 * Result of JSON parsing operation.
 */
export interface JSONParseResult {
  /** Successfully parsed deck data */
  deck: JSONDeckData | null;
  
  /** Error messages if parsing failed */
  errors: string[];
  
  /** Parsed input size in bytes */
  inputSizeBytes: number;
}

/**
 * Parses a JSON deck string into structured deck data.
 * 
 * Algorithm:
 * 1. Validate input size to prevent DoS
 * 2. Parse JSON string
 * 3. Validate against Zod schema
 * 4. Return structured deck or errors
 * 
 * @param input - Raw JSON string
 * @returns Parse result with deck or errors
 * 
 * @example
 * ```typescript
 * const json = '{"name":"Test","cards":[{"id":"1","name":"Card"}]}';
 * const result = parseJSONDeck(json);
 * // result.deck !== null
 * ```
 */
export function parseJSONDeck(input: string): JSONParseResult {
  const errors: string[] = [];
  
  // Validate input size
  const inputSizeBytes = new Blob([input]).size;
  if (inputSizeBytes > MAX_IMPORT_SIZE_BYTES) {
    errors.push(
      `Input size (${(inputSizeBytes / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (${MAX_IMPORT_SIZE_BYTES / 1024 / 1024}MB)`
    );
    return { deck: null, errors, inputSizeBytes };
  }

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    errors.push(
      error instanceof Error 
        ? `Invalid JSON: ${error.message}` 
        : 'Invalid JSON format'
    );
    return { deck: null, errors, inputSizeBytes };
  }

  // Validate with Zod schema
  const validation = DeckSchema.safeParse(parsed);
  
  if (!validation.success) {
    // Extract Zod validation errors
    validation.error.issues.forEach(err => {
      const path = err.path.join('.');
      errors.push(`${path}: ${err.message}`);
    });
    return { deck: null, errors, inputSizeBytes };
  }

  return {
    deck: validation.data as JSONDeckData,
    errors: [],
    inputSizeBytes
  };
}

/**
 * Validates JSON deck data structure without full parsing.
 * Quick check for basic structure compliance.
 * 
 * @param input - Raw JSON string
 * @returns True if basic structure is valid
 */
export function validateJSONStructure(input: string): boolean {
  try {
    const parsed = JSON.parse(input);
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'name' in parsed &&
      'cards' in parsed &&
      Array.isArray(parsed.cards)
    );
  } catch {
    return false;
  }
}

/**
 * Extracts deck name from JSON without full validation.
 * 
 * @param input - Raw JSON string
 * @returns Deck name or null if extraction fails
 */
export function extractDeckName(input: string): string | null {
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed === 'object' && parsed !== null && 'name' in parsed) {
      return String(parsed.name);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Counts cards in JSON deck without full validation.
 * 
 * @param input - Raw JSON string
 * @returns Card count or 0 if counting fails
 */
export function countJSONCards(input: string): number {
  try {
    const parsed = JSON.parse(input);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'cards' in parsed &&
      Array.isArray(parsed.cards)
    ) {
      return parsed.cards.length;
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Validates a single card object against schema.
 * 
 * @param card - Card object to validate
 * @returns True if card matches schema
 */
export function validateCard(card: unknown): card is JSONCardData {
  const result = CardSchema.safeParse(card);
  return result.success;
}

/**
 * Sanitizes JSON input by removing whitespace and normalizing.
 * 
 * @param input - Raw JSON string
 * @returns Sanitized JSON string or original if parsing fails
 */
export function sanitizeJSONInput(input: string): string {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
  } catch {
    return input.trim();
  }
}
