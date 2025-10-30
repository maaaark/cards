/**
 * ConnectionStatus Component
 * 
 * Displays real-time connection status for Supabase Realtime subscriptions.
 * Shows connection state, errors, and provides manual reconnection.
 * 
 * @module components/game/ConnectionStatus
 */

'use client';

import type { ConnectionStatusProps } from '@/app/lib/types/multiplayer';
import { Button } from '../ui/Button';

/**
 * ConnectionStatus component for displaying Realtime connection state.
 */
export function ConnectionStatus({
  connectionState,
  onReconnect,
  showDetails = false,
  className = '',
}: ConnectionStatusProps) {
  const { status, error, reconnectAttempts } = connectionState;

  // Don't show anything if connected (unless showDetails is true)
  if (status === 'connected' && !showDetails) {
    return null;
  }

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      case 'disconnected':
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return '✓';
      case 'connecting':
      case 'reconnecting':
        return '⟳';
      case 'disconnected':
        return '○';
      case 'error':
        return '✕';
      default:
        return '?';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return reconnectAttempts > 0
          ? `Reconnecting (attempt ${reconnectAttempts})...`
          : 'Reconnecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <div
      className={`
        p-4 rounded-lg border flex items-center justify-between
        ${getStatusColor()}
        ${className}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Status Icon */}
        <span
          className={`
            text-xl
            ${status === 'connecting' || status === 'reconnecting' ? 'animate-spin' : ''}
          `}
        >
          {getStatusIcon()}
        </span>

        {/* Status Text */}
        <div>
          <p className="font-medium">{getStatusText()}</p>
          
          {showDetails && error && (
            <p className="text-sm opacity-80 mt-1">{error}</p>
          )}
          
          {showDetails && connectionState.lastConnectedAt && (
            <p className="text-xs opacity-60 mt-1">
              Last connected: {connectionState.lastConnectedAt.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Reconnect Button */}
      {(status === 'error' || status === 'disconnected') && onReconnect && (
        <Button
          onClick={onReconnect}
          className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm"
        >
          Reconnect
        </Button>
      )}
    </div>
  );
}
