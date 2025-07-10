<script setup lang="ts">
import { ref, computed } from "vue";
import { Plus, Settings, BarChart3, Calendar } from "lucide-vue-next";

// Components
import SleepStatusCard from "./components/SleepStatusCard.vue";
import SleepTimeline from "./components/SleepTimeline.vue";
import WakeWindowCard from "./components/WakeWindowCard.vue";
import ManualEntryModal from "./components/ManualEntryModal.vue";
import AllActivitiesModal from "./components/AllActivitiesModal.vue";
import SettingsModal from "../settings/components/SettingsModal.vue";
import SleepAnalytics from "../analytics/components/SleepAnalytics.vue";
import SleepScheduleDonut from "../analytics/components/SleepScheduleDonut.vue";

// Composables
import { useSleepSessionsTracking } from "./composables/useSleepSessionsTracking";
import { useSettings } from "../../shared/composables/useSettings";
import { useWakeWindows } from "./composables/useWakeWindows";

// Main state management
const {
  currentState,
  sleepSessions,
  currentTimeFormatted,
  sleepDurationFormatted,
  recentSessions,
  isLoading,
  startSleep,
  endSleep,
  deleteEntry,
  updateEntry, // For backward compatibility
  addManualEntry,
} = useSleepSessionsTracking();

// Settings
const { settings } = useSettings();

// Wake windows
const { getCurrentWakeWindowStatus } = useWakeWindows();

// Modal states
const showSettingsModal = ref(false);
const showManualEntryModal = ref(false);
const showAllActivitiesModal = ref(false);
const showAnalyticsModal = ref(false);

// Import types
import type {
  SleepSession,
  SleepActivityEntry,
} from "../../types/sleep-refactored";

// Edit state
const editingEntry = ref<SleepSession | null>(null);
const showEditModal = ref(false);

// Computed
const wakeWindowStatus = computed(() => {
  if (!settings.value.enableNapSuggestions) return null;

  // Convert SleepSession[] to SleepActivityEntry[] for wake window calculation
  const sleepActivities: SleepActivityEntry[] = [];
  sleepSessions.value.forEach((session) => {
    // Add sleep activity
    sleepActivities.push({
      id: session.id,
      type: "sleep",
      timestamp: session.startTime,
      duration: session.duration,
      sleepType: session.sleepType,
      napNumber: session.napNumber,
      notes: session.notes,
    });

    // Add wake activity if session ended
    if (session.endTime) {
      sleepActivities.push({
        id: `${session.id}-wake`,
        type: "wake",
        timestamp: session.endTime,
        sleepSessionId: session.id,
      });
    }
  });

  const rawStatus = getCurrentWakeWindowStatus(
    sleepActivities,
    settings.value.babyAge.ageRange,
    new Date()
  );

  if (!rawStatus) return null;

  // Transform the raw status to match WakeWindowStatus interface
  return {
    isOptimal: rawStatus.status === "optimal",
    nextNapTime: rawStatus.nextNapTime ? rawStatus.nextNapTime.earliest : null,
    timeUntilNap: rawStatus.nextNapTime
      ? Math.max(
          0,
          Math.floor(
            (rawStatus.nextNapTime.earliest.getTime() - new Date().getTime()) /
              (1000 * 60)
          )
        )
      : 0,
    message: rawStatus.message,
    confidence: rawStatus.confidence,
  };
});

// Convert SleepSession[] to SleepActivityEntry[] for analytics components
const sleepEntries = computed(() => {
  const activities: SleepActivityEntry[] = [];
  sleepSessions.value.forEach((session) => {
    // Add sleep activity
    activities.push({
      id: session.id,
      type: "sleep",
      timestamp: session.startTime,
      duration: session.duration,
      sleepType: session.sleepType,
      napNumber: session.napNumber,
      notes: session.notes,
    });

    // Add wake activity if session ended
    if (session.endTime) {
      activities.push({
        id: `${session.id}-wake`,
        type: "wake",
        timestamp: session.endTime,
        sleepSessionId: session.id,
      });
    }
  });

  return activities.sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
});

// Methods
const handleStartNap = () => startSleep(true);
const handleStartNight = () => startSleep(false);
const handleEndSleep = () => endSleep();

const handleEditEntry = (entry: SleepSession) => {
  editingEntry.value = entry;
  showEditModal.value = true;
};

// Helper function to transform manual entry form data to API format
const transformFormDataToApiFormat = (formData: {
  type: "nap" | "night";
  entryMethod: "start-duration" | "start-end";
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  durationHours: number;
  durationMinutes: number;
  notes: string;
}) => {
  // Parse start date and time
  const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
  let duration: number;

  if (formData.entryMethod === "start-duration") {
    // Calculate duration from hours and minutes
    duration = formData.durationHours * 60 + formData.durationMinutes;
  } else {
    // Calculate duration from start and end times
    let endDateTime: Date;
    if (formData.endDate) {
      endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    } else {
      // Same day
      endDateTime = new Date(`${formData.startDate}T${formData.endTime}`);
    }

    // If end time is before start time, assume it's the next day
    if (endDateTime.getTime() <= startDateTime.getTime()) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    duration = Math.floor(
      (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60)
    );
  }

  return {
    type: "sleep" as const,
    timestamp: startDateTime,
    sleepType: formData.type,
    duration,
    notes: formData.notes || undefined,
  };
};

// Edit entry computed
const editEntryData = computed(() => {
  if (!editingEntry.value) return undefined;

  return {
    type: editingEntry.value.sleepType,
    entryMethod: "start-duration" as "start-duration" | "start-end",
    startDate: editingEntry.value.startTime.toISOString().split("T")[0],
    startTime: editingEntry.value.startTime.toTimeString().slice(0, 5),
    endDate: editingEntry.value.startTime.toISOString().split("T")[0],
    endTime: "",
    durationHours: Math.floor((editingEntry.value.duration || 0) / 60),
    durationMinutes: (editingEntry.value.duration || 0) % 60,
    notes: editingEntry.value.notes || "",
  };
});

const handleDeleteEntry = (entryId: string) => {
  if (confirm("Are you sure you want to delete this entry?")) {
    deleteEntry(entryId);
  }
};

const handleManualEntry = async (entryData: any) => {
  try {
    // Transform the form data to API format (same as used for editing)
    const apiData = transformFormDataToApiFormat(entryData);
    await addManualEntry(apiData);
    showManualEntryModal.value = false;
  } catch (error) {
    console.error("Failed to add manual entry:", error);
    // Error handling is already done in addManualEntry
  }
};

const handleEntryEdit = (entryData: any) => {
  if (editingEntry.value) {
    const apiData = transformFormDataToApiFormat(entryData);
    updateEntry(editingEntry.value.id, apiData);
    showEditModal.value = false;
    editingEntry.value = null;
  }
};
</script>

<template>
  <div class="sleep-tracker">
    <!-- Header -->
    <div class="tracker-header">
      <div class="header-content">
        <h1 class="app-title">
          <span class="app-icon">👶</span>
          SleepyCarla
        </h1>
        <div class="header-actions">
          <button
            @click="showManualEntryModal = true"
            class="btn btn-primary btn-sm"
            title="Add Manual Entry"
          >
            <Plus :size="16" />
          </button>
          <button
            @click="showAllActivitiesModal = true"
            class="btn btn-secondary btn-sm"
            title="View All Activities"
          >
            <Calendar :size="16" />
          </button>
          <button
            @click="showAnalyticsModal = true"
            class="btn btn-secondary btn-sm"
            title="View Analytics"
          >
            <BarChart3 :size="16" />
          </button>
          <button
            @click="showSettingsModal = true"
            class="btn btn-secondary btn-sm"
            title="Settings"
          >
            <Settings :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="tracker-content">
      <!-- Sleep Status Card -->
      <SleepStatusCard
        :current-state="currentState"
        :is-loading="isLoading"
        :current-time="currentTimeFormatted"
        :sleep-duration="sleepDurationFormatted"
        @start-nap="handleStartNap"
        @start-night="handleStartNight"
        @end-sleep="handleEndSleep"
      />

      <!-- Wake Window Card -->
      <WakeWindowCard
        :wake-window-status="wakeWindowStatus"
        :enabled="settings.enableNapSuggestions"
        :baby-age="settings.babyAge.ageRange"
      />

      <!-- Sleep Timeline -->
      <SleepTimeline
        :entries="recentSessions"
        :is-loading="isLoading"
        @edit-entry="handleEditEntry"
        @delete-entry="handleDeleteEntry"
      />

      <!-- Analytics Preview -->
      <div class="analytics-preview">
        <SleepScheduleDonut
          :sleep-entries="sleepEntries"
          :settings="settings"
        />
      </div>
    </div>

    <!-- Modals -->
    <SettingsModal
      :is-open="showSettingsModal"
      @close="showSettingsModal = false"
    />

    <ManualEntryModal
      :is-open="showManualEntryModal"
      @close="showManualEntryModal = false"
      @save="handleManualEntry"
    />

    <ManualEntryModal
      :is-open="showEditModal"
      :is-edit="true"
      :initial-data="editEntryData"
      @close="showEditModal = false"
      @save="handleEntryEdit"
    />

    <AllActivitiesModal
      :is-open="showAllActivitiesModal"
      :sleep-entries="sleepSessions"
      @close="showAllActivitiesModal = false"
      @edit-entry="handleEditEntry"
      @delete-entry="handleDeleteEntry"
    />

    <!-- Analytics Modal -->
    <div
      v-if="showAnalyticsModal"
      class="modal-overlay"
      @click="showAnalyticsModal = false"
    >
      <div class="modal analytics-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Sleep Analytics</h2>
          <button @click="showAnalyticsModal = false" class="modal-close">
            ×
          </button>
        </div>
        <div class="modal-content">
          <SleepAnalytics :sleep-entries="sleepEntries" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sleep-tracker {
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
}

.tracker-header {
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-soft);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-lg);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
  font-size: var(--font-size-xxl);
  font-weight: 700;
  color: var(--text-dark);
}

.app-icon {
  font-size: 2rem;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.tracker-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.analytics-preview {
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-soft);
  padding: var(--spacing-lg);
}

.analytics-modal {
  max-width: 800px;
  width: 90vw;
  max-height: 90vh;
}

.analytics-modal .modal-content {
  max-height: 70vh;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .header-actions {
    flex-wrap: wrap;
    justify-content: center;
  }

  .analytics-modal {
    width: 95vw;
    max-height: 95vh;
  }
}
</style>
