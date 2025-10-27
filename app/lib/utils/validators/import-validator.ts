/**
 * Import Validator
 * 
 * Unified validation for both TTS and JSON import formats.
 * Coordinates with format-specific parsers and produces ImportValidationResult.
 * 
 * @module import-validator
 */

import { parseTTSDeck } from '../parsers/tts-parser';
import { parseJSONDeck } from '../parsers/json-parser';
import {
  ImportFormat,
  ImportValidationResult,
  ValidationMessage,
  TTSParseResult,
  JSONDeckData
} from '@/app/lib/types/deck-import';

/**
 * Validates import input for the specified format.
 * 
 * Routes to appropriate parser and normalizes result into ImportValidationResult.
 * 
 * @param input - Raw import string (TTS codes or JSON)
 * @param format - Target import format
 * @returns Validation result with messages and parsed data
 * 
 * @example
 * ```typescript
 * const result = validateImport("OGN-253-1\nOGN-254-1", 'tts');
 * // result.valid === true
 * // result.cardCount === 2
 * ```
 */
export function validateImport(
  input: string,
  format: ImportFormat
): ImportValidationResult {
  // Validate input is not empty
  if (!input || input.trim() === '') {
    return {
      valid: false,
      format,
      cardCount: 0,
      messages: [{
        severity: 'error',
        message: 'Import input cannot be empty'
      }]
    };
  }

  // Route to format-specific validation
  if (format === 'tts') {
    return validateTTSImport(input);
  } else {
    return validateJSONImport(input);
  }
}

/**
 * Validates TTS format import.
 * 
 * @param input - Raw TTS codes (newline-separated)
 * @returns Validation result
 */
function validateTTSImport(input: string): ImportValidationResult {
  const parseResult = parseTTSDeck(input);
  const messages: ValidationMessage[] = [];

  // Convert warnings to validation messages
  parseResult.warnings.forEach(warning => {
    messages.push({
      severity: 'warning',
      message: warning
    });
  });

  // Check if any valid cards found
  const hasValidCards = parseResult.codes.length > 0;
  const allLinesFailed = parseResult.totalFound > 0 && parseResult.codes.length === 0;

  if (allLinesFailed) {
    messages.push({
      severity: 'error',
      message: 'No valid TTS codes found. All lines failed validation.'
    });
  }

  // Add info message about successful cards
  if (hasValidCards) {
    messages.push({
      severity: 'info',
      message: `Successfully parsed ${parseResult.codes.length} of ${parseResult.totalFound} cards`
    });
  }

  return {
    valid: hasValidCards,
    format: 'tts',
    cardCount: parseResult.codes.length,
    messages,
    data: parseResult
  };
}

/**
 * Validates JSON format import.
 * 
 * @param input - Raw JSON string
 * @returns Validation result
 */
function validateJSONImport(input: string): ImportValidationResult {
  const parseResult = parseJSONDeck(input);
  const messages: ValidationMessage[] = [];

  // Convert errors to validation messages
  parseResult.errors.forEach(error => {
    messages.push({
      severity: 'error',
      message: error
    });
  });

  // Add success message if valid
  if (parseResult.deck) {
    messages.push({
      severity: 'info',
      message: `Successfully parsed deck "${parseResult.deck.name}" with ${parseResult.deck.cards.length} cards`
    });
  }

  return {
    valid: parseResult.deck !== null,
    format: 'json',
    cardCount: parseResult.deck?.cards.length ?? 0,
    messages,
    data: parseResult.deck ?? undefined
  };
}

/**
 * Checks if validation result has errors (not just warnings).
 * 
 * @param result - Validation result to check
 * @returns True if errors present
 */
export function hasErrors(result: ImportValidationResult): boolean {
  return result.messages.some(msg => msg.severity === 'error');
}

/**
 * Checks if validation result has warnings.
 * 
 * @param result - Validation result to check
 * @returns True if warnings present
 */
export function hasWarnings(result: ImportValidationResult): boolean {
  return result.messages.some(msg => msg.severity === 'warning');
}

/**
 * Filters validation messages by severity.
 * 
 * @param result - Validation result
 * @param severity - Severity level to filter
 * @returns Filtered messages
 */
export function getMessagesBySeverity(
  result: ImportValidationResult,
  severity: 'error' | 'warning' | 'info'
): ValidationMessage[] {
  return result.messages.filter(msg => msg.severity === severity);
}

/**
 * Formats validation messages for display.
 * 
 * @param messages - Messages to format
 * @returns Formatted string with one message per line
 */
export function formatValidationMessages(messages: ValidationMessage[]): string {
  return messages
    .map(msg => `[${msg.severity.toUpperCase()}] ${msg.message}`)
    .join('\n');
}

/**
 * Creates a success validation result (for testing).
 * 
 * @param format - Import format
 * @param cardCount - Number of cards
 * @param data - Parsed data
 * @returns Valid result
 */
export function createSuccessResult(
  format: ImportFormat,
  cardCount: number,
  data: TTSParseResult | JSONDeckData
): ImportValidationResult {
  return {
    valid: true,
    format,
    cardCount,
    messages: [{
      severity: 'info',
      message: `Successfully validated ${cardCount} cards`
    }],
    data
  };
}

/**
 * Creates an error validation result (for testing).
 * 
 * @param format - Import format
 * @param errorMessage - Error message
 * @returns Invalid result
 */
export function createErrorResult(
  format: ImportFormat,
  errorMessage: string
): ImportValidationResult {
  return {
    valid: false,
    format,
    cardCount: 0,
    messages: [{
      severity: 'error',
      message: errorMessage
    }]
  };
}
