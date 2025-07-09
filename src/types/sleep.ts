// Types for baby sleep tracking

export interface SleepEntry {
  id: string;
  type: 'sleep' | 'wake';
  timestamp: Date;
  duration?: number; // in minutes, for sleep entries
  napNumber?: number; // Optional for backwards compatibility, will be phased out
  sleepType?: 'nap' | 'night'; // New: simpler categorization, optional for backwards compatibility
  notes?: string;
}

export interface BabyProfile {
  name: string;
  birthDate: Date;
  bedtime: string; // "19:00"
  wakeTime: string; // "07:00"
  ageInMonths: number;
}

export interface WakeWindow {
  minMinutes: number;
  maxMinutes: number;
  isOptimal: boolean;
}

export interface NapRecommendation {
  suggestedNapTime: Date;
  suggestedDuration: number; // in minutes
  napNumber: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface SleepPattern {
  averageNightSleep: number; // in minutes
  averageNapDuration: number; // in minutes
  totalDailySleep: number; // in minutes
  consistencyScore: number; // 0-100
}

export interface SleepStats {
  totalEntries: number;
  averageNightSleep: number; // in minutes
  averageNapDuration: number; // in minutes
  totalSleepToday: number; // in minutes
  lastWeekAverage: number; // in minutes
}

export type SleepState = 'awake' | 'napping' | 'nightSleep';
