/**
 * TTS (Tabletop Simulator) Deck Parser
 * 
 * Parses TTS format: space or newline-separated card codes like "OGN-253-1"
 * where OGN = set code, 253 = card number, 1 = quantity/variant.
 * 
 * @module tts-parser
 */

import { 
  TTSCardCode, 
  TTSParseResult, 
  TTS_CODE_PATTERN,
  TTS_IMAGE_BASE_URL,
  MAX_IMPORT_SIZE_BYTES 
} from '@/app/lib/types/deck-import';

/**
 * Parses a TTS format deck string into structured card codes.
 * 
 * Algorithm:
 * 1. Validate input size to prevent DoS
 * 2. Split on newlines and spaces, trim whitespace
 * 3. Filter empty tokens
 * 4. Validate each code against TTS_CODE_PATTERN
 * 5. Parse valid codes into structured format
 * 6. Collect warnings for invalid codes
 * 
 * @param input - Raw TTS deck string (space or newline-separated codes)
 * @returns Parse result with valid cards and warnings
 * 
 * @example
 * ```typescript
 * const result = parseTTSDeck("OGN-253-1 OGN-254-1");
 * // result.codes.length === 2
 * ```
 */
export function parseTTSDeck(input: string): TTSParseResult {
  const codes: TTSCardCode[] = [];
  const warnings: string[] = [];

  // Validate input size
  const inputSizeBytes = new Blob([input]).size;
  if (inputSizeBytes > MAX_IMPORT_SIZE_BYTES) {
    warnings.push(
      `Input size (${(inputSizeBytes / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (${MAX_IMPORT_SIZE_BYTES / 1024 / 1024}MB)`
    );
    return { codes: [], warnings, totalFound: 0 };
  }

  // Split on both newlines AND spaces, then filter empty tokens
  const tokens = input
    .split(/[\s\n]+/)
    .map(token => token.trim())
    .filter(token => token !== '');
  
  tokens.forEach((token, index) => {
    // Validate format
    if (!TTS_CODE_PATTERN.test(token)) {
      warnings.push(
        `Token ${index + 1}: Invalid TTS code format "${token}". Expected format: SET-NUMBER-QUANTITY (e.g., OGN-253-1)`
      );
      return;
    }

    // Parse code components
    const parts = token.split('-');
    const set = parts[0];
    const number = parts[1];
    const quantity = parts[2];
    const imageCode = `${set}-${number}`;

    // Construct card code
    const code: TTSCardCode = {
      raw: token,
      set,
      number,
      quantity,
      imageCode,
      imageUrl: `${TTS_IMAGE_BASE_URL}${imageCode}.jpg`
    };

    codes.push(code);
  });

  return {
    codes,
    warnings,
    totalFound: tokens.length
  };
}

/**
 * Validates a single TTS code string.
 * 
 * @param code - TTS code to validate
 * @returns True if code matches TTS_CODE_PATTERN
 * 
 * @example
 * ```typescript
 * validateTTSCode("AAI-1-001") // true
 * validateTTSCode("invalid") // false
 * ```
 */
export function validateTTSCode(code: string): boolean {
  return TTS_CODE_PATTERN.test(code.trim());
}

/**
 * Extracts components from a valid TTS code.
 * 
 * @param code - Valid TTS code string
 * @returns Parsed components or null if invalid
 * 
 * @example
 * ```typescript
 * const parts = extractTTSComponents("OGN-253-1");
 * // parts = { set: "OGN", number: "253", quantity: "1" }
 * ```
 */
export function extractTTSComponents(code: string): {
  set: string;
  number: string;
  quantity: string;
  imageCode: string;
} | null {
  if (!validateTTSCode(code)) {
    return null;
  }

  const parts = code.trim().split('-');
  const set = parts[0];
  const number = parts[1];
  const quantity = parts[2];
  const imageCode = `${set}-${number}`;
  
  return { set, number, quantity, imageCode };
}

/**
 * Constructs image URL for a TTS card code.
 * 
 * @param code - TTS card code (with or without quantity)
 * @returns Full image URL
 * 
 * @example
 * ```typescript
 * const url = constructTTSImageUrl("OGN-253-1");
 * // url = "https://riftmana.com/wp-content/uploads/Cards/OGN-253.jpg"
 * ```
 */
export function constructTTSImageUrl(code: string): string {
  const components = extractTTSComponents(code);
  if (!components) {
    return '';
  }
  return `${TTS_IMAGE_BASE_URL}${components.imageCode}.jpg`;
}

/**
 * Counts total cards in a TTS deck string (including invalid codes).
 * 
 * @param input - Raw TTS deck string
 * @returns Total non-empty lines
 */
export function countTTSCards(input: string): number {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
    .length;
}
