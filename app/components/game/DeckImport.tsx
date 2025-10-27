/**
 * DeckImport Component
 * 
 * Main UI component for deck importing functionality.
 * Supports TTS and JSON formats with real-time validation feedback.
 * 
 * @module components/game/DeckImport
 */

'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { validateImport } from '@/app/lib/utils/validators/import-validator';
import { transformToCards, extractDeckName } from '@/app/lib/utils/transformers/import-transformer';
import type { ImportFormat, DeckImportState } from '@/app/lib/types/deck-import';
import type { DeckImportProps } from '@/app/lib/types/game';

/**
 * DeckImport component for importing card decks.
 * 
 * Features:
 * - Format selection (TTS/JSON)
 * - Real-time validation
 * - Error/warning display
 * - Import confirmation
 * 
 * @example
 * ```tsx
 * <DeckImport onImport={(deck) => console.log(deck)} onError={console.error} />
 * ```
 */
export function DeckImport({ onImport, onError }: DeckImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<DeckImportState>({
    format: 'tts',
    ttsInput: '',
    jsonInput: '',
    validation: null,
    isImporting: false
  });

  /**
   * Handles format selection change.
   */
  const handleFormatChange = (newFormat: ImportFormat) => {
    setState(prev => ({
      ...prev,
      format: newFormat,
      validation: null // Clear validation when switching formats
    }));
  };

  /**
   * Handles input change for current format.
   */
  const handleInputChange = (value: string) => {
    if (state.format === 'tts') {
      setState(prev => ({ ...prev, ttsInput: value, validation: null }));
    } else {
      setState(prev => ({ ...prev, jsonInput: value, validation: null }));
    }
  };

  /**
   * Validates current input.
   */
  const handleValidate = () => {
    const input = state.format === 'tts' ? state.ttsInput : state.jsonInput;
    const validation = validateImport(input, state.format);
    
    setState(prev => ({ ...prev, validation }));
  };

  /**
   * Handles import action.
   */
  const handleImportClick = () => {
    const input = state.format === 'tts' ? state.ttsInput : state.jsonInput;
    const validation = validateImport(input, state.format);
    
    setState(prev => ({ ...prev, validation, isImporting: true }));

    if (!validation.valid || !validation.data) {
      setState(prev => ({ ...prev, isImporting: false }));
      if (onError) {
        onError('Validation failed. Please check errors above.');
      }
      return;
    }

    try {
      const cards = transformToCards(validation.data);
      const deckName = extractDeckName(validation.data);
      
      // Call onImport with DeckImport format expected by game
      onImport({
        name: deckName,
        cards: cards.map(card => ({
          id: card.id,
          name: card.name,
          imageUrl: card.imageUrl,
          metadata: card.metadata
        }))
      });
      
      // Clear input and close modal after successful import
      setState({
        format: 'tts',
        ttsInput: '',
        jsonInput: '',
        validation: null,
        isImporting: false
      });
      setIsOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        validation: {
          valid: false,
          format: state.format,
          cardCount: 0,
          messages: [{
            severity: 'error',
            message: `Import failed: ${errorMessage}`
          }]
        },
        isImporting: false
      }));
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  /**
   * Gets current input value.
   */
  const currentInput = state.format === 'tts' ? state.ttsInput : state.jsonInput;
  
  /**
   * Checks if import button should be enabled.
   */
  const canImport = currentInput.trim() !== '' && !state.isImporting;

  if (!isOpen) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        Import Deck
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Import Deck
          </h2>
          <button
            onClick={() => {
              setIsOpen(false);
              setState(prev => ({ ...prev, validation: null }));
            }}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            aria-label="Close"
            disabled={state.isImporting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Format Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-zinc-900 dark:text-zinc-100">Import Format</label>
          <div className="flex gap-2">
            <Button
              onClick={() => handleFormatChange('tts')}
              variant={state.format === 'tts' ? 'primary' : 'secondary'}
              disabled={state.isImporting}
              size="sm"
            >
              TTS Format
            </Button>
            <Button
              onClick={() => handleFormatChange('json')}
              variant={state.format === 'json' ? 'primary' : 'secondary'}
              disabled={state.isImporting}
              size="sm"
            >
              JSON Format
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100 mb-1">
            <strong>{state.format === 'tts' ? 'TTS Format:' : 'JSON Format:'}</strong>
          </p>
          <pre className="text-xs text-blue-800 dark:text-blue-200 overflow-x-auto">
{state.format === 'tts' 
  ? 'OGN-253-1 OGN-254-1 OGN-255-1\n(space or newline-separated)'
  : `{
  "name": "My Deck",
  "cards": [
    {"id": "1", "name": "Card"}
  ]
}`}
          </pre>
        </div>

        {/* Input Textarea */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-zinc-900 dark:text-zinc-100">
            {state.format === 'tts' 
              ? 'TTS Card Codes (space or newline-separated)' 
              : 'JSON Deck Data'}
          </label>
          <textarea
            value={currentInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={state.format === 'tts' 
              ? 'OGN-253-1 OGN-254-1 OGN-255-1' 
              : '{"name": "My Deck", "cards": [...]}'}
            className="w-full h-48 p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg font-mono text-sm resize-vertical bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            disabled={state.isImporting}
          />
        </div>

        {/* Validation Messages */}
        {state.validation && (
          <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-2 text-zinc-900 dark:text-zinc-100">Validation Results</h3>
            {state.validation.messages.map((msg, idx) => (
              <div
                key={idx}
                className={`text-sm mb-1 ${
                  msg.severity === 'error' ? 'text-red-600 dark:text-red-400' :
                  msg.severity === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}
              >
                <span className="font-semibold">[{msg.severity.toUpperCase()}]</span> {msg.message}
              </div>
            ))}
            {state.validation.valid && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                ✓ {state.validation.cardCount} cards ready to import
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setIsOpen(false);
              setState(prev => ({ ...prev, validation: null }));
            }}
            disabled={state.isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleValidate}
            variant="secondary"
            disabled={!canImport}
          >
            Validate
          </Button>
          <Button
            onClick={handleImportClick}
            variant="primary"
            disabled={!canImport}
          >
            {state.isImporting ? 'Importing...' : 'Import Deck'}
          </Button>
        </div>
      </div>
    </div>
  );
}

