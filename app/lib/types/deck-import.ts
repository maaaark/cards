/**
 * Deck Import Formats - TypeScript Type Definitions
 * 
 * This file defines all TypeScript interfaces and types for the deck import feature.
 * These types ensure type safety across parsing, validation, and transformation logic.
 * 
 * Feature: 002-deck-import-formats
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Available deck import formats.
 */
export type ImportFormat = 'tts' | 'json';

/**
 * Base URL for TTS card images on riftmana.com
 */
export const TTS_IMAGE_BASE_URL = 'https://riftmana.com/wp-content/uploads/Cards/';

/**
 * Regex pattern for valid TTS card codes.
 * Format: SET-NUMBER-QUANTITY (e.g., "OGN-253-1")
 */
export const TTS_CODE_PATTERN = /^[A-Z0-9]+-[0-9]+-[0-9]+$/;

/**
 * Maximum file size for imports (5MB).
 */
export const MAX_IMPORT_SIZE_BYTES = 5 * 1024 * 1024;

// ============================================================================
// TTS FORMAT TYPES
// ============================================================================

/**
 * Parsed TTS card code with all extracted components.
 */
export interface TTSCardCode {
  /** Original code as entered by user (e.g., "OGN-253-1") */
  raw: string;
  
  /** Card set identifier (e.g., "OGN") */
  set: string;
  
  /** Card number within set (e.g., "253") */
  number: string;
  
  /** Quantity suffix (e.g., "1") */
  quantity: string;
  
  /** Code without quantity suffix (e.g., "OGN-253") */
  imageCode: string;
  
  /** Fully constructed image URL */
  imageUrl: string;
}

/**
 * Result of parsing TTS input string.
 */
export interface TTSParseResult {
  /** Successfully parsed card codes */
  codes: TTSCardCode[];
  
  /** Error messages for invalid codes that were skipped */
  warnings: string[];
  
  /** Total number of codes found (including invalid) */
  totalFound: number;
}

// ============================================================================
// JSON FORMAT TYPES
// ============================================================================

/**
 * Card metadata from JSON import.
 */
export type CardMetadata = Record<string, unknown>;

/**
 * Single card definition in JSON import format.
 */
export interface JSONCardData {
  /** Unique identifier within JSON */
  id: string;
  
  /** Human-readable card name */
  name: string;
  
  /** Arbitrary card properties (type, power, cost, etc.) */
  metadata?: CardMetadata;
  
  /** Optional custom image URL */
  imageUrl?: string;
}

/**
 * Complete deck import structure for JSON format.
 */
export interface JSONDeckData {
  /** Deck name/title */
  name: string;
  
  /** Array of card definitions (minimum 1 required) */
  cards: JSONCardData[];
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Severity level for validation messages.
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Single validation message with context.
 */
export interface ValidationMessage {
  /** Severity of the message */
  severity: ValidationSeverity;
  
  /** Human-readable message */
  message: string;
  
  /** JSON path or code reference (e.g., "cards[2].name") */
  path?: string;
  
  /** Original value that caused the issue */
  value?: unknown;
}

/**
 * Result of validating import input.
 */
export interface ImportValidationResult {
  /** Whether input passed validation */
  valid: boolean;
  
  /** Which format was validated */
  format: ImportFormat;
  
  /** Number of valid cards found (0 if invalid) */
  cardCount: number;
  
  /** Detailed validation messages (errors, warnings, info) */
  messages: ValidationMessage[];
  
  /** Parsed data if validation succeeded */
  data?: TTSParseResult | JSONDeckData;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * UI state for the deck import component.
 */
export interface DeckImportState {
  /** Currently selected format */
  format: ImportFormat;
  
  /** Content of TTS textarea */
  ttsInput: string;
  
  /** Content of JSON textarea */
  jsonInput: string;
  
  /** Latest validation result */
  validation: ImportValidationResult | null;
  
  /** Whether import operation is in progress */
  isImporting: boolean;
}

// ============================================================================
// CARD EXTENSIONS
// ============================================================================

/**
 * Extended Card properties for import tracking.
 */
export interface ImportCardExtensions {
  /** Which format created this card */
  importSource?: 'tts' | 'json';
  
  /** Original TTS code (if from TTS import) */
  ttsCode?: string;
  
  /** Original JSON id (if from JSON import) */
  jsonId?: string;
  
  /** Timestamp when card was imported */
  importedAt?: Date;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if data is TTSParseResult.
 */
export function isTTSParseResult(
  data: TTSParseResult | JSONDeckData
): data is TTSParseResult {
  return 'codes' in data && Array.isArray((data as TTSParseResult).codes);
}

/**
 * Type guard to check if data is JSONDeckData.
 */
export function isJSONDeckData(
  data: TTSParseResult | JSONDeckData
): data is JSONDeckData {
  return 'name' in data && 'cards' in data && typeof (data as JSONDeckData).name === 'string';
}
