import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the API module
const mockFetch = vi.fn()
global.fetch = mockFetch

// Import the API functions
import { api, ApiError } from '../../src/services/api'

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Sleep Sessions API', () => {
    describe('getSleepSessions', () => {
      it('should fetch sleep sessions successfully', async () => {
        const mockSessions = [
          {
            id: '1',
            sleepType: 'nap',
            startTime: '2025-01-15T13:00:00.000Z',
            endTime: '2025-01-15T14:30:00.000Z',
            duration: 90,
            napNumber: 1,
            notes: 'Good nap',
            createdAt: '2025-01-15T13:00:00.000Z',
            updatedAt: '2025-01-15T14:30:00.000Z'
          },
          {
            id: '2',
            sleepType: 'night',
            startTime: '2025-01-15T19:00:00.000Z',
            endTime: null,
            duration: null,
            napNumber: null,
            notes: null,
            createdAt: '2025-01-15T19:00:00.000Z',
            updatedAt: '2025-01-15T19:00:00.000Z'
          }
        ]

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSessions)
        })

        const result = await api.getSleepSessions()

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sleep-sessions')
        )
        expect(result).toHaveLength(2)
        expect(result[0].startTime).toBeInstanceOf(Date)
        expect(result[0].endTime).toBeInstanceOf(Date)
        expect(result[1].endTime).toBeUndefined()
      })

      it('should handle API errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error')
        })

        await expect(api.getSleepSessions()).rejects.toThrow(ApiError)
      })
    })

    describe('getSleepSession', () => {
      it('should fetch a single sleep session successfully', async () => {
        const mockSession = {
          id: '1',
          sleepType: 'nap',
          startTime: '2025-01-15T13:00:00.000Z',
          endTime: '2025-01-15T14:30:00.000Z',
          duration: 90,
          napNumber: 1,
          notes: 'Good nap',
          createdAt: '2025-01-15T13:00:00.000Z',
          updatedAt: '2025-01-15T14:30:00.000Z'
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSession)
        })

        const result = await api.getSleepSession('1')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sleep-sessions/1')
        )
        expect(result.startTime).toBeInstanceOf(Date)
        expect(result.endTime).toBeInstanceOf(Date)
      })

      it('should handle session not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: () => Promise.resolve('Session not found')
        })

        await expect(api.getSleepSession('999')).rejects.toThrow(ApiError)
      })
    })

    describe('createSleepSession', () => {
      it('should create a new sleep session successfully', async () => {
        const newSessionRequest = {
          sleepType: 'nap' as const,
          startTime: '2025-01-15T13:00:00.000Z',
          napNumber: 1,
          notes: 'Starting nap'
        }

        const mockCreatedSession = {
          id: '1',
          sleepType: 'nap',
          startTime: '2025-01-15T13:00:00.000Z',
          endTime: null,
          duration: null,
          napNumber: 1,
          notes: 'Starting nap',
          createdAt: '2025-01-15T13:00:00.000Z',
          updatedAt: '2025-01-15T13:00:00.000Z'
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockCreatedSession)
        })

        const result = await api.createSleepSession(newSessionRequest)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sleep-sessions'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSessionRequest)
          })
        )
        expect(result.startTime).toBeInstanceOf(Date)
        expect(result.endTime).toBeUndefined()
      })

      it('should handle validation errors', async () => {
        const invalidRequest = {
          sleepType: 'invalid' as any,
          startTime: 'invalid-date',
          napNumber: -1
        }

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: () => Promise.resolve('Invalid sleep session data')
        })

        await expect(api.createSleepSession(invalidRequest)).rejects.toThrow(ApiError)
      })
    })

    describe('endSleepSession', () => {
      it('should end a sleep session successfully', async () => {
        const endSessionRequest = {
          endTime: '2025-01-15T14:30:00.000Z'
        }

        const mockUpdatedSession = {
          id: '1',
          sleepType: 'nap',
          startTime: '2025-01-15T13:00:00.000Z',
          endTime: '2025-01-15T14:30:00.000Z',
          duration: 90,
          napNumber: 1,
          notes: 'Good nap',
          createdAt: '2025-01-15T13:00:00.000Z',
          updatedAt: '2025-01-15T14:30:00.000Z'
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUpdatedSession)
        })

        const result = await api.endSleepSession('1', endSessionRequest)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sleep-sessions/1/end'),
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(endSessionRequest)
          })
        )
        expect(result.endTime).toBeInstanceOf(Date)
        expect(result.duration).toBe(90)
      })

      it('should end session without explicit request object', async () => {
        const mockUpdatedSession = {
          id: '1',
          sleepType: 'nap',
          startTime: '2025-01-15T13:00:00.000Z',
          endTime: '2025-01-15T14:30:00.000Z',
          duration: 90,
          napNumber: 1,
          notes: null,
          createdAt: '2025-01-15T13:00:00.000Z',
          updatedAt: '2025-01-15T14:30:00.000Z'
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUpdatedSession)
        })

        const result = await api.endSleepSession('1')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sleep-sessions/1/end'),
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          })
        )
        expect(result.endTime).toBeInstanceOf(Date)
      })

      it('should handle session not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: () => Promise.resolve('Session not found')
        })

        await expect(api.endSleepSession('999')).rejects.toThrow(ApiError)
      })
    })

    describe('deleteSleepSession', () => {
      it('should delete a sleep session successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204
        })

        await expect(api.deleteSleepSession('1')).resolves.toBeUndefined()

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sleep-sessions/1'),
          expect.objectContaining({
            method: 'DELETE'
          })
        )
      })

      it('should handle session not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: () => Promise.resolve('Session not found')
        })

        await expect(api.deleteSleepSession('999')).rejects.toThrow(ApiError)
      })
    })

    describe('Sleep Sessions API - Extended Features', () => {
      describe('updateSleepSession', () => {
        it('should update sleep session with partial data', async () => {
          const mockUpdatedSession = {
            id: '1',
            sleepType: 'nap',
            startTime: '2025-01-15T13:00:00.000Z',
            endTime: '2025-01-15T14:30:00.000Z',
            duration: 90,
            napNumber: 1,
            notes: 'Updated notes',
            createdAt: '2025-01-15T13:00:00.000Z',
            updatedAt: '2025-01-15T14:30:00.000Z'
          }

          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockUpdatedSession)
          })

          const result = await api.updateSleepSession('1', { notes: 'Updated notes' })

          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/sleep-sessions/1'),
            expect.objectContaining({
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ notes: 'Updated notes' })
            })
          )
          expect(result.notes).toBe('Updated notes')
          expect(result.startTime).toBeInstanceOf(Date)
          expect(result.endTime).toBeInstanceOf(Date)
        })

        it('should handle update session not found', async () => {
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            text: () => Promise.resolve('Sleep session not found')
          })

          await expect(api.updateSleepSession('999', { notes: 'test' })).rejects.toThrow(ApiError)
        })
      })

      describe('getSleepSessionStats', () => {
        it('should fetch sleep session statistics', async () => {
          const mockStats = {
            totalSessions: 10,
            napSessions: 7,
            nightSessions: 3,
            wakeEvents: 8,
            averageSleepDuration: 85,
            recentSleep: [
              { date: '2025-01-15', sessions: 3, avg_duration: 90, total_duration: 270 },
              { date: '2025-01-14', sessions: 2, avg_duration: 80, total_duration: 160 }
            ]
          }

          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockStats)
          })

          const result = await api.getSleepSessionStats()

          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/sleep-sessions/stats')
          )
          expect(result).toEqual(mockStats)
          expect(result.totalSessions).toBe(10)
          expect(result.averageSleepDuration).toBe(85)
          expect(result.recentSleep).toHaveLength(2)
        })

        it('should handle stats fetch errors', async () => {
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: () => Promise.resolve('Database error')
          })

          await expect(api.getSleepSessionStats()).rejects.toThrow(ApiError)
        })
      })

      describe('getSleepActivities', () => {      it('should fetch unified activity feed', async () => {
        const mockActivities = [
          {
            id: '1',
            type: 'sleep',
            timestamp: '2025-01-15T13:00:00.000Z',
            duration: 90,
            napNumber: 1,
            sleepType: 'nap',
            notes: 'Good nap'
          },
          {
            id: '2',
            type: 'wake',
            timestamp: '2025-01-15T14:30:00.000Z',
            duration: null,
            napNumber: null,
            sleepType: null,
            notes: null
          }
        ]

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockActivities)
        })

        const result = await api.getSleepActivities()

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sleep-sessions/activities')
        )
        expect(result).toHaveLength(2)
        expect(result[0].timestamp).toBeInstanceOf(Date)
        expect(result[1].timestamp).toBeInstanceOf(Date)
      })

      it('should fetch activities for specific date', async () => {
        const mockActivities = [
          {
            id: '1',
            type: 'sleep',
            timestamp: '2025-01-15T13:00:00.000Z',
            duration: 90,
            napNumber: 1,
            sleepType: 'nap',
            notes: 'Good nap'
          }
        ]

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockActivities)
        })

        const result = await api.getSleepActivities('2025-01-15')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sleep-sessions/activities?date=2025-01-15')
        )
        expect(result).toHaveLength(1)
        expect(result[0].timestamp).toBeInstanceOf(Date)
      })
      })

      describe('Sleep Session Validation', () => {
        it('should validate sleep session type', async () => {
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: () => Promise.resolve('sleepType must be either "nap" or "night"')
          })

          await expect(api.createSleepSession({
            sleepType: 'invalid' as any,
            startTime: new Date().toISOString()
          })).rejects.toThrow('sleepType must be either "nap" or "night"')
        })

        it('should handle missing required fields', async () => {
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: () => Promise.resolve('Missing required field: sleepType')
          })

          await expect(api.createSleepSession({
            sleepType: undefined as any,
            startTime: new Date().toISOString()
          })).rejects.toThrow('Missing required field: sleepType')
        })
      })

      describe('Sleep Session Lifecycle', () => {
        it('should handle complete sleep session lifecycle', async () => {
          const sessionId = '1'
          const startTime = new Date('2025-01-15T13:00:00.000Z')
          const endTime = new Date('2025-01-15T14:30:00.000Z')

          // Create session
          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 201,
            json: () => Promise.resolve({
              id: sessionId,
              sleepType: 'nap',
              startTime: startTime.toISOString(),
              endTime: null,
              duration: null,
              napNumber: 1,
              notes: 'Test nap',
              createdAt: startTime.toISOString(),
              updatedAt: startTime.toISOString()
            })
          })

          const createdSession = await api.createSleepSession({
            sleepType: 'nap',
            startTime: startTime.toISOString(),
            napNumber: 1,
            notes: 'Test nap'
          })

          expect(createdSession.id).toBe(sessionId)
          expect(createdSession.endTime).toBeUndefined()

          // End session
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
              id: sessionId,
              sleepType: 'nap',
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              duration: 90,
              napNumber: 1,
              notes: 'Test nap',
              createdAt: startTime.toISOString(),
              updatedAt: endTime.toISOString(),
              wakeEventId: '2',
              wakeTime: endTime.toISOString()
            })
          })

          const endedSession = await api.endSleepSession(sessionId, {
            endTime: endTime.toISOString()
          })

          expect(endedSession.endTime).toBeInstanceOf(Date)
          expect(endedSession.duration).toBe(90)
        })

        it('should handle ending session without explicit end time', async () => {
          const sessionId = '1'
          const now = new Date()

          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
              id: sessionId,
              sleepType: 'nap',
              startTime: '2025-01-15T13:00:00.000Z',
              endTime: now.toISOString(),
              duration: 90,
              napNumber: 1,
              notes: null,
              createdAt: '2025-01-15T13:00:00.000Z',
              updatedAt: now.toISOString()
            })
          })

          const result = await api.endSleepSession(sessionId)

          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining(`/api/sleep-sessions/${sessionId}/end`),
            expect.objectContaining({
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({})
            })
          )
          expect(result.endTime).toBeInstanceOf(Date)
        })

        it('should handle session already ended error', async () => {
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: () => Promise.resolve('Sleep session has already ended')
          })

          await expect(api.endSleepSession('1')).rejects.toThrow('Sleep session has already ended')
        })
      })
    })
  })

  describe('User Settings API', () => {
    describe('getUserSettings', () => {
      it('should fetch user settings successfully', async () => {
        const mockSettings = {
          id: '1',
          bedtime: '19:00',
          morningWake: '07:00',
          enableNapSuggestions: true,
          babyAge: {
            ageRange: 'infant',
            ageInMonths: 8
          },
          createdAt: '2025-01-15T10:00:00.000Z',
          updatedAt: '2025-01-15T10:00:00.000Z'
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSettings)
        })

        const result = await api.getUserSettings()

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user-settings')
        )
        expect(result).toEqual(mockSettings)
      })
    })

    describe('updateUserSettings', () => {
      it('should update user settings successfully', async () => {
        const updates = {
          bedtime: '20:00',
          enableNapSuggestions: false
        }

        const mockUpdatedSettings = {
          id: '1',
          bedtime: '20:00',
          morningWake: '07:00',
          enableNapSuggestions: false,
          babyAge: {
            ageRange: 'infant',
            ageInMonths: 8
          },
          createdAt: '2025-01-15T10:00:00.000Z',
          updatedAt: '2025-01-15T15:00:00.000Z'
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUpdatedSettings)
        })

        const result = await api.updateUserSettings(updates)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user-settings'),
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          })
        )
        expect(result.bedtime).toBe('20:00')
        expect(result.enableNapSuggestions).toBe(false)
      })
    })

    describe('resetUserSettings', () => {
      it('should reset user settings successfully', async () => {
        const mockResetSettings = {
          id: '1',
          bedtime: '19:00',
          morningWake: '07:00',
          enableNapSuggestions: true,
          babyAge: {
            ageRange: 'infant',
            ageInMonths: 6
          },
          createdAt: '2025-01-15T10:00:00.000Z',
          updatedAt: '2025-01-15T16:00:00.000Z'
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResetSettings)
        })

        const result = await api.resetUserSettings()

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user-settings/reset'),
          expect.objectContaining({
            method: 'POST'
          })
        )
        expect(result).toEqual(mockResetSettings)
      })
    })
  })

  describe('Health Check', () => {
    it('should perform health check successfully', async () => {
      const mockHealth = {
        status: 'ok',
        message: 'SleepyCarla API is running'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHealth)
      })

      const result = await api.healthCheck()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/health')
      )
      expect(result).toEqual(mockHealth)
    })

    it('should handle health check failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: () => Promise.resolve('Service Unavailable')
      })

      await expect(api.healthCheck()).rejects.toThrow(ApiError)
    })
  })

  describe('ApiError class', () => {
    it('should create ApiError with status and message', () => {
      const error = new ApiError(404, 'Not Found')
      
      expect(error.name).toBe('ApiError')
      expect(error.status).toBe(404)
      expect(error.message).toBe('Not Found')
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('Network and Error Handling', () => {
    it('should handle network failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'))

      await expect(api.getSleepSessions()).rejects.toThrow('Network Error')
    })

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'))

      await expect(api.createSleepSession({
        sleepType: 'nap',
        startTime: new Date().toISOString(),
        napNumber: 1
      })).rejects.toThrow('Request timeout')
    })

    it('should properly serialize Date objects in request body', async () => {
      const sessionRequest = {
        sleepType: 'nap' as const,
        startTime: new Date('2025-01-15T13:00:00.000Z').toISOString(),
        napNumber: 1,
        notes: 'Test nap'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          id: '1',
          ...sessionRequest,
          endTime: null,
          duration: null,
          createdAt: '2025-01-15T13:00:00.000Z',
          updatedAt: '2025-01-15T13:00:00.000Z'
        })
      })

      await api.createSleepSession(sessionRequest)

      const fetchCall = mockFetch.mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)
      
      expect(requestBody.startTime).toBe('2025-01-15T13:00:00.000Z')
      expect(typeof requestBody.startTime).toBe('string')
    })
  })
})
