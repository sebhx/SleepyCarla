// New types for the refactored database design
// This provides proper separation between sleep sessions and wake events

export type SleepState = 'awake' | 'sleeping' | 'napping' | 'nightSleep';

export interface SleepSession {
  id: string;
  sleepType: 'nap' | 'night';
  startTime: Date;
  endTime?: Date; // undefined if sleep is ongoing
  duration?: number; // in minutes, calculated when endTime is set
  napNumber?: number; // For naps only (1-3)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  wakeEvent?: WakeEvent; // Optional wake event if session ended
}

export interface WakeEvent {
  id: string;
  sleepSessionId: string; // Foreign key to SleepSession
  wakeTime: Date;
  createdAt: Date;
}

// Combined view for easier frontend consumption
export interface SleepActivityEntry {
  id: string;
  type: 'sleep' | 'wake';
  timestamp: Date;
  duration?: number; // Only for sleep entries
  sleepType?: 'nap' | 'night'; // Only for sleep entries
  napNumber?: number; // Only for nap entries
  notes?: string; // Only for sleep entries
  sleepSessionId?: string; // Only for wake entries
}

// API request/response types
export interface CreateSleepSessionRequest {
  sleepType: 'nap' | 'night';
  startTime: string; // ISO string
  napNumber?: number;
  notes?: string;
}

export interface EndSleepSessionRequest {
  endTime: string; // ISO string
}

export interface UpdateSleepSessionRequest {
  sleepType?: 'nap' | 'night';
  startTime?: string; // ISO string
  endTime?: string; // ISO string
  napNumber?: number;
  notes?: string;
}

export interface SleepSessionWithWake extends SleepSession {
  wakeEvent?: WakeEvent;
}

// Backward compatibility types for existing frontend
export interface LegacySleepEntry {
  id: string;
  type: 'sleep' | 'wake';
  timestamp: Date;
  duration?: number;
  napNumber?: number;
  sleepType?: 'nap' | 'night';
  notes?: string;
}

// User settings types for database storage
export interface UserSettings {
  id: string; // Usually 'default'
  babyAgeRange: 'newborn' | 'infant' | 'older-infant' | 'toddler' | 'young-toddler' | 'toddler-plus';
  babyExactAgeWeeks?: number;
  bedtime: string; // TIME format "19:00"
  morningWake: string; // TIME format "07:00"
  enableNapSuggestions: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  createdAt: Date;
  updatedAt: Date;
}

// API request/response types for settings
export interface UpdateUserSettingsRequest {
  babyAgeRange?: 'newborn' | 'infant' | 'older-infant' | 'toddler' | 'young-toddler' | 'toddler-plus';
  babyExactAgeWeeks?: number;
  bedtime?: string;
  morningWake?: string;
  enableNapSuggestions?: boolean;
  notificationsEnabled?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}
