/**
 * Error handling utilities for SleepyCarla
 */

import { ref } from 'vue';

export interface AppError {
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: Date;
  duration?: number; // milliseconds
}

/**
 * Global error state management
 */
const errors = ref<AppError[]>([]);

/**
 * Show an error message
 */
export function showError(message: string, type: 'error' | 'warning' | 'info' = 'error', duration = 5000) {
  const error: AppError = {
    message,
    type,
    timestamp: new Date(),
    duration
  };

  errors.value.push(error);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeError(error);
    }, duration);
  }
}

/**
 * Remove a specific error
 */
export function removeError(error: AppError) {
  const index = errors.value.indexOf(error);
  if (index > -1) {
    errors.value.splice(index, 1);
  }
}

/**
 * Clear all errors
 */
export function clearErrors() {
  errors.value = [];
}

/**
 * Get all current errors
 */
export function getErrors() {
  return errors.value;
}

/**
 * Handle API errors with user-friendly messages
 */
export function handleApiError(error: any) {
  let message = 'An unexpected error occurred';

  if (error?.status) {
    switch (error.status) {
      case 400:
        message = 'Invalid request. Please check your input.';
        break;
      case 401:
        message = 'Authentication required. Please log in.';
        break;
      case 403:
        message = 'Access denied. You don\'t have permission to perform this action.';
        break;
      case 404:
        message = 'Resource not found. It may have been deleted or moved.';
        break;
      case 409:
        message = 'Conflict detected. This action cannot be completed.';
        break;
      case 422:
        message = 'Validation error. Please check your input.';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        break;
      case 502:
      case 503:
      case 504:
        message = 'Service temporarily unavailable. Please try again later.';
        break;
      default:
        message = `Error ${error.status}: ${error.message || 'Unknown error'}`;
    }
  } else if (error?.message) {
    message = error.message;
  }

  showError(message, 'error');
}

/**
 * Handle validation errors
 */
export function handleValidationErrors(errors: string[]) {
  errors.forEach(error => {
    showError(error, 'warning');
  });
}

/**
 * Show success message
 */
export function showSuccess(message: string, duration = 3000) {
  showError(message, 'info', duration);
}

/**
 * Handle network errors
 */
export function handleNetworkError() {
  showError('Network error. Please check your connection and try again.', 'error');
}

/**
 * Handle offline state
 */
export function handleOfflineState() {
  showError('You are currently offline. Data will be saved locally.', 'info', 0);
}

/**
 * Handle online state
 */
export function handleOnlineState() {
  showSuccess('Connection restored. Syncing data...', 2000);
}

/**
 * Composable for error handling
 */
export function useErrorHandler() {
  return {
    errors,
    showError,
    removeError,
    clearErrors,
    handleApiError,
    handleValidationErrors,
    showSuccess,
    handleNetworkError,
    handleOfflineState,
    handleOnlineState
  };
}
