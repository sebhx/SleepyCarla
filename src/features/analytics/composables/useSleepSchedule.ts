/**
 * Sleep schedule composable for the donut chart
 */

import { computed, type Ref } from 'vue';
import type { SleepActivityEntry } from '../../../types/sleep-refactored';
import type { AppSettings } from '../../../types/settings';
import { scientificSleepData } from '../../../data/sleepScience';

export interface ScheduleSlot {
  id: string;
  time: string;
  type: 'wake' | 'nap' | 'bedtime';
  angle: number;
  duration?: number;
  napNumber?: number;
  label: string;
  isCompleted: boolean;
}

export function useSleepSchedule(
  sleepEntries: Ref<SleepActivityEntry[]>,
  settings: Ref<AppSettings>
) {
  
  // Calculate today's schedule based on entries
  const todaysSchedule = computed<ScheduleSlot[]>(() => {
    const slots: ScheduleSlot[] = [];
    const currentTime = new Date();
    
    // Parse wake and bedtime
    const [wakeHour, wakeMinute] = settings.value.morningWake.split(':').map(Number);
    const [bedHour, bedMinute] = settings.value.bedtime.split(':').map(Number);
    
    // Calculate total active minutes (wake to bedtime)
    const wakeMinutes = wakeHour * 60 + wakeMinute;
    const bedMinutes = bedHour * 60 + bedMinute;
    const totalActiveMinutes = bedMinutes - wakeMinutes;
    
    // Helper function to convert time to angle (0-270 degrees)
    const timeToAngle = (hour: number, minute: number) => {
      const timeMinutes = hour * 60 + minute;
      const minutesFromWake = timeMinutes - wakeMinutes;
      return (minutesFromWake / totalActiveMinutes) * 270;
    };
    
    // 1. Morning wake time (always at 0 degrees)
    slots.push({
      id: 'morning-wake',
      time: settings.value.morningWake,
      type: 'wake',
      angle: 0,
      label: 'Wake up',
      isCompleted: true
    });
    
    // 2-N. Add naps based on age recommendations
    const ageRange = settings.value.babyAge.ageRange;
    const napRecommendation = scientificSleepData.napRecommendations.find(rec => rec.ageRange === ageRange);
    const recommendedNapCount = napRecommendation?.recommendedNaps || 3;
    
    const napTimes = getNapRecommendations(ageRange, settings.value.morningWake, settings.value.bedtime, recommendedNapCount);
    
    napTimes.forEach((napTime, index) => {
      const napAngle = timeToAngle(napTime.hour, napTime.minute);
      const napDateTime = new Date();
      napDateTime.setHours(napTime.hour, napTime.minute, 0, 0);
      
      // Check if this nap has been completed (exists in sleep entries)
      const isCompleted = sleepEntries.value.some(entry => {
        if (entry.type !== 'sleep' || entry.sleepType !== 'nap') return false;
        const entryTime = entry.timestamp;
        const timeDiff = Math.abs(entryTime.getTime() - napDateTime.getTime());
        return timeDiff < (2 * 60 * 60 * 1000); // Within 2 hours
      });
      
      slots.push({
        id: `nap-${index + 1}`,
        time: `${napTime.hour.toString().padStart(2, '0')}:${napTime.minute.toString().padStart(2, '0')}`,
        type: 'nap',
        angle: napAngle,
        napNumber: index + 1,
        label: `Nap ${index + 1}`,
        isCompleted
      });
    });
    
    // 5. Bedtime (always at 270 degrees)
    slots.push({
      id: 'bedtime',
      time: settings.value.bedtime,
      type: 'bedtime',
      angle: 270,
      label: 'Bedtime',
      isCompleted: currentTime.getHours() >= bedHour
    });
    
    return slots.sort((a, b) => a.angle - b.angle);
  });

  // Helper function to get nap recommendations based on age
  function getNapRecommendations(ageRange: string, morningWake: string, bedtime: string, napCount: number) {
    const [wakeHour, wakeMinute] = morningWake.split(':').map(Number);
    const [bedHour, bedMinute] = bedtime.split(':').map(Number);
    
    // Calculate total active time
    const wakeMinutes = wakeHour * 60 + wakeMinute;
    const bedMinutes = bedHour * 60 + bedMinute;
    const totalActiveMinutes = bedMinutes - wakeMinutes;
    
    // Get wake windows for this age range from scientific data
    const wakeWindows = scientificSleepData.wakeWindows
      .filter(ww => ww.ageRange === ageRange)
      .slice(0, napCount) // Only get the number of wake windows we need
      .map(ww => (ww.minMinutes + ww.maxMinutes) / 2 / 60); // Average in hours
    
    // Fallback wake windows if scientific data is incomplete
    const fallbackWindows: Record<string, number[]> = {
      'newborn': [1.5, 2.0, 2.0, 2.5],
      'infant': [2.5, 3.0, 3.5],
      'older-infant': [3.0, 3.5, 4.0],
      'toddler': [3.5, 4.5],
      'young-toddler': [4.0, 5.0],
      'toddler-plus': [5.0]
    };
    
    const windows = wakeWindows.length >= napCount 
      ? wakeWindows 
      : (fallbackWindows[ageRange] || [3.0, 3.5, 4.0]).slice(0, napCount);
    
    const napTimes = [];
    
    // Method 1: Try to use wake windows
    let currentTime = wakeMinutes; // Start from morning wake
    
    for (let i = 0; i < napCount; i++) {
      const windowHours = windows[i] || windows[windows.length - 1]; // Use last window if we run out
      currentTime += windowHours * 60; // Add wake window
      
      // Don't schedule naps too close to bedtime (at least 2.5 hours before)
      if (currentTime + 150 <= bedMinutes) { // 150 minutes = 2.5 hours
        const hour = Math.floor(currentTime / 60);
        const minute = Math.round(currentTime % 60);
        napTimes.push({ hour, minute });
      }
    }
    
    // Method 2: If we don't have enough naps, distribute evenly across the day
    if (napTimes.length < napCount) {
      napTimes.length = 0; // Clear and restart
      
      // Leave 2.5 hours before bedtime for the last wake window
      const availableMinutes = totalActiveMinutes - 150; // 150 min = 2.5 hours
      const segmentSize = availableMinutes / (napCount + 1); // +1 for segments between naps
      
      for (let i = 1; i <= napCount; i++) {
        const napTime = wakeMinutes + (segmentSize * i);
        const hour = Math.floor(napTime / 60);
        const minute = Math.round(napTime % 60);
        napTimes.push({ hour, minute });
      }
    }
    
    // Method 3: Default nap times based on age and nap count
    if (napTimes.length < napCount) {
      napTimes.length = 0; // Clear and restart with defaults
      
      const defaultNapsByAge: Record<string, Array<{hour: number, minute: number}>> = {
        'newborn': [
          { hour: 9, minute: 0 },   // 9:00 AM
          { hour: 11, minute: 30 }, // 11:30 AM  
          { hour: 14, minute: 0 },  // 2:00 PM
          { hour: 16, minute: 30 }  // 4:30 PM
        ],
        'infant': [
          { hour: 9, minute: 30 },  // 9:30 AM
          { hour: 13, minute: 0 },  // 1:00 PM
          { hour: 16, minute: 0 }   // 4:00 PM
        ],
        'older-infant': [
          { hour: 10, minute: 0 },  // 10:00 AM
          { hour: 13, minute: 30 }, // 1:30 PM
          { hour: 16, minute: 30 }  // 4:30 PM
        ],
        'toddler': [
          { hour: 10, minute: 30 }, // 10:30 AM
          { hour: 14, minute: 30 }  // 2:30 PM
        ],
        'young-toddler': [
          { hour: 11, minute: 0 },  // 11:00 AM
          { hour: 15, minute: 0 }   // 3:00 PM
        ],
        'toddler-plus': [
          { hour: 13, minute: 0 }   // 1:00 PM
        ]
      };
      
      const defaultTimes = defaultNapsByAge[ageRange] || defaultNapsByAge['older-infant'];
      napTimes.push(...defaultTimes.slice(0, napCount));
    }
    
    return napTimes.slice(0, napCount); // Ensure exact count
  }
  
  // Calculate current time angle
  const currentTimeAngle = computed(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Parse wake and bedtime
    const [wakeHour, wakeMinute] = settings.value.morningWake.split(':').map(Number);
    const [bedHour, bedMinute] = settings.value.bedtime.split(':').map(Number);
    
    // Calculate total active minutes (wake to bedtime)
    const wakeMinutes = wakeHour * 60 + wakeMinute;
    const bedMinutes = bedHour * 60 + bedMinute;
    const totalActiveMinutes = bedMinutes - wakeMinutes;
    
    // Current time in minutes
    const currentMinutes = currentHour * 60 + currentMinute;
    
    // If current time is before wake time or after bedtime, don't show indicator
    if (currentMinutes < wakeMinutes || currentMinutes > bedMinutes) {
      return null;
    }
    
    // Calculate angle based on position between wake and bedtime
    const minutesFromWake = currentMinutes - wakeMinutes;
    return (minutesFromWake / totalActiveMinutes) * 270;
  });
  
  // Calculate next activity
  const nextActivity = computed(() => {
    const currentAngle = currentTimeAngle.value;
    if (currentAngle === null) return null;
    
    const schedule = todaysSchedule.value;
    const nextSlot = schedule.find(slot => slot.angle > currentAngle);
    
    if (nextSlot) {
      const timeDiff = ((nextSlot.angle - currentAngle) / 270) * 24 * 60; // minutes
      return {
        ...nextSlot,
        timeUntil: Math.round(timeDiff)
      };
    }
    
    return null;
  });
  
  return {
    todaysSchedule,
    currentTimeAngle,
    nextActivity
  };
}
