/**
 * Sleep tracking composable using sleep sessions API
 * Uses modern SleepSession architecture with proper data types
 */

import { ref, computed, onMounted } from 'vue';
import dayjs from 'dayjs';
import type { SleepSession, SleepState } from '../../../types/sleep-refactored';
import { api } from '../../../services/api';
import { useErrorHandler } from '../../../shared/composables/useErrorHandler';
import { formatTime, formatDuration } from '../../../shared/utils/dateUtils';

export function useSleepSessionsTracking() {
  const { handleApiError, showSuccess } = useErrorHandler();
  
  // State
  const currentState = ref<SleepState>('awake');
  const sleepSessions = ref<SleepSession[]>([]);
  const currentActiveSessions = ref<SleepSession[]>([]);
  const currentTime = ref(new Date());
  const isLoading = ref(false);

  // Computed properties
  const currentTimeFormatted = computed(() => formatTime(currentTime.value));

  // Current active session (for duration tracking)
  const activeSession = computed(() => {
    return currentActiveSessions.value.find(session => !session.endTime);
  });

  const sleepDuration = computed(() => {
    if (!activeSession.value || currentState.value === 'awake') return 0;
    const duration = Math.floor(
      (currentTime.value.getTime() - activeSession.value.startTime.getTime()) / (1000 * 60)
    );
    return Math.max(0, duration);
  });

  const sleepDurationFormatted = computed(() => formatDuration(sleepDuration.value));

  // Recent sessions for today
  const recentSessions = computed(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const todaySessions = sleepSessions.value.filter((session) => {
      const sessionTime = new Date(session.startTime);
      return sessionTime >= todayStart && sessionTime <= todayEnd;
    });

    return [...todaySessions].reverse().map(session => ({
      ...session,
      timeFormatted: formatTime(session.startTime),
      durationFormatted: session.duration ? formatDuration(session.duration) : undefined,
    }));
  });

  // Methods
  const checkCurrentState = () => {
    const activeSessions = sleepSessions.value.filter(session => !session.endTime);
    currentActiveSessions.value = activeSessions;
    
    if (activeSessions.length > 0) {
      const activeSession = activeSessions[0];
      currentState.value = activeSession.sleepType === 'nap' ? 'napping' : 'nightSleep';
    } else {
      currentState.value = 'awake';
    }
  };

  const loadSleepSessions = async () => {
    try {
      isLoading.value = true;
      const sessions = await api.getSleepSessions();
      sleepSessions.value = sessions;
      checkCurrentState();
    } catch (error) {
      console.error('Failed to load sleep sessions:', error);
      handleApiError(error);
    } finally {
      isLoading.value = false;
    }
  };

  const startSleep = async (isNap: boolean = true) => {
    try {
      isLoading.value = true;
      const now = new Date();
      currentTime.value = now;

      // Calculate nap number for naps
      let napNumber: number | undefined;
      if (isNap) {
        const today = dayjs().startOf('day');
        const todaySessions = sleepSessions.value.filter(session => 
          session.sleepType === 'nap' && 
          dayjs(session.startTime).isAfter(today)
        );
        napNumber = todaySessions.length + 1;
      }

      const request = {
        sleepType: isNap ? 'nap' as const : 'night' as const,
        startTime: now.toISOString(),
        napNumber,
        notes: undefined,
      };

      const newSession = await api.createSleepSession(request);
      sleepSessions.value.push(newSession);
      checkCurrentState();
      
      showSuccess(`${isNap ? 'Nap' : 'Night sleep'} started`);
    } catch (error) {
      console.error('Failed to start sleep:', error);
      handleApiError(error);
    } finally {
      isLoading.value = false;
    }
  };

  const endSleep = async () => {
    const active = activeSession.value;
    if (!active) return;

    try {
      isLoading.value = true;
      const now = new Date();

      const request = {
        endTime: now.toISOString(),
      };

      const updatedSession = await api.endSleepSession(active.id, request);
      
      // Update the session in our local state
      const index = sleepSessions.value.findIndex(s => s.id === active.id);
      if (index !== -1) {
        sleepSessions.value[index] = updatedSession;
      }
      
      checkCurrentState();
      
      const sleepType = updatedSession.sleepType === 'nap' ? 'Nap' : 'Night sleep';
      const duration = updatedSession.duration ? formatDuration(updatedSession.duration) : '';
      const durationText = duration ? ` (${duration})` : '';
      showSuccess(`${sleepType} ended${durationText}`);
    } catch (error) {
      console.error('Failed to end sleep:', error);
      handleApiError(error);
    } finally {
      isLoading.value = false;
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      isLoading.value = true;
      
      // Check if it's a wake entry (has -wake suffix)
      if (entryId.includes('-wake')) {
        const sessionId = entryId.replace('-wake', '');
        // For wake entries, we need to "unend" the session (not supported yet)
        // For now, we'll delete the entire session
        await api.deleteSleepSession(sessionId);
        sleepSessions.value = sleepSessions.value.filter(s => s.id !== sessionId);
      } else {
        // It's a sleep session
        await api.deleteSleepSession(entryId);
        sleepSessions.value = sleepSessions.value.filter(s => s.id !== entryId);
      }
      
      checkCurrentState();
      showSuccess('Entry deleted');
    } catch (error) {
      console.error('Failed to delete entry:', error);
      handleApiError(error);
    } finally {
      isLoading.value = false;
    }
  };

  const addManualEntry = async (entryData: any) => {
    try {
      isLoading.value = true;
      
      const request = {
        sleepType: entryData.sleepType,
        startTime: entryData.timestamp, // transformed data uses 'timestamp' field
        napNumber: entryData.napNumber || (entryData.sleepType === 'nap' ? 1 : null),
        notes: entryData.notes,
      };

      let newSession = await api.createSleepSession(request);
      
      // If it has a duration, immediately end the session
      if (entryData.duration) {
        const endTime = new Date(entryData.timestamp.getTime() + entryData.duration * 60000);
        newSession = await api.endSleepSession(newSession.id, {
          endTime: endTime.toISOString(),
        });
      }
      
      sleepSessions.value.push(newSession);
      checkCurrentState();
      showSuccess('Manual entry added');
    } catch (error) {
      console.error('Failed to add manual entry:', error);
      handleApiError(error);
    } finally {
      isLoading.value = false;
    }
  };

  // Backward compatibility method for updating entries (which are actually sessions)
  const updateEntry = async (entryId: string, updates: any) => {
    try {
      isLoading.value = true;
      
      // Find the session to update
      const sessionIndex = sleepSessions.value.findIndex(session => session.id === entryId);
      if (sessionIndex === -1) {
        throw new Error('Session not found');
      }
      
      // Update session via API
      // For now, we'll recreate the session with new data
      // This is a simplified approach - in a real app you might want more granular update endpoints
      
      if (updates.type === 'sleep') {
        // Delete old session and create new one with updated data
        await api.deleteSleepSession(entryId);
        
        const newSessionRequest = {
          sleepType: updates.sleepType,
          startTime: updates.timestamp,
          napNumber: updates.napNumber || 1,
          notes: updates.notes,
        };

        let newSession = await api.createSleepSession(newSessionRequest);
        
        // If it had a duration, end the session immediately
        if (updates.duration) {
          const endTime = new Date(updates.timestamp.getTime() + updates.duration * 60000);
          newSession = await api.endSleepSession(newSession.id, {
            endTime: endTime.toISOString(),
          });
        }
        
        // Replace the old session with the new one
        sleepSessions.value[sessionIndex] = newSession;
      }
      
      checkCurrentState();
      showSuccess('Entry updated');
    } catch (error) {
      console.error('Failed to update entry:', error);
      handleApiError(error);
    } finally {
      isLoading.value = false;
    }
  };

  // Update current time every minute
  const updateCurrentTime = () => {
    currentTime.value = new Date();
  };

  // Initialize
  onMounted(() => {
    loadSleepSessions();
    
    // Update time every minute
    const interval = setInterval(updateCurrentTime, 60000);
    
    // Cleanup
    return () => clearInterval(interval);
  });

  return {
    // State
    currentState,
    sleepSessions,
    recentSessions,
    currentTime,
    isLoading,

    // Computed
    currentTimeFormatted,
    sleepDuration,
    sleepDurationFormatted,
    activeSession,

    // Actions
    startSleep,
    endSleep,
    deleteEntry,
    addManualEntry,
    loadSleepSessions,
    checkCurrentState,
    updateEntry,
  };
}
