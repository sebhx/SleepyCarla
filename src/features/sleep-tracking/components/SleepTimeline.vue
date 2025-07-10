<script setup lang="ts">
import { computed } from "vue";
import type { SleepSession } from "../../../types/sleep-refactored";
import { formatTime } from "../../../shared/utils/dateUtils";
import {
  Edit,
  Trash2,
  Moon,
  Bed,
  Sun,
  Clock,
  StickyNote,
} from "lucide-vue-next";

interface Props {
  entries: Array<
    SleepSession & {
      timeFormatted: string;
      durationFormatted?: string;
    }
  >;
  isLoading: boolean;
}

interface Emits {
  (e: "edit-entry", entry: SleepSession): void;
  (e: "delete-entry", entryId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Create sleep session cards (combining start and wake events)
const sleepSessionCards = computed(() => {
  return props.entries
    .map((session) => ({
      id: session.id,
      session,
      isOngoing: !session.endTime,
      hasWakeEvent: !!session.endTime,
      startTime: session.timeFormatted,
      wakeTime: session.endTime ? formatTime(session.endTime) : undefined,
      sleepType: session.sleepType,
      duration: session.durationFormatted,
      notes: session.notes,
    }))
    .sort(
      (a, b) => b.session.startTime.getTime() - a.session.startTime.getTime()
    );
});

// Get appropriate icon for sleep type
const getSleepIcon = (sleepType: "nap" | "night") => {
  return sleepType === "nap" ? Moon : Bed;
};
</script>

<template>
  <div class="sleep-timeline-card card">
    <div class="card-header">
      <h3 class="card-title">Today's Sleep Timeline</h3>
      <span class="entries-count">{{ entries.length }} sessions</span>
    </div>

    <div v-if="entries.length === 0" class="no-entries">
      <Moon :size="48" color="var(--text-light)" />
      <p>No sleep sessions for today</p>
    </div>

    <div v-else class="sleep-sessions-container">
      <div
        v-for="card in sleepSessionCards"
        :key="card.id"
        class="sleep-session-card"
        :class="{
          'nap-card': card.sleepType === 'nap',
          'night-card': card.sleepType === 'night',
          'ongoing-card': card.isOngoing,
        }"
      >
        <!-- Card Header with Icon and Title -->
        <div class="card-header-section">
          <div class="sleep-header-info">
            <div class="sleep-icon" :class="`${card.sleepType}-icon`">
              <component
                :is="getSleepIcon(card.sleepType)"
                :size="24"
                color="white"
              />
            </div>
            <h3 class="sleep-title">
              {{ card.sleepType === "nap" ? "Nap" : "Night Sleep" }}
            </h3>
          </div>
        </div>

        <!-- Sleep Times Row -->
        <div class="sleep-times">
          <div class="time-item sleep-start-item">
            <component
              :is="getSleepIcon(card.sleepType)"
              :size="16"
              :color="'var(--baby-blue)'"
            />
            <span class="start-time">{{ card.startTime }}</span>
          </div>

          <span v-if="card.wakeTime" class="time-separator">→</span>

          <div v-if="card.wakeTime" class="time-item wake-item">
            <Sun :size="16" :color="'var(--baby-orange)'" />
            <span class="wake-time">{{ card.wakeTime }}</span>
          </div>

          <div v-if="card.isOngoing" class="time-item ongoing-item">
            <Clock :size="16" :color="'var(--baby-coral)'" />
            <span class="ongoing-text">In progress</span>
          </div>
        </div>

        <!-- Duration and Status -->
        <div v-if="card.duration || card.isOngoing" class="card-meta">
          <div v-if="card.duration" class="duration-info">
            <Clock :size="16" />
            <span class="duration-value">{{ card.duration }}</span>
          </div>
          <div v-if="card.isOngoing" class="ongoing-status">
            <div class="pulse-dot"></div>
            <span>Active</span>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="card.notes" class="card-notes">
          <div class="note-content">
            <StickyNote :size="16" :color="'var(--text-dark)'" />
            <p>{{ card.notes }}</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="card-actions">
          <button
            @click="emit('edit-entry', card.session)"
            :disabled="isLoading"
            class="btn btn-sm btn-secondary"
            title="Edit"
          >
            <Edit :size="16" />
          </button>
          <button
            @click="emit('delete-entry', card.session.id)"
            :disabled="isLoading"
            class="btn btn-sm btn-danger"
            title="Delete"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sleep-timeline-card {
  margin-bottom: var(--spacing-lg);
}

.entries-count {
  font-size: var(--font-size-sm);
  color: var(--text-light);
  background: var(--background-light);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
}

.no-entries {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--text-light);
}

.no-entries p {
  margin-top: var(--spacing-md);
  font-size: var(--font-size-lg);
}

.sleep-sessions-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) 0;
}

.sleep-session-card {
  background: var(--background-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-light);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.sleep-session-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.sleep-session-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
  background: var(--baby-blue);
}

.nap-card::before {
  background: var(--baby-blue);
}

.night-card::before {
  background: var(--baby-purple);
}

.ongoing-card::before {
  background: var(--baby-coral);
  animation: pulse-gradient 2s infinite;
}

@keyframes pulse-gradient {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.card-header-section {
  margin-bottom: var(--spacing-sm);
}

.sleep-header-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.sleep-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all var(--transition-base);
  flex-shrink: 0;
}

.nap-icon {
  background: var(--baby-blue);
}

.night-icon {
  background: var(--baby-purple);
}

.sleep-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-dark);
  margin: 0;
  line-height: 1.2;
}

.sleep-times {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-lg);
  font-weight: 600;
  flex-wrap: wrap;
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) 0;
}

.time-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.start-time {
  color: var(--baby-blue);
  font-family: "SF Mono", "Monaco", "Inconsolata", monospace;
}

.time-separator {
  color: var(--text-light);
  font-size: var(--font-size-md);
  margin: 0 var(--spacing-xs);
}

.wake-time {
  color: var(--baby-orange);
  font-family: "SF Mono", "Monaco", "Inconsolata", monospace;
}

.ongoing-text {
  color: var(--baby-coral);
  font-size: var(--font-size-md);
  font-style: italic;
  animation: pulse-text 2s infinite;
}

@keyframes pulse-text {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--background-light);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
}

.duration-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-dark);
  font-weight: 600;
}

.duration-value {
  font-size: var(--font-size-lg);
  color: var(--text-medium);
  font-family: "SF Mono", "Monaco", "Inconsolata", monospace;
}

.ongoing-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--baby-coral);
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--baby-coral);
  animation: pulse-dot 1.5s infinite;
}

@keyframes pulse-dot {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.card-notes {
  background: var(--baby-blue-light);
  border: 1px solid var(--baby-blue);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.note-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.note-content p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-dark);
  font-style: italic;
  line-height: 1.4;
  flex: 1;
}

.card-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
  margin-top: var(--spacing-md);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .sleep-session-card {
    padding: var(--spacing-md);
  }

  .sleep-icon {
    width: 40px;
    height: 40px;
  }

  .sleep-title {
    font-size: var(--font-size-lg);
  }

  .sleep-times {
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
  }

  .time-item {
    gap: var(--spacing-sm);
  }

  .card-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
}

/* Very small screens - stack sleep times vertically */
@media (max-width: 480px) {
  .sleep-times {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .sleep-session-card {
    background: var(--background-dark);
    border-color: var(--border-dark);
  }

  .card-meta {
    background: var(--background-darker);
    border-color: var(--border-dark);
  }
}
</style>
