/**
 * Deck Utilities
 * 
 * Functions for generating test decks and validating deck imports.
 * 
 * @module utils/deck
 */

import { v4 as uuidv4 } from 'uuid';
import type { Card, DeckImport, DeckImportValidation } from '../types/game';
import { DECK_IMPORT_CONSTRAINTS, DEFAULT_TEST_DECK_SIZE } from '../types/game';

/**
 * Generates a test deck with the specified number of cards.
 * Each card has a unique ID and sequential name.
 * 
 * @param count - Number of cards to generate (default: 20)
 * @returns Array of Card objects
 * 
 * @example
 * const testDeck = generateTestDeck(20);
 * // Returns: [{ id: "uuid-1", name: "Card 1" }, { id: "uuid-2", name: "Card 2" }, ...]
 */
export function generateTestDeck(count: number = DEFAULT_TEST_DECK_SIZE): Card[] {
  const cards: Card[] = [];
  
  for (let i = 1; i <= count; i++) {
    cards.push({
      id: uuidv4(),
      name: `Card ${i}`,
      metadata: {
        testCard: true,
        index: i,
      },
    });
  }
  
  return cards;
}

/**
 * Validates a deck import JSON structure.
 * Checks for required fields, valid data types, and constraint compliance.
 * 
 * @param deckImport - The deck import object to validate
 * @returns Validation result with errors and warnings
 * 
 * @example
 * const validation = validateDeckImport(importedDeck);
 * if (!validation.valid) {
 *   console.error('Validation errors:', validation.errors);
 * }
 */
export function validateDeckImport(deckImport: unknown): DeckImportValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if input is an object
  if (typeof deckImport !== 'object' || deckImport === null) {
    return {
      valid: false,
      errors: ['Deck import must be a valid JSON object'],
      warnings: [],
    };
  }
  
  const deck = deckImport as Record<string, unknown>;
  
  // Validate deck name
  if (typeof deck.name !== 'string') {
    errors.push('Deck name is required and must be a string');
  } else if (deck.name.trim() === '') {
    errors.push('Deck name cannot be empty');
  }
  
  // Validate cards array
  if (!Array.isArray(deck.cards)) {
    errors.push('Cards must be an array');
    return { valid: false, errors, warnings };
  }
  
  const cards = deck.cards as unknown[];
  
  // Check card count constraints
  if (cards.length < DECK_IMPORT_CONSTRAINTS.MIN_CARDS) {
    errors.push(`Deck must contain at least ${DECK_IMPORT_CONSTRAINTS.MIN_CARDS} card(s)`);
  }
  
  if (cards.length > DECK_IMPORT_CONSTRAINTS.MAX_CARDS) {
    errors.push(`Deck cannot contain more than ${DECK_IMPORT_CONSTRAINTS.MAX_CARDS} cards`);
  }
  
  // Validate each card
  const cardIds = new Set<string>();
  
  cards.forEach((card, index) => {
    if (typeof card !== 'object' || card === null) {
      errors.push(`Card at index ${index} must be an object`);
      return;
    }
    
    const cardObj = card as Record<string, unknown>;
    
    // Validate card ID
    if (typeof cardObj.id !== 'string') {
      errors.push(`Card at index ${index} must have an 'id' (string)`);
    } else if (cardObj.id.trim() === '') {
      errors.push(`Card at index ${index} has an empty 'id'`);
    } else if (cardIds.has(cardObj.id)) {
      errors.push(`Duplicate card ID found: ${cardObj.id}`);
    } else {
      cardIds.add(cardObj.id);
    }
    
    // Validate card name
    if (typeof cardObj.name !== 'string') {
      errors.push(`Card at index ${index} must have a 'name' (string)`);
    } else if (cardObj.name.trim() === '') {
      errors.push(`Card at index ${index} has an empty 'name'`);
    } else if (cardObj.name.length > DECK_IMPORT_CONSTRAINTS.MAX_CARD_NAME_LENGTH) {
      errors.push(
        `Card at index ${index} name exceeds maximum length of ${DECK_IMPORT_CONSTRAINTS.MAX_CARD_NAME_LENGTH} characters`
      );
    }
    
    // Validate optional imageUrl
    if (cardObj.imageUrl !== undefined && typeof cardObj.imageUrl !== 'string') {
      errors.push(`Card at index ${index} 'imageUrl' must be a string if provided`);
    }
    
    // Validate optional metadata
    if (cardObj.metadata !== undefined) {
      if (typeof cardObj.metadata !== 'object' || Array.isArray(cardObj.metadata)) {
        errors.push(`Card at index ${index} 'metadata' must be an object if provided`);
      }
    }
  });
  
  // Add warnings for large decks
  if (cards.length > 100) {
    warnings.push('Large deck detected (>100 cards). Performance may be affected.');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Parses and validates a deck import, returning a typed DeckImport object.
 * 
 * @param json - The JSON string to parse
 * @returns Validated DeckImport object or null if invalid
 * @throws Error if JSON parsing fails
 * 
 * @example
 * try {
 *   const deck = parseDeckImport(jsonString);
 *   if (deck) {
 *     console.log('Deck imported:', deck.name);
 *   }
 * } catch (error) {
 *   console.error('Invalid JSON:', error);
 * }
 */
export function parseDeckImport(json: string): DeckImport | null {
  const parsed = JSON.parse(json);
  const validation = validateDeckImport(parsed);
  
  if (!validation.valid) {
    throw new Error(`Invalid deck import: ${validation.errors.join(', ')}`);
  }
  
  return parsed as DeckImport;
}

/**
 * Calculates the estimated file size of a deck import in bytes.
 * Used for validation before upload.
 * 
 * @param deckImport - The deck import object
 * @returns Estimated size in bytes
 */
export function estimateDeckSize(deckImport: DeckImport): number {
  const json = JSON.stringify(deckImport);
  return new Blob([json]).size;
}

/**
 * Checks if a file size is within the allowed limit.
 * 
 * @param sizeInBytes - File size in bytes
 * @returns True if size is valid, false otherwise
 */
export function isValidFileSize(sizeInBytes: number): boolean {
  const maxSizeInBytes = DECK_IMPORT_CONSTRAINTS.MAX_FILE_SIZE_MB * 1024 * 1024;
  return sizeInBytes <= maxSizeInBytes;
}
