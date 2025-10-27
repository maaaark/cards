/**
 * DeckImport Component
 * 
 * Allows users to import custom decks from JSON files.
 * Validates deck structure and displays errors.
 * 
 * @module components/game/DeckImport
 */

'use client';

import { useState, useCallback } from 'react';
import { FileUpload } from '../ui/FileUpload';
import { Button } from '../ui/Button';
import { parseDeckImport } from '@/app/lib/utils/deck';
import type { DeckImportProps } from '@/app/lib/types/game';

/**
 * DeckImport component with file upload and validation.
 * 
 * @example
 * <DeckImport
 *   onImport={handleImport}
 *   onError={handleError}
 * />
 */
export function DeckImport({ onImport, onError }: DeckImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const deckImport = parseDeckImport(text);
      
      if (deckImport) {
        setSelectedFile(file.name);
        onImport(deckImport);
        setIsOpen(false);
        setSelectedFile(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse deck file';
      onError(errorMessage);
      setSelectedFile(null);
    }
  }, [onImport, onError]);

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
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Import Deck
          </h2>
          <button
            onClick={() => {
              setIsOpen(false);
              setSelectedFile(null);
            }}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
            <strong>JSON Format:</strong>
          </p>
          <pre className="text-xs text-blue-800 dark:text-blue-200 overflow-x-auto">
{`{
  "name": "My Deck",
  "cards": [
    {
      "id": "card-1",
      "name": "Card Name"
    }
  ]
}`}
          </pre>
        </div>

        {/* File Upload */}
        <FileUpload
          accept="application/json"
          maxSize={5 * 1024 * 1024}
          onFileSelect={handleFileSelect}
          onError={onError}
          label="Choose JSON File"
        />

        {selectedFile && (
          <p className="mt-4 text-sm text-green-600 dark:text-green-400">
            ✓ Imported: {selectedFile}
          </p>
        )}

        {/* Cancel Button */}
        <div className="mt-6">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setIsOpen(false);
              setSelectedFile(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
