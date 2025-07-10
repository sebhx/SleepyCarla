<script setup lang="ts">
import { computed } from "vue";
import type { SleepSession } from "../../../types/sleep-refactored";
import { Edit, Trash2, Moon, Bed } from "lucide-vue-next";

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

const getIcon = (entry: SleepSession) => {
  if (entry.sleepType === "nap" || (entry.napNumber && entry.napNumber > 0))
    return Moon;
  return Bed;
};

const getEntryDescription = (entry: SleepSession) => {
  if (entry.sleepType === "nap" || (entry.napNumber && entry.napNumber > 0))
    return "Nap";
  return "Night sleep";
};

const getEntryColor = (entry: SleepSession) => {
  if (entry.sleepType === "nap" || (entry.napNumber && entry.napNumber > 0))
    return "var(--baby-blue)";
  return "var(--baby-purple)";
};

const sortedEntries = computed(() => {
  return [...props.entries].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
});
</script>

<template>
  <div class="sleep-entries-card card">
    <div class="card-header">
      <h3 class="card-title">Today's Sleep Sessions</h3>
      <span class="entries-count">{{ entries.length }} entries</span>
    </div>

    <div v-if="entries.length === 0" class="no-entries">
      <Moon :size="48" color="var(--text-light)" />
      <p>No sleep entries for today</p>
    </div>

    <div v-else class="entries-list">
      <div v-for="entry in sortedEntries" :key="entry.id" class="entry-item">
        <div class="entry-icon">
          <component
            :is="getIcon(entry)"
            :size="20"
            :color="getEntryColor(entry)"
          />
        </div>

        <div class="entry-content">
          <div class="entry-header">
            <span class="entry-type">{{ getEntryDescription(entry) }}</span>
            <span class="entry-time">{{ entry.timeFormatted }}</span>
          </div>

          <div v-if="entry.durationFormatted" class="entry-duration">
            Duration: {{ entry.durationFormatted }}
          </div>

          <div v-if="entry.notes" class="entry-notes">
            {{ entry.notes }}
          </div>
        </div>

        <div class="entry-actions">
          <!-- Show edit/delete buttons for all sleep sessions -->
          <button
            @click="emit('edit-entry', entry)"
            :disabled="isLoading"
            class="btn btn-sm btn-secondary"
            title="Edit entry"
          >
            <Edit :size="16" />
          </button>
          <button
            @click="emit('delete-entry', entry.id)"
            :disabled="isLoading"
            class="btn btn-sm btn-danger"
            title="Delete entry"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sleep-entries-card {
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

.entries-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.entry-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--background-light);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
  transition: all var(--transition-base);
}

.entry-item:hover {
  box-shadow: var(--shadow-soft);
  transform: translateY(-1px);
}

.entry-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.entry-content {
  flex: 1;
  min-width: 0;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.entry-type {
  font-weight: 600;
  color: var(--text-dark);
}

.entry-time {
  font-size: var(--font-size-sm);
  color: var(--text-light);
  font-family: monospace;
}

.entry-duration {
  font-size: var(--font-size-sm);
  color: var(--text-light);
  margin-bottom: var(--spacing-xs);
}

.entry-notes {
  font-size: var(--font-size-sm);
  color: var(--text-light);
  font-style: italic;
  margin-top: var(--spacing-xs);
}

.entry-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.wake-entry-note {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--background-light);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-light);
}

.note-text {
  font-size: var(--font-size-xs);
  color: var(--text-light);
  font-style: italic;
}

@media (max-width: 768px) {
  .entry-item {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .entry-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .entry-actions {
    align-self: flex-end;
  }
}
</style>
