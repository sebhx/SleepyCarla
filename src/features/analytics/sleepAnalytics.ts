import { computed, type Ref } from 'vue'
import type { SleepActivityEntry } from '../../types/sleep-refactored'

export interface SleepPattern {
  date: Date
  napCount: number
  totalNapDuration: number
  nightSleepDuration: number
  totalSleepDuration: number
  bedtime: Date | null
  wakeTime: Date | null
}

export const useSleepAnalytics = (sleepEntries: Ref<SleepActivityEntry[]>) => {
  const getPatternsForLastDays = (days: number): SleepPattern[] => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days + 1) // Fix: subtract (days - 1) instead of days
    
    const patterns: SleepPattern[] = []
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d)
      dayStart.setHours(0, 0, 0, 0)
      
      const dayEnd = new Date(d)
      dayEnd.setHours(23, 59, 59, 999)
      
      const dayEntries = sleepEntries.value.filter(entry => {
        const entryDate = new Date(entry.timestamp)
        return entryDate >= dayStart && entryDate <= dayEnd
      })
      
      patterns.push(analyzeDayPatterns(new Date(d), dayEntries))
    }
    
    return patterns
  }
  
  const analyzeDayPatterns = (date: Date, entries: SleepActivityEntry[]): SleepPattern => {
    const naps = entries.filter(entry => 
      entry.type === 'sleep' && 
      entry.duration && 
      (entry.sleepType === 'nap' || entry.napNumber) // backwards compatibility
    )
    const nightSleep = entries.filter(entry => 
      entry.type === 'sleep' && 
      entry.duration && 
      (entry.sleepType === 'night' || !entry.napNumber) // backwards compatibility
    )
    
    let totalNapDuration = 0
    let napCount = 0
    let nightSleepDuration = 0
    let bedtime: Date | null = null
    let wakeTime: Date | null = null
    
    // Calculate nap statistics
    naps.forEach(nap => {
      if (nap.duration) {
        totalNapDuration += nap.duration
        napCount++
      }
    })
    
    // Calculate night sleep statistics
    if (nightSleep.length > 0) {
      const nightEntry = nightSleep[0]
      if (nightEntry.duration) {
        nightSleepDuration = nightEntry.duration
        bedtime = new Date(nightEntry.timestamp)
        wakeTime = new Date(nightEntry.timestamp.getTime() + (nightEntry.duration * 60 * 1000))
      }
    }
    
    return {
      date,
      napCount,
      totalNapDuration,
      nightSleepDuration,
      totalSleepDuration: totalNapDuration + nightSleepDuration,
      bedtime,
      wakeTime
    }
  }
  
  const weeklyPatterns = computed(() => getPatternsForLastDays(7))
  const monthlyPatterns = computed(() => getPatternsForLastDays(30))
  
  const averages = computed(() => {
    const patterns = weeklyPatterns.value.filter(p => p.totalSleepDuration > 0)
    if (patterns.length === 0) return null
    
    const avg = patterns.reduce((acc, pattern) => ({
      napCount: acc.napCount + pattern.napCount,
      totalNapDuration: acc.totalNapDuration + pattern.totalNapDuration,
      nightSleepDuration: acc.nightSleepDuration + pattern.nightSleepDuration,
      totalSleepDuration: acc.totalSleepDuration + pattern.totalSleepDuration
    }), { napCount: 0, totalNapDuration: 0, nightSleepDuration: 0, totalSleepDuration: 0 })
    
    const count = patterns.length
    return {
      napCount: Math.round(avg.napCount / count * 10) / 10,
      totalNapDuration: Math.round(avg.totalNapDuration / count),
      nightSleepDuration: Math.round(avg.nightSleepDuration / count),
      totalSleepDuration: Math.round(avg.totalSleepDuration / count)
    }
  })
  
  return {
    weeklyPatterns,
    monthlyPatterns,
    averages,
    getPatternsForLastDays,
    analyzeDayPatterns
  }
}
