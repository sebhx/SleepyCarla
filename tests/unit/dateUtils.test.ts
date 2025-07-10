import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  formatDuration, 
  formatTime, 
  formatDate, 
  getStartOfDay, 
  getEndOfDay 
} from '../../src/shared/utils/dateUtils'

describe('dateUtils', () => {
  beforeEach(() => {
    // Mock system time to a known date for consistent testing
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T14:30:45.123Z'))
  })

  describe('formatDuration', () => {
    it('should format minutes only', () => {
      expect(formatDuration(45)).toBe('45m')
      expect(formatDuration(1)).toBe('1m')
      expect(formatDuration(59)).toBe('59m')
    })

    it('should format hours only', () => {
      expect(formatDuration(60)).toBe('1h')
      expect(formatDuration(120)).toBe('2h')
      expect(formatDuration(720)).toBe('12h')
    })

    it('should format hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30m')
      expect(formatDuration(150)).toBe('2h 30m')
      expect(formatDuration(61)).toBe('1h 1m')
      expect(formatDuration(665)).toBe('11h 5m')
    })

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0m')
    })

    it('should handle large durations', () => {
      expect(formatDuration(1440)).toBe('24h') // 24 hours
      expect(formatDuration(1441)).toBe('24h 1m') // 24 hours 1 minute
    })
  })

  describe('formatTime', () => {
    it('should format time in 24-hour format', () => {
      const date1 = new Date('2025-01-15T09:05:00')
      const date2 = new Date('2025-01-15T23:59:00')
      const date3 = new Date('2025-01-15T00:00:00')
      
      expect(formatTime(date1)).toBe('09:05')
      expect(formatTime(date2)).toBe('23:59')
      expect(formatTime(date3)).toBe('00:00')
    })

    it('should handle single digit hours and minutes', () => {
      const date = new Date('2025-01-15T01:07:00')
      expect(formatTime(date)).toBe('01:07')
    })
  })

  describe('formatDate', () => {
    it('should format date in YYYY-MM-DD format', () => {
      const date1 = new Date('2025-01-15T14:30:00Z')
      const date2 = new Date('2025-12-31T23:59:59Z')
      const date3 = new Date('2025-01-01T00:00:00Z')
      
      expect(formatDate(date1)).toBe('2025-01-15')
      expect(formatDate(date2)).toBe('2025-12-31')
      expect(formatDate(date3)).toBe('2025-01-01')
    })

    it('should handle timezone correctly', () => {
      // Test with different timezone dates
      const utcDate = new Date('2025-01-15T00:00:00.000Z')
      expect(formatDate(utcDate)).toBe('2025-01-15')
    })
  })

  describe('getStartOfDay', () => {
    it('should return start of day (00:00:00.000)', () => {
      const inputDate = new Date('2025-01-15T14:30:45.123')
      const startOfDay = getStartOfDay(inputDate)
      
      expect(startOfDay.getHours()).toBe(0)
      expect(startOfDay.getMinutes()).toBe(0)
      expect(startOfDay.getSeconds()).toBe(0)
      expect(startOfDay.getMilliseconds()).toBe(0)
      expect(startOfDay.getDate()).toBe(15)
      expect(startOfDay.getMonth()).toBe(0) // January
      expect(startOfDay.getFullYear()).toBe(2025)
    })

    it('should not modify the original date', () => {
      const originalDate = new Date('2025-01-15T14:30:45.123')
      const originalTime = originalDate.getTime()
      
      getStartOfDay(originalDate)
      
      expect(originalDate.getTime()).toBe(originalTime)
    })
  })

  describe('getEndOfDay', () => {
    it('should return end of day (23:59:59.999)', () => {
      const inputDate = new Date('2025-01-15T14:30:45.123')
      const endOfDay = getEndOfDay(inputDate)
      
      expect(endOfDay.getHours()).toBe(23)
      expect(endOfDay.getMinutes()).toBe(59)
      expect(endOfDay.getSeconds()).toBe(59)
      expect(endOfDay.getMilliseconds()).toBe(999)
      expect(endOfDay.getDate()).toBe(15)
      expect(endOfDay.getMonth()).toBe(0) // January
      expect(endOfDay.getFullYear()).toBe(2025)
    })

    it('should not modify the original date', () => {
      const originalDate = new Date('2025-01-15T14:30:45.123')
      const originalTime = originalDate.getTime()
      
      getEndOfDay(originalDate)
      
      expect(originalDate.getTime()).toBe(originalTime)
    })
  })

  describe('edge cases', () => {
    it('should handle leap year dates', () => {
      const leapYearDate = new Date('2024-02-29T12:00:00')
      expect(formatDate(leapYearDate)).toBe('2024-02-29')
      
      const startOfLeapDay = getStartOfDay(leapYearDate)
      expect(startOfLeapDay.getDate()).toBe(29)
      expect(startOfLeapDay.getMonth()).toBe(1) // February
    })

    it('should handle year boundaries', () => {
      const newYearsEve = new Date('2024-12-31T23:59:59')
      const endOfYear = getEndOfDay(newYearsEve)
      
      expect(endOfYear.getFullYear()).toBe(2024)
      expect(endOfYear.getMonth()).toBe(11) // December
      expect(endOfYear.getDate()).toBe(31)
    })

    it('should handle DST transitions', () => {
      // This test might behave differently in different timezones,
      // but it ensures the functions don't crash on DST boundaries
      const dstDate = new Date('2025-03-30T02:00:00') // Common DST transition date
      
      expect(() => formatDate(dstDate)).not.toThrow()
      expect(() => formatTime(dstDate)).not.toThrow()
      expect(() => getStartOfDay(dstDate)).not.toThrow()
      expect(() => getEndOfDay(dstDate)).not.toThrow()
    })
  })
})
