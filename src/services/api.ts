import type { UserSettings, UpdateUserSettingsRequest } from '../types/settings';
import type { SleepSession, CreateSleepSessionRequest, EndSleepSessionRequest } from '../types/sleep-refactored';

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3003/api`;

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
  // Legacy sleep API methods removed - now using sleep-sessions API

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse<{ status: string; message: string }>(response);
  },

  // User Settings API
  async getUserSettings(): Promise<UserSettings> {
    const response = await fetch(`${API_BASE_URL}/user-settings`);
    return handleResponse<UserSettings>(response);
  },

  async updateUserSettings(updates: UpdateUserSettingsRequest): Promise<UserSettings> {
    const response = await fetch(`${API_BASE_URL}/user-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return handleResponse<UserSettings>(response);
  },

  async resetUserSettings(): Promise<UserSettings> {
    const response = await fetch(`${API_BASE_URL}/user-settings/reset`, {
      method: 'POST',
    });
    return handleResponse<UserSettings>(response);
  },

  // Sleep Sessions API (New relational design)
  async getSleepSessions(): Promise<SleepSession[]> {
    const response = await fetch(`${API_BASE_URL}/sleep-sessions?includeWake=true`);
    const sessions = await handleResponse<any[]>(response);
    return sessions.map(session => ({
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      wakeEvent: session.wakeEvent ? {
        ...session.wakeEvent,
        wakeTime: new Date(session.wakeEvent.wakeTime),
        createdAt: new Date(session.wakeEvent.createdAt)
      } : undefined,
    }));
  },

  async getSleepSession(id: string): Promise<SleepSession> {
    const response = await fetch(`${API_BASE_URL}/sleep-sessions/${id}`);
    const session = await handleResponse<any>(response);
    return {
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
    };
  },

  async createSleepSession(request: CreateSleepSessionRequest): Promise<SleepSession> {
    const response = await fetch(`${API_BASE_URL}/sleep-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    const session = await handleResponse<any>(response);
    return {
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
    };
  },

  async endSleepSession(id: string, request?: EndSleepSessionRequest): Promise<SleepSession> {
    const response = await fetch(`${API_BASE_URL}/sleep-sessions/${id}/end`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request || {}),
    });
    const session = await handleResponse<any>(response);
    return {
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
    };
  },

  async deleteSleepSession(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sleep-sessions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(response.status, errorText || `HTTP ${response.status}`);
    }
  },

  // Additional Sleep Sessions API methods
  async updateSleepSession(id: string, updates: any): Promise<SleepSession> {
    const response = await fetch(`${API_BASE_URL}/sleep-sessions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    const session = await handleResponse<any>(response);
    return {
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
    };
  },

  async getSleepSessionStats(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/sleep-sessions/stats`);
    return handleResponse<any>(response);
  },

  async getSleepActivities(date?: string): Promise<any[]> {
    const url = date 
      ? `${API_BASE_URL}/sleep-sessions/activities?date=${date}`
      : `${API_BASE_URL}/sleep-sessions/activities`;
    const response = await fetch(url);
    const activities = await handleResponse<any[]>(response);
    return activities.map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp),
    }));
  },
};
