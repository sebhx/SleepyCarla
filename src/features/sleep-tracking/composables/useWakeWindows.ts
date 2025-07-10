import type { SleepActivityEntry } from '../../../types/sleep-refactored';
import type { AgeRange } from '../../../types/settings';
import { scientificSleepData } from '../../../data/sleepScience';

// Wake window calculation composable
export function useWakeWindows() {
  
  // Get recommended wake windows for age range
  const getWakeWindowsForAge = (ageRange: AgeRange) => {
    return scientificSleepData.wakeWindows.filter(window => window.ageRange === ageRange);
  };
  
  // Get nap recommendations for age range
  const getNapRecommendationsForAge = (ageRange: AgeRange) => {
    return scientificSleepData.napRecommendations.find(rec => rec.ageRange === ageRange);
  };
  
  // Calculate next nap recommendation
  const calculateNextNapTime = (
    lastWakeTime: Date,
    napCount: number,
    ageRange: AgeRange
  ): { earliest: Date; latest: Date; confidence: 'high' | 'medium' | 'low' } => {
    const wakeWindows = getWakeWindowsForAge(ageRange);
    
    // Find appropriate wake window for this nap number
    const wakeWindow = wakeWindows.find(w => w.napNumber === napCount + 1) || 
                      wakeWindows[wakeWindows.length - 1]; // fallback to last window
    
    if (!wakeWindow) {
      // Fallback for unknown age ranges
      const fallbackMinutes = 120; // 2 hours
      return {
        earliest: new Date(lastWakeTime.getTime() + fallbackMinutes * 60 * 1000),
        latest: new Date(lastWakeTime.getTime() + (fallbackMinutes + 60) * 60 * 1000),
        confidence: 'low'
      };
    }
    
    const earliest = new Date(lastWakeTime.getTime() + wakeWindow.minMinutes * 60 * 1000);
    const latest = new Date(lastWakeTime.getTime() + wakeWindow.maxMinutes * 60 * 1000);
    
    return {
      earliest,
      latest,
      confidence: wakeWindow.confidence
    };
  };
  
  // Check if it's time for a nap
  const isNapTime = (
    lastWakeTime: Date,
    napCount: number,
    ageRange: AgeRange,
    currentTime: Date = new Date()
  ): { isTime: boolean; timeUntilWindow: number; confidence: 'high' | 'medium' | 'low' } => {
    const { earliest, latest, confidence } = calculateNextNapTime(lastWakeTime, napCount, ageRange);
    
    const now = currentTime.getTime();
    const earliestTime = earliest.getTime();
    const latestTime = latest.getTime();
    
    if (now >= earliestTime && now <= latestTime) {
      return { isTime: true, timeUntilWindow: 0, confidence };
    }
    
    if (now < earliestTime) {
      const timeUntilWindow = Math.round((earliestTime - now) / (1000 * 60)); // minutes
      return { isTime: false, timeUntilWindow, confidence };
    }
    
    // Past the window
    return { isTime: false, timeUntilWindow: -1, confidence };
  };
  
  // Get current wake window status
  const getCurrentWakeWindowStatus = (
    sleepEntries: SleepActivityEntry[],
    ageRange: AgeRange,
    currentTime: Date = new Date()
  ) => {
    if (sleepEntries.length === 0) {
      return {
        status: 'no-data',
        message: 'No sleep data available',
        nextNapTime: null,
        confidence: 'low' as const
      };
    }
    
    // Find last wake time
    const lastEntry = sleepEntries[sleepEntries.length - 1];
    let lastWakeTime: Date;
    
    if (lastEntry.type === 'wake') {
      lastWakeTime = lastEntry.timestamp;
    } else if (lastEntry.type === 'sleep' && lastEntry.duration) {
      // Calculate wake time from sleep start + duration
      lastWakeTime = new Date(lastEntry.timestamp.getTime() + lastEntry.duration * 60 * 1000);
    } else {
      // Fallback to entry timestamp
      lastWakeTime = lastEntry.timestamp;
    }
    
    // Count naps today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEntries = sleepEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });
    
    const napCount = todayEntries.filter(entry => 
      (entry.sleepType === 'nap') || 
      (!entry.sleepType && entry.napNumber && entry.napNumber > 0)
    ).length;
    
    const napRec = getNapRecommendationsForAge(ageRange);
    
    // Check if baby should be done with naps for the day
    if (napRec && napCount >= napRec.maxNaps) {
      return {
        status: 'done-with-naps',
        message: `${napCount} naps completed - focus on bedtime`,
        nextNapTime: null,
        confidence: 'high' as const
      };
    }
    
    const { isTime, timeUntilWindow, confidence } = isNapTime(
      lastWakeTime,
      napCount,
      ageRange,
      currentTime
    );
    
    if (isTime) {
      return {
        status: 'nap-time',
        message: 'Good time for a nap!',
        nextNapTime: null,
        confidence
      };
    }
    
    if (timeUntilWindow > 0) {
      const { earliest, latest } = calculateNextNapTime(lastWakeTime, napCount, ageRange);
      return {
        status: 'wait-for-nap',
        message: `Next nap window in ${timeUntilWindow}m`,
        nextNapTime: { earliest, latest },
        confidence
      };
    }
    
    return {
      status: 'overtired',
      message: 'May be overtired - try for a nap',
      nextNapTime: null,
      confidence
    };
  };
  
  // Format wake window for display
  const formatWakeWindow = (ageRange: AgeRange, napNumber: number): string => {
    const wakeWindow = scientificSleepData.wakeWindows.find(
      w => w.ageRange === ageRange && w.napNumber === napNumber
    );
    
    if (!wakeWindow) return 'Unknown';
    
    const minHours = Math.floor(wakeWindow.minMinutes / 60);
    const minMins = wakeWindow.minMinutes % 60;
    const maxHours = Math.floor(wakeWindow.maxMinutes / 60);
    const maxMins = wakeWindow.maxMinutes % 60;
    
    const formatTime = (hours: number, mins: number) => {
      if (hours === 0) return `${mins}m`;
      if (mins === 0) return `${hours}h`;
      return `${hours}h ${mins}m`;
    };
    
    return `${formatTime(minHours, minMins)} - ${formatTime(maxHours, maxMins)}`;
  };
  
  return {
    getWakeWindowsForAge,
    getNapRecommendationsForAge,
    calculateNextNapTime,
    isNapTime,
    getCurrentWakeWindowStatus,
    formatWakeWindow
  };
}
