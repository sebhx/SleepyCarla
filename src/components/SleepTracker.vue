<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { SleepEntry, SleepState } from "../types/sleep";
import { api } from "../services/api";
import SleepAnalytics from "./SleepAnalytics.vue";
import SleepScheduleDonut from "./SleepScheduleDonut.vue";
import SettingsModal from "./SettingsModal.vue";
import ManualEntryModal from "./ManualEntryModal.vue";
import AllActivitiesModal from "./AllActivitiesModal.vue";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Moon,
  Sun,
  Bed,
  Clock,
  Baby,
  Timer,
  Calendar,
  Info,
  CheckCircle,
  AlertCircle,
} from "lucide-vue-next";
import { useSettings } from "../composables/useSettings";
import { useWakeWindows } from "../composables/useWakeWindows";

// Settings system
const { settings, saveSettings } = useSettings();
const showSettingsModal = ref(false);

// Wake window calculations
const { getCurrentWakeWindowStatus } = useWakeWindows();

// Reactive state
const currentState = ref<SleepState>("awake");
const sleepEntries = ref<SleepEntry[]>([]);
const currentTime = ref(new Date());
const lastSleepStart = ref<Date | null>(null);
const isLoading = ref(false);

// Manual entry modal state
const showManualEntryModal = ref(false);
const manualEntryForm = ref({
  type: "nap" as "nap" | "night",
  entryMethod: "start-duration" as "start-duration" | "start-end",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  durationHours: 0,
  durationMinutes: 30,
  notes: "",
});

// Edit entry state
const editingEntry = ref<SleepEntry | null>(null);
const showEditModal = ref(false);

// Show all activities modal state
const showAllActivitiesModal = ref(false);

// Error handling
const errorMessage = ref("");
const showError = ref(false);

// API helper functions
const showErrorMessage = (message: string) => {
  errorMessage.value = message;
  showError.value = true;
  setTimeout(() => {
    showError.value = false;
  }, 5000);
};

const loadSleepEntries = async () => {
  try {
    isLoading.value = true;
    const entries = await api.getSleepEntries();
    // Convert timestamp strings back to Date objects
    sleepEntries.value = entries.map((entry) => ({
      ...entry,
      timestamp: new Date(entry.timestamp),
    }));

    // Check current state based on last entry
    checkCurrentState();
  } catch (error) {
    console.error("Failed to load sleep entries:", error);
    showErrorMessage("Failed to load sleep data. Using offline mode.");
  } finally {
    isLoading.value = false;
  }
};

const checkCurrentState = () => {
  const recentEntries = [...sleepEntries.value].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
  const lastEntry = recentEntries[0]; // Most recent entry

  if (lastEntry && lastEntry.type === "sleep" && !lastEntry.duration) {
    // We have an ongoing sleep
    currentState.value =
      lastEntry.sleepType === "nap" ? "napping" : "nightSleep";
    lastSleepStart.value = lastEntry.timestamp;
  } else {
    currentState.value = "awake";
    lastSleepStart.value = null;
  }
};

// Update current time every 30 seconds for better accuracy
onMounted(() => {
  const updateTime = () => {
    currentTime.value = new Date();
  };
  updateTime();
  setInterval(updateTime, 30000); // Update every 30 seconds

  // Load existing sleep entries
  loadSleepEntries();
});

// Computed properties
const currentTimeFormatted = computed(() => {
  return currentTime.value.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
});

const sleepDuration = computed(() => {
  if (!lastSleepStart.value || currentState.value === "awake") return 0;
  const duration = Math.floor(
    (currentTime.value.getTime() - lastSleepStart.value.getTime()) / (1000 * 60)
  );
  return Math.max(0, duration); // Ensure never negative
});

const sleepDurationFormatted = computed(() => {
  const hours = Math.floor(sleepDuration.value / 60);
  const minutes = sleepDuration.value % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Wake window recommendations
const wakeWindowStatus = computed(() => {
  if (!settings.value.enableNapSuggestions) return null;
  return getCurrentWakeWindowStatus(
    sleepEntries.value,
    settings.value.babyAge.ageRange,
    currentTime.value
  );
});

// Sort entries by timestamp
const sortedEntries = computed(() => {
  return [...sleepEntries.value].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
});

// Recent entries for display (all entries from today, sorted by time)
const recentEntries = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEntries = sortedEntries.value.filter((entry) => {
    const entryDate = new Date(entry.timestamp);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });

  return todayEntries
    .reverse() // Most recent first
    .map((entry) => {
      let durationFormatted: string | undefined;
      if (entry.duration) {
        if (entry.duration >= 60) {
          durationFormatted = `${Math.floor(entry.duration / 60)}h ${
            entry.duration % 60
          }m`;
        } else {
          durationFormatted = `${entry.duration}m`;
        }
      }

      return {
        ...entry,
        timeFormatted: entry.timestamp.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        durationFormatted,
      };
    });
});

// Functions
const startSleep = async (isNap: boolean = true) => {
  try {
    isLoading.value = true;
    const now = new Date();
    currentTime.value = now; // Sync current time immediately
    lastSleepStart.value = now;

    // Create sleep entry
    const entry: Omit<SleepEntry, "id"> = {
      type: "sleep",
      timestamp: now,
      sleepType: isNap ? "nap" : "night",
    };

    const createdEntry = await api.createSleepEntry(entry);

    // Convert timestamp string to Date object before adding to local state
    const processedEntry = {
      ...createdEntry,
      timestamp: new Date(createdEntry.timestamp),
    };

    sleepEntries.value.push(processedEntry);

    // Update state
    if (isNap) {
      currentState.value = "napping";
    } else {
      currentState.value = "nightSleep";
    }
  } catch (error) {
    console.error("Failed to start sleep:", error);
    showErrorMessage("Failed to record sleep start. Please try again.");
  } finally {
    isLoading.value = false;
  }
};

const endSleep = async () => {
  if (!lastSleepStart.value) return;

  try {
    isLoading.value = true;
    const now = new Date();
    const duration = Math.floor(
      (now.getTime() - lastSleepStart.value.getTime()) / (1000 * 60)
    );

    // Update the sleep entry with duration
    const lastSleepEntry = sleepEntries.value[sleepEntries.value.length - 1];
    if (lastSleepEntry && lastSleepEntry.type === "sleep") {
      const updatedEntry = await api.updateSleepEntry(lastSleepEntry.id, {
        duration,
      });
      // Update local entry (convert timestamp to Date object)
      const processedUpdatedEntry = {
        ...updatedEntry,
        timestamp: new Date(updatedEntry.timestamp),
      };
      Object.assign(lastSleepEntry, processedUpdatedEntry);
    }

    // Create wake entry
    const wakeEntry: Omit<SleepEntry, "id"> = {
      type: "wake",
      timestamp: now,
    };

    const createdWakeEntry = await api.createSleepEntry(wakeEntry);

    // Convert timestamp string to Date object before adding to local state
    const processedWakeEntry = {
      ...createdWakeEntry,
      timestamp: new Date(createdWakeEntry.timestamp),
    };

    sleepEntries.value.push(processedWakeEntry);

    // Reset state
    currentState.value = "awake";
    lastSleepStart.value = null;
  } catch (error) {
    console.error("Failed to end sleep:", error);
    showErrorMessage("Failed to record wake up. Please try again.");
  } finally {
    isLoading.value = false;
  }
};

// Manual entry functions
const openManualEntryModal = () => {
  resetManualEntryForm();
  showManualEntryModal.value = true;
};

const resetManualEntryForm = () => {
  const now = new Date();

  manualEntryForm.value = {
    type: "nap",
    entryMethod: "start-duration",
    startDate: now.toISOString().split("T")[0],
    startTime: now.toTimeString().slice(0, 5),
    endDate: now.toISOString().split("T")[0],
    endTime: "",
    durationHours: 0,
    durationMinutes: 30,
    notes: "",
  };
};

const validateTimeOverlap = (
  startTime: Date,
  endTime: Date,
  excludeId?: string
): boolean => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaySleepPairs = sortedEntries.value.filter(
    (entry) =>
      entry.timestamp >= todayStart &&
      entry.type === "sleep" &&
      entry.duration &&
      entry.id !== excludeId
  );

  for (const sleepEntry of todaySleepPairs) {
    const sleepStart = sleepEntry.timestamp;
    const sleepEnd = new Date(
      sleepStart.getTime() + sleepEntry.duration! * 60 * 1000
    );

    // Check for overlap
    if (startTime < sleepEnd && endTime > sleepStart) {
      return false; // Overlap detected
    }
  }

  return true; // No overlap
};

const submitManualEntry = async (formData: any) => {
  try {
    isLoading.value = true;
    let startTime: Date;
    let duration: number;

    if (formData.entryMethod === "start-duration") {
      const [hours, minutes] = formData.startTime.split(":").map(Number);
      const startDate = new Date(formData.startDate);
      startTime = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        hours,
        minutes
      );
      duration = formData.durationHours * 60 + formData.durationMinutes;
    } else {
      const [startHours, startMinutes] = formData.startTime
        .split(":")
        .map(Number);
      const [endHours, endMinutes] = formData.endTime.split(":").map(Number);

      const startDate = new Date(formData.startDate);
      startTime = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        startHours,
        startMinutes
      );

      // Use endDate from form data if provided, otherwise use startDate
      const endDate = formData.endDate || formData.startDate;
      const endDateObj = new Date(endDate);
      let endTimeTemp = new Date(
        endDateObj.getFullYear(),
        endDateObj.getMonth(),
        endDateObj.getDate(),
        endHours,
        endMinutes
      );

      // If no explicit endDate was provided, handle case where end time is next day
      if (!formData.endDate && endTimeTemp <= startTime) {
        endTimeTemp.setDate(endTimeTemp.getDate() + 1);
      }

      duration = Math.floor(
        (endTimeTemp.getTime() - startTime.getTime()) / (1000 * 60)
      );
    }

    if (duration <= 0) {
      throw new Error("Duration must be greater than 0");
    }

    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    // Validate overlap
    if (!validateTimeOverlap(startTime, endTime)) {
      throw new Error(
        "This sleep time overlaps with an existing entry. Please adjust the times."
      );
    }

    // Create sleep entry
    const sleepEntryData: Omit<SleepEntry, "id"> = {
      type: "sleep",
      timestamp: startTime,
      duration,
      sleepType: formData.type,
      notes: formData.notes || undefined,
    };

    // Create wake entry
    const wakeEntryData: Omit<SleepEntry, "id"> = {
      type: "wake",
      timestamp: endTime,
    };

    // Save to API
    const [createdSleepEntry, createdWakeEntry] = await Promise.all([
      api.createSleepEntry(sleepEntryData),
      api.createSleepEntry(wakeEntryData),
    ]);

    // Convert timestamp strings to Date objects before adding to local state
    const processedSleepEntry = {
      ...createdSleepEntry,
      timestamp: new Date(createdSleepEntry.timestamp),
    };

    const processedWakeEntry = {
      ...createdWakeEntry,
      timestamp: new Date(createdWakeEntry.timestamp),
    };

    sleepEntries.value.push(processedSleepEntry, processedWakeEntry);

    // Close modal and clear any errors on success
    showManualEntryModal.value = false;
    clearError();
  } catch (error) {
    console.error("Failed to submit manual entry:", error);
    showErrorMessage(
      error instanceof Error ? error.message : "An error occurred"
    );
    // Don't close modal on error - let user see the error and try again
  } finally {
    isLoading.value = false;
  }
};

const editEntry = (entry: SleepEntry) => {
  editingEntry.value = entry;

  if (entry.type === "sleep") {
    manualEntryForm.value = {
      type: entry.sleepType || (entry.napNumber ? "nap" : "night"), // backwards compatibility
      entryMethod: "start-duration",
      startDate: entry.timestamp.toISOString().split("T")[0],
      startTime: entry.timestamp.toTimeString().slice(0, 5),
      endDate: entry.timestamp.toISOString().split("T")[0], // Will be calculated later
      endTime: "",
      durationHours: Math.floor((entry.duration || 0) / 60),
      durationMinutes: (entry.duration || 0) % 60,
      notes: entry.notes || "",
    };
  }

  showEditModal.value = true;
};

const updateEntryFromModal = async (formData: any) => {
  if (!editingEntry.value) return;

  try {
    isLoading.value = true;
    let startTime: Date;
    let duration: number;

    if (formData.entryMethod === "start-duration") {
      const [hours, minutes] = formData.startTime.split(":").map(Number);
      const startDate = new Date(formData.startDate);
      startTime = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        hours,
        minutes
      );
      duration = formData.durationHours * 60 + formData.durationMinutes;
    } else {
      const [startHours, startMinutes] = formData.startTime
        .split(":")
        .map(Number);
      const [endHours, endMinutes] = formData.endTime.split(":").map(Number);

      const startDate = new Date(formData.startDate);
      startTime = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        startHours,
        startMinutes
      );

      let endTimeTemp = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        endHours,
        endMinutes
      );

      // Handle case where end time is next day
      if (endTimeTemp <= startTime) {
        endTimeTemp.setDate(endTimeTemp.getDate() + 1);
      }

      duration = Math.floor(
        (endTimeTemp.getTime() - startTime.getTime()) / (1000 * 60)
      );
    }

    if (duration <= 0) {
      throw new Error("Duration must be greater than 0");
    }

    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    // Validate overlap (excluding current entry)
    if (!validateTimeOverlap(startTime, endTime, editingEntry.value.id)) {
      throw new Error(
        "This sleep time overlaps with an existing entry. Please adjust the times."
      );
    }

    // Update sleep entry
    const updatedSleepEntry: SleepEntry = {
      ...editingEntry.value,
      timestamp: startTime,
      duration,
      sleepType: formData.type,
      notes: formData.notes || undefined,
    };

    // Find and update corresponding wake entry
    const wakeEntry = sleepEntries.value.find(
      (entry) =>
        entry.type === "wake" &&
        Math.abs(
          entry.timestamp.getTime() -
            (editingEntry.value!.timestamp.getTime() +
              (editingEntry.value!.duration || 0) * 60 * 1000)
        ) < 60000
    );

    if (wakeEntry) {
      const updatedWakeEntry: SleepEntry = {
        ...wakeEntry,
        timestamp: endTime,
      };

      // Update both entries
      await Promise.all([
        api.updateSleepEntry(editingEntry.value.id, updatedSleepEntry),
        api.updateSleepEntry(wakeEntry.id, updatedWakeEntry),
      ]);

      // Update local state
      const sleepIndex = sleepEntries.value.findIndex(
        (entry) => entry.id === editingEntry.value!.id
      );
      const wakeIndex = sleepEntries.value.findIndex(
        (entry) => entry.id === wakeEntry.id
      );

      if (sleepIndex !== -1) {
        sleepEntries.value[sleepIndex] = updatedSleepEntry;
      }
      if (wakeIndex !== -1) {
        sleepEntries.value[wakeIndex] = updatedWakeEntry;
      }
    } else {
      // Only update sleep entry if wake entry not found
      await api.updateSleepEntry(editingEntry.value.id, updatedSleepEntry);

      const sleepIndex = sleepEntries.value.findIndex(
        (entry) => entry.id === editingEntry.value!.id
      );
      if (sleepIndex !== -1) {
        sleepEntries.value[sleepIndex] = updatedSleepEntry;
      }
    }

    showEditModal.value = false;
    editingEntry.value = null;
    clearError();
  } catch (error) {
    console.error("Failed to update entry:", error);
    showErrorMessage(
      error instanceof Error ? error.message : "An error occurred"
    );
  } finally {
    isLoading.value = false;
  }
};

const deleteEntry = async (entryId: string) => {
  if (confirm("Are you sure you want to delete this entry?")) {
    try {
      isLoading.value = true;
      const entryIndex = sleepEntries.value.findIndex((e) => e.id === entryId);
      if (entryIndex !== -1) {
        const entry = sleepEntries.value[entryIndex];

        if (entry.type === "sleep") {
          // Also delete the corresponding wake entry if it exists
          const nextEntry = sleepEntries.value[entryIndex + 1];
          if (nextEntry && nextEntry.type === "wake") {
            // Delete both entries from API
            await Promise.all([
              api.deleteSleepEntry(entry.id),
              api.deleteSleepEntry(nextEntry.id),
            ]);
            sleepEntries.value.splice(entryIndex, 2); // Remove both entries
          } else {
            await api.deleteSleepEntry(entry.id);
            sleepEntries.value.splice(entryIndex, 1);
          }
        } else {
          await api.deleteSleepEntry(entry.id);
          sleepEntries.value.splice(entryIndex, 1);
        }
      }
    } catch (error) {
      console.error("Failed to delete entry:", error);
      showErrorMessage("Failed to delete entry. Please try again.");
    } finally {
      isLoading.value = false;
    }
  }
};

// Show all activities modal
const openAllActivitiesModal = () => {
  showAllActivitiesModal.value = true;
};

const closeAllActivitiesModal = () => {
  showAllActivitiesModal.value = false;
};

const clearError = () => {
  showError.value = false;
  errorMessage.value = "";
};

const closeModal = () => {
  showManualEntryModal.value = false;
  showEditModal.value = false;
  editingEntry.value = null;
  clearError();
};
</script>

<template>
  <div class="sleep-tracker">
    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <h1 class="app-title">
          <Moon :size="24" color="var(--baby-purple)" />
          SleepyCarla
          <Baby :size="24" color="var(--baby-pink)" />
        </h1>
        <button
          class="settings-button"
          @click="showSettingsModal = true"
          aria-label="Settings"
        >
          <Settings :size="20" />
        </button>
      </div>
      <div class="header-bottom">
        <div class="current-time">{{ currentTimeFormatted }}</div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="showError" class="error-message">
      <span class="error-icon">⚠️</span>
      {{ errorMessage }}
    </div>

    <!-- Current Status Card -->
    <div class="status-card">
      <div class="status-content">
        <div class="status-icon">
          <Sun
            v-if="currentState === 'awake'"
            :size="32"
            color="var(--baby-orange)"
          />
          <Moon
            v-else-if="currentState === 'napping'"
            :size="32"
            color="var(--baby-blue)"
          />
          <Bed v-else :size="32" color="var(--baby-purple)" />
        </div>

        <div class="status-text">
          <h2 v-if="currentState === 'awake'">Baby is Awake</h2>
          <h2 v-else-if="currentState === 'napping'">Napping</h2>
          <h2 v-else>Night Sleep</h2>

          <p v-if="currentState !== 'awake'" class="sleep-duration">
            <Timer :size="16" />
            Duration: {{ sleepDurationFormatted }}
          </p>
        </div>
      </div>
    </div>

    <!-- Sleep Schedule Donut -->
    <SleepScheduleDonut :sleep-entries="sleepEntries" :settings="settings" />

    <!-- Wake Window Recommendation Card -->
    <div
      v-if="wakeWindowStatus && currentState === 'awake'"
      class="recommendation-card"
      :class="wakeWindowStatus.status"
    >
      <div class="recommendation-header">
        <CheckCircle v-if="wakeWindowStatus.status === 'nap-time'" :size="20" />
        <Clock
          v-else-if="wakeWindowStatus.status === 'wait-for-nap'"
          :size="20"
        />
        <AlertCircle v-else :size="20" />
        <h3>Sleep Guidance</h3>
        <span class="confidence-badge" :class="wakeWindowStatus.confidence">
          {{ wakeWindowStatus.confidence }}
        </span>
      </div>

      <div class="recommendation-content">
        <p class="reasoning">{{ wakeWindowStatus.message }}</p>
        <div v-if="wakeWindowStatus.nextNapTime" class="next-nap-time">
          <Clock :size="16" />
          Next nap window:
          {{
            wakeWindowStatus.nextNapTime.earliest.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          }}
          -
          {{
            wakeWindowStatus.nextNapTime.latest.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          }}
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <template v-if="currentState === 'awake'">
        <button class="btn btn-nap" @click="startSleep(true)">
          <Moon :size="20" />
          Start Nap
        </button>

        <button class="btn btn-night" @click="startSleep(false)">
          <Bed :size="20" />
          Start Night Sleep
        </button>

        <button class="btn btn-manual" @click="openManualEntryModal">
          <Plus :size="20" />
          Add Manual Entry
        </button>
      </template>

      <template v-else>
        <button class="btn btn-wake" @click="endSleep">
          <Sun :size="20" />
          Baby Woke Up
        </button>

        <button class="btn btn-manual-small" @click="openManualEntryModal">
          <Plus :size="20" />
          Add Entry
        </button>
      </template>
    </div>

    <!-- Recent Activity -->
    <div class="recent-activity" v-if="recentEntries.length > 0">
      <div class="activity-header">
        <h3>
          <Calendar :size="20" />
          Today's Activity
        </h3>
        <button
          class="show-all-btn"
          @click="openAllActivitiesModal"
          aria-label="Show all activities"
        >
          Show all
        </button>
      </div>
      <div class="activity-list">
        <div
          v-for="entry in recentEntries"
          :key="entry.id"
          class="activity-item"
          :class="entry.type"
        >
          <div class="activity-icon">
            <Bed
              v-if="entry.type === 'sleep' && entry.sleepType === 'night'"
              :size="20"
              :color="'var(--baby-purple)'"
            />
            <Moon
              v-else-if="entry.type === 'sleep'"
              :size="20"
              :color="'var(--baby-blue)'"
            />
            <Sun v-else :size="20" color="var(--baby-orange)" />
          </div>

          <div class="activity-details">
            <div class="activity-type">
              {{ entry.type === "sleep" ? "Fell Asleep" : "Woke Up" }}
              <span v-if="entry.napNumber" class="nap-number">
                (Nap {{ entry.napNumber }})
              </span>
            </div>
            <div class="activity-time">
              {{ entry.timeFormatted }}
              <span v-if="entry.durationFormatted" class="duration">
                • {{ entry.durationFormatted }}
              </span>
            </div>
            <div v-if="entry.notes" class="activity-notes">
              <Info :size="14" />
              {{ entry.notes }}
            </div>
          </div>

          <div class="activity-actions" v-if="entry.type === 'sleep'">
            <button
              class="action-btn edit-btn"
              @click="editEntry(entry)"
              title="Edit"
            >
              <Edit :size="16" />
            </button>
            <button
              class="action-btn delete-btn"
              @click="deleteEntry(entry.id)"
              title="Delete"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sleep Analytics -->
    <SleepAnalytics :sleep-entries="sleepEntries" />

    <!-- Modern Manual Entry Modal -->
    <ManualEntryModal
      :isOpen="showManualEntryModal"
      :isEdit="false"
      @close="closeModal"
      @save="submitManualEntry"
    />

    <!-- Modern Edit Entry Modal -->
    <ManualEntryModal
      :isOpen="showEditModal"
      :isEdit="true"
      :initialData="manualEntryForm"
      @close="closeModal"
      @save="updateEntryFromModal"
    />

    <!-- Settings Modal -->
    <SettingsModal
      :isOpen="showSettingsModal"
      :settings="settings"
      @close="showSettingsModal = false"
      @save="saveSettings"
    />

    <!-- All Activities Modal -->
    <AllActivitiesModal
      :isOpen="showAllActivitiesModal"
      :sleepEntries="sleepEntries"
      @close="closeAllActivitiesModal"
      @editEntry="editEntry"
      @deleteEntry="deleteEntry"
    />
  </div>
</template>

<style scoped>
.sleep-tracker {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  margin-bottom: 2rem;
  padding: 0 0.5rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-bottom {
  display: flex;
  justify-content: center;
  align-items: center;
}

.app-title {
  font-size: 2rem;
  color: var(--text-dark);
  margin: 0;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.current-time {
  font-size: 1.25rem;
  color: var(--text-light);
  font-weight: 500;
  background: var(--soft-white);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  box-shadow: var(--shadow-soft);
}

.settings-button {
  background: var(--soft-white);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-soft);
  color: var(--text-light);
}

.settings-button svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.settings-button:hover {
  background: var(--baby-blue);
  color: white;
  transform: scale(1.05);
}

.error-message {
  background: #ffe6e6;
  border: 2px solid #ff6b6b;
  border-radius: 15px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #d63031;
  font-weight: 500;
}

.error-icon {
  font-size: 1.2rem;
}

.status-card {
  background: var(--soft-white);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-soft);
  border: 3px solid var(--baby-pink);
}

.status-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-icon {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.status-text {
  flex: 1;
}

.status-text h2 {
  color: var(--text-dark);
  margin: 0 0 0.5rem 0;
  font-size: 1.4rem;
}

.sleep-duration {
  color: var(--text-light);
  font-size: 1.1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 20px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-soft);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
}

.btn-nap {
  background: linear-gradient(135deg, var(--baby-blue), var(--baby-lavender));
  color: white;
}

.btn-night {
  background: linear-gradient(135deg, var(--baby-lavender), #9370db);
  color: white;
}

.btn-wake {
  background: linear-gradient(135deg, var(--baby-yellow), #ffd700);
  color: var(--text-dark);
}

.btn-manual {
  background: linear-gradient(135deg, var(--baby-mint), var(--baby-blue));
  color: var(--text-dark);
  font-size: 1rem;
}

.btn-manual-small {
  background: var(--baby-mint);
  color: var(--text-dark);
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
}

.btn-bedtime {
  background: linear-gradient(135deg, #483d8b, #6b46c1);
  color: white;
  font-weight: 600;
}

.btn-icon {
  font-size: 1.2rem;
}

/* Recent Activity Styles */
.recent-activity {
  background: var(--soft-white);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: var(--shadow-soft);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.activity-header h3 {
  color: var(--text-dark);
  margin: 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.show-all-btn {
  background: var(--baby-blue);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-soft);
}

.show-all-btn:hover {
  background: var(--baby-purple);
  transform: translateY(-1px);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  background: var(--soft-white);
  border: 2px solid var(--baby-pink);
  border-radius: 15px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
}

.activity-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.activity-item.sleep {
  border-color: var(--baby-blue);
}

.activity-item.wake {
  border-color: var(--baby-orange);
}

.activity-icon {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.activity-details {
  flex: 1;
}

.activity-time {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0;
}

.duration {
  color: var(--baby-purple);
  font-weight: 500;
  font-size: 0.9rem;
}

.activity-type {
  font-size: 0.9rem;
  color: var(--text-light);
  margin: 0.25rem 0 0 0;
}

.nap-number {
  color: var(--baby-blue);
  font-weight: 600;
  font-size: 0.85rem;
}

.activity-duration {
  font-size: 0.85rem;
  color: var(--baby-purple);
  font-weight: 500;
  margin: 0.25rem 0 0 0;
}

.activity-notes {
  font-size: 0.85rem;
  color: var(--text-light);
  margin: 0.5rem 0 0 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-style: italic;
  background: rgba(255, 255, 255, 0.6);
  padding: 0.5rem;
  border-radius: 8px;
}

.activity-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--text-light);
}

.action-btn:hover {
  background: var(--baby-pink);
  color: var(--text-dark);
  transform: scale(1.1);
}

.edit-btn:hover {
  background: var(--baby-blue);
  color: white;
}

.delete-btn:hover {
  background: #ff6b6b;
  color: white;
}

/* Wake Window Status */
.wake-window-card {
  background: var(--soft-white);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-soft);
  border: 3px solid var(--baby-mint);
}

.wake-window-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.wake-window-icon {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.wake-window-text {
  flex: 1;
}

.wake-window-text h3 {
  color: var(--text-dark);
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.wake-window-status {
  font-size: 0.9rem;
  color: var(--text-light);
  margin: 0;
}

.wake-window-time {
  font-size: 1rem;
  color: var(--baby-purple);
  font-weight: 600;
  margin: 0.25rem 0 0 0;
}

/* Loading states */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: var(--text-light);
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .sleep-tracker {
    padding: 0.5rem;
  }

  .app-title {
    font-size: 1.5rem;
  }

  .btn {
    font-size: 1rem;
  }

  .activity-item {
    padding: 0.75rem;
  }

  .activity-icon {
    width: 35px;
    height: 35px;
  }

  .activity-time {
    font-size: 1rem;
  }
}

/* Wake Window Recommendation Card */
.recommendation-card {
  background: var(--soft-white);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-soft);
  border: 3px solid var(--baby-mint);
}

.recommendation-card.nap-time {
  border-color: var(--baby-blue);
  background: linear-gradient(
    135deg,
    rgba(135, 206, 235, 0.1),
    rgba(255, 255, 255, 0.9)
  );
}

.recommendation-card.wait-for-nap {
  border-color: var(--baby-yellow);
  background: linear-gradient(
    135deg,
    rgba(255, 223, 0, 0.1),
    rgba(255, 255, 255, 0.9)
  );
}

.recommendation-card.overtired {
  border-color: #ff6b6b;
  background: linear-gradient(
    135deg,
    rgba(255, 107, 107, 0.1),
    rgba(255, 255, 255, 0.9)
  );
}

.recommendation-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.recommendation-header h3 {
  color: var(--text-dark);
  margin: 0;
  font-size: 1.2rem;
  flex: 1;
}

.confidence-badge {
  background: var(--baby-mint);
  color: var(--text-dark);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.confidence-badge.high {
  background: var(--baby-blue);
  color: white;
}

.confidence-badge.medium {
  background: var(--baby-yellow);
  color: var(--text-dark);
}

.confidence-badge.low {
  background: var(--baby-pink);
  color: var(--text-dark);
}

.recommendation-content {
  color: var(--text-light);
}

.reasoning {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  line-height: 1.4;
}

.next-nap-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.7);
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-dark);
}
</style>
