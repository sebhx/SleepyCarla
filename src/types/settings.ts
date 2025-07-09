// Settings types for SleepyCarla
export interface AppSettings {
  // Baby profile
  babyAge: {
    ageRange: AgeRange;
    exactAgeInWeeks?: number; // For more precise calculations
  };
  
  // Sleep schedule
  bedtime: string; // "19:00" format
  morningWake: string; // "07:00" format
  
  // Preferences
  enableNapSuggestions: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export type AgeRange = 
  | 'newborn' // 0-3 months
  | 'infant' // 3-6 months  
  | 'older-infant' // 6-9 months
  | 'toddler' // 9-12 months
  | 'young-toddler' // 12-18 months
  | 'toddler-plus'; // 18+ months

export interface ScientificWakeWindow {
  ageRange: AgeRange;
  napNumber: number;
  minMinutes: number;
  maxMinutes: number;
  source: string; // Scientific source reference
  confidence: 'high' | 'medium' | 'low';
}

// Scientific sleep data structure
export interface SleepScience {
  wakeWindows: ScientificWakeWindow[];
  napRecommendations: {
    ageRange: AgeRange;
    recommendedNaps: number;
    maxNaps: number;
    averageNapDuration: number;
    source: string;
  }[];
}
