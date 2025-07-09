import { computed, type Ref } from 'vue';
import type { SleepEntry } from '../types/sleep';
import type { AppSettings, AgeRange } from '../types/settings';
import { useWakeWindows } from './useWakeWindows';

export interface ScheduleTimeSlot {
  id: string;
  type: 'wake' | 'nap' | 'bedtime';
  time: Date;
  angle: number; // Position on the circle (0-270 degrees)
  label: string;
  napNumber?: number;
  confidence?: 'high' | 'medium' | 'low';
  isCompleted?: boolean;
  actualTime?: Date;
}

export function useSleepSchedule(
  sleepEntries: Ref<SleepEntry[]>,
  settings: Ref<AppSettings>
) {
  const { calculateNextNapTime, getNapRecommendationsForAge } = useWakeWindows();

  // Get today's sleep entries
  const todaysEntries = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return sleepEntries.value.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= today && entryDate < tomorrow;
    });
  });

  // Helper function to create basic schedule structure
  const createBaseSchedule = (wakeTime: Date, bedTime: Date) => {
    const schedule: ScheduleTimeSlot[] = [];
    
    // Add wake time (start of arc)
    schedule.push({
      id: 'wake',
      type: 'wake',
      time: wakeTime,
      angle: 0,
      label: 'Wake Up',
      isCompleted: new Date() > wakeTime
    });

    // Add bedtime (end of arc)
    schedule.push({
      id: 'bedtime',
      type: 'bedtime',
      time: bedTime,
      angle: 270,
      label: 'Bedtime',
      isCompleted: false
    });

    return schedule;
  };

  // Helper function to process nap entries
  const processNapEntries = (
    schedule: ScheduleTimeSlot[],
    napRecs: any,
    wakeTime: Date,
    bedTime: Date,
    timeToAngle: (time: Date) => number,
    ageRange: AgeRange
  ) => {
    // Find last wake time and count completed naps
    let lastWakeTime = wakeTime;
    const napEntries = todaysEntries.value.filter(entry => 
      entry.type === 'sleep' && entry.sleepType === 'nap'
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    const completedNaps = napEntries.length;
    
    if (napEntries.length > 0) {
      const lastNap = napEntries[napEntries.length - 1];
      if (lastNap.duration) {
        lastWakeTime = new Date(lastNap.timestamp.getTime() + lastNap.duration * 60 * 1000);
      }
    }

    // Add all suggested naps for the day
    for (let napNum = 1; napNum <= napRecs.recommendedNaps; napNum++) {
      if (napNum <= completedNaps) {
        // This nap is completed
        const napEntry = napEntries[napNum - 1];
        const napTime = new Date(napEntry.timestamp);
        
        schedule.push({
          id: `nap-${napNum}`,
          type: 'nap',
          time: napTime,
          angle: timeToAngle(napTime),
          label: `Nap ${napNum}`,
          napNumber: napNum,
          isCompleted: true,
          actualTime: napTime
        });
      } else {
        // This is a suggested nap
        try {
          const napRecommendation = calculateNextNapTime(lastWakeTime, napNum - 1, ageRange);
          const suggestedTime = napRecommendation.earliest;
          
          // Only suggest if there's enough time before bedtime
          if (suggestedTime.getTime() < bedTime.getTime() - (60 * 60 * 1000)) {
            schedule.push({
              id: `nap-${napNum}`,
              type: 'nap',
              time: suggestedTime,
              angle: timeToAngle(suggestedTime),
              label: `Nap ${napNum}`,
              napNumber: napNum,
              confidence: napRecommendation.confidence,
              isCompleted: false
            });
            
            // Update lastWakeTime for next nap calculation
            lastWakeTime = new Date(suggestedTime.getTime() + (napRecs.averageNapDuration * 60 * 1000));
          }
        } catch (error) {
          console.warn('Error calculating nap time:', error);
        }
      }
    }

    return schedule;
  };

  // Calculate the schedule for today
  const todaysSchedule = computed((): ScheduleTimeSlot[] => {
    const today = new Date();
    const ageRange = settings.value.babyAge.ageRange;
    
    try {
      // Parse wake and bedtime from settings
      const [wakeHour, wakeMinute] = settings.value.morningWake.split(':').map(Number);
      const [bedHour, bedMinute] = settings.value.bedtime.split(':').map(Number);
      
      // Validate parsed times
      if (isNaN(wakeHour) || isNaN(wakeMinute) || isNaN(bedHour) || isNaN(bedMinute)) {
        console.warn('Invalid time format in settings');
        return [];
      }
      
      const wakeTime = new Date(today);
      wakeTime.setHours(wakeHour, wakeMinute, 0, 0);
      
      const bedTime = new Date(today);
      bedTime.setHours(bedHour, bedMinute, 0, 0);

      // Calculate time span (wake to bed in minutes)
      const totalMinutes = (bedTime.getTime() - wakeTime.getTime()) / (1000 * 60);
      
      // Ensure we have a valid time span
      if (totalMinutes <= 0) {
        console.warn('Invalid time span: bedtime must be after wake time');
        return [];
      }
      
      // Helper function to convert time to angle (0-270 degrees)
      const timeToAngle = (time: Date): number => {
        const minutesFromWake = (time.getTime() - wakeTime.getTime()) / (1000 * 60);
        return Math.max(0, Math.min(270, (minutesFromWake / totalMinutes) * 270));
      };

      // Create base schedule
      let schedule = createBaseSchedule(wakeTime, bedTime);

      // Get nap recommendations for age
      const napRecs = getNapRecommendationsForAge(ageRange);
      if (napRecs) {
        schedule = processNapEntries(schedule, napRecs, wakeTime, bedTime, timeToAngle, ageRange);
      }

      return schedule.sort((a, b) => a.angle - b.angle);
    } catch (error) {
      console.error('Error calculating schedule:', error);
      return [];
    }
  });

  // Current time indicator angle
  const currentTimeAngle = computed(() => {
    const now = new Date();
    const schedule = todaysSchedule.value;
    
    if (schedule.length < 2) return 0;
    
    const wakeTime = schedule[0].time;
    const bedTime = schedule[schedule.length - 1].time;
    
    // If before wake time or after bedtime, don't show indicator
    if (now < wakeTime || now > bedTime) return null;
    
    const totalMinutes = (bedTime.getTime() - wakeTime.getTime()) / (1000 * 60);
    const minutesFromWake = (now.getTime() - wakeTime.getTime()) / (1000 * 60);
    
    return (minutesFromWake / totalMinutes) * 270;
  });

  // Next activity (next uncompleted item)
  const nextActivity = computed(() => {
    const schedule = todaysSchedule.value;
    const now = new Date();
    
    return schedule.find(item => !item.isCompleted && item.time > now) || null;
  });

  return {
    todaysSchedule,
    currentTimeAngle,
    nextActivity,
    todaysEntries
  };
}
