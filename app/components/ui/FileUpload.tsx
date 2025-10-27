/**
 * FileUpload Component
 * 
 * File upload component with drag-and-drop support and validation.
 * Used for importing deck JSON files.
 * 
 * @module components/ui/FileUpload
 */

'use client';

import { useCallback, useState, type DragEvent, type ChangeEvent } from 'react';
import { Button } from './Button';

export interface FileUploadProps {
  /** Callback when file is successfully selected */
  onFileSelect: (file: File) => void;
  
  /** Callback for validation errors */
  onError?: (error: string) => void;
  
  /** Accepted file types (e.g., "application/json") */
  accept?: string;
  
  /** Maximum file size in bytes */
  maxSize?: number;
  
  /** Custom label text */
  label?: string;
}

/**
 * File upload component with drag-and-drop.
 * 
 * @example
 * <FileUpload
 *   accept="application/json"
 *   maxSize={5 * 1024 * 1024}
 *   onFileSelect={handleFileSelect}
 *   onError={handleError}
 * />
 */
export function FileUpload({
  onFileSelect,
  onError,
  accept = 'application/json',
  maxSize = 5 * 1024 * 1024, // 5MB default
  label = 'Import Deck (JSON)',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Validates and processes selected file
   */
  const processFile = useCallback((file: File) => {
    // Check file type
    if (!file.type.match(accept.replace('application/', '').replace('*', '.*'))) {
      onError?.(`Invalid file type. Expected: ${accept}`);
      return;
    }
    
    // Check file size
    if (file.size > maxSize) {
      onError?.(`File too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }
    
    onFileSelect(file);
  }, [accept, maxSize, onFileSelect, onError]);

  /**
   * Handle file input change
   */
  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input to allow re-selecting same file
    event.target.value = '';
  }, [processFile]);

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  /**
   * Handle file drop
   */
  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  return (
    <div className="w-full">
      {/* Drag and drop area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
          }
        `}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="File upload input"
        />
        
        <div className="pointer-events-none">
          <svg
            className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-600"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {isDragging ? 'Drop file here' : 'Drag and drop file here, or click to select'}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            {accept} up to {(maxSize / 1024 / 1024).toFixed(1)}MB
          </p>
        </div>
      </div>
      
      {/* Alternative button upload */}
      <div className="mt-4">
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            const input = document.querySelector<HTMLInputElement>('input[type="file"]');
            input?.click();
          }}
        >
          {label}
        </Button>
      </div>
    </div>
  );
}
