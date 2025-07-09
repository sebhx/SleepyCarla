import type { SleepEntry, SleepStats } from '../types/sleep';

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3002/api`;

export class ApiError extends Error {
  public status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Get all sleep entries
  async getSleepEntries(): Promise<SleepEntry[]> {
    const response = await fetch(`${API_BASE_URL}/sleep`);
    return handleResponse<SleepEntry[]>(response);
  },

  // Create a new sleep entry
  async createSleepEntry(entry: Omit<SleepEntry, 'id'>): Promise<SleepEntry> {
    const response = await fetch(`${API_BASE_URL}/sleep`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    return handleResponse<SleepEntry>(response);
  },

  // Update a sleep entry
  async updateSleepEntry(id: string, entry: Partial<SleepEntry>): Promise<SleepEntry> {
    const response = await fetch(`${API_BASE_URL}/sleep/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    return handleResponse<SleepEntry>(response);
  },

  // Delete a sleep entry
  async deleteSleepEntry(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sleep/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(response.status, errorText || `HTTP ${response.status}`);
    }
  },

  // Get sleep statistics
  async getSleepStats(): Promise<SleepStats> {
    const response = await fetch(`${API_BASE_URL}/sleep/stats`);
    return handleResponse<SleepStats>(response);
  },

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse<{ status: string; message: string }>(response);
  },
};
