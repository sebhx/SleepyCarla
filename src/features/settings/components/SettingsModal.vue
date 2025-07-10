<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { AgeRange } from "../../../types/settings";
import { useSettings } from "../../../shared/composables/useSettings";
import {
  ageRangeLabels,
  defaultBedtimes,
  defaultWakeTimes,
} from "../../../data/sleepScience";

// Props and emits
const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

// Use settings composable
const {
  settings,
  isLoading,
  error,
  updateAgeRange,
  updateBedtime,
  updateMorningWake,
  toggleNapSuggestions,
  toggleNotifications,
  setTheme,
  resetSettings,
  clearError,
} = useSettings();

// Local form state
const localSettings = ref({
  ageRange: "older-infant" as AgeRange,
  bedtime: "19:00",
  morningWake: "07:00",
  enableNapSuggestions: true,
  notificationsEnabled: false,
  theme: "light" as "light" | "dark" | "auto",
});

// Loading and error states
const isSaving = ref(false);
const saveError = ref<string | null>(null);

// Sync local state with global settings when they change
watch(
  settings,
  (newSettings) => {
    if (newSettings) {
      localSettings.value = {
        ageRange: newSettings.babyAge.ageRange,
        bedtime: newSettings.bedtime,
        morningWake: newSettings.morningWake,
        enableNapSuggestions: newSettings.enableNapSuggestions,
        notificationsEnabled: newSettings.notificationsEnabled,
        theme: newSettings.theme,
      };
    }
  },
  { immediate: true }
);

// Age range options
const ageRangeOptions = computed(() => {
  return Object.entries(ageRangeLabels).map(([value, label]) => ({
    value: value as AgeRange,
    label,
  }));
});

// Update defaults when age range changes
const handleAgeRangeChange = (newAgeRange: AgeRange) => {
  localSettings.value.ageRange = newAgeRange;
  localSettings.value.bedtime = defaultBedtimes[newAgeRange];
  localSettings.value.morningWake = defaultWakeTimes[newAgeRange];
};

// Save settings to API
const saveSettings = async () => {
  try {
    isSaving.value = true;
    saveError.value = null;

    // Save all settings
    await updateAgeRange(localSettings.value.ageRange);
    // Note: updateAgeRange already updates bedtime/morningWake, so we only need to update if they're different
    const currentSettings = settings.value;
    if (currentSettings?.bedtime !== localSettings.value.bedtime) {
      await updateBedtime(localSettings.value.bedtime);
    }
    if (currentSettings?.morningWake !== localSettings.value.morningWake) {
      await updateMorningWake(localSettings.value.morningWake);
    }
    if (
      currentSettings?.enableNapSuggestions !==
      localSettings.value.enableNapSuggestions
    ) {
      await toggleNapSuggestions();
    }
    if (
      currentSettings?.notificationsEnabled !==
      localSettings.value.notificationsEnabled
    ) {
      await toggleNotifications();
    }
    if (currentSettings?.theme !== localSettings.value.theme) {
      await setTheme(localSettings.value.theme);
    }

    emit("close");
  } catch (err) {
    console.error("Failed to save settings:", err);
    saveError.value =
      err instanceof Error ? err.message : "Failed to save settings";
  } finally {
    isSaving.value = false;
  }
};

// Reset to defaults
const resetToDefaults = async () => {
  try {
    isSaving.value = true;
    saveError.value = null;
    await resetSettings();
  } catch (err) {
    console.error("Failed to reset settings:", err);
    saveError.value =
      err instanceof Error ? err.message : "Failed to reset settings";
  } finally {
    isSaving.value = false;
  }
};

// Clear error when modal opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      saveError.value = null;
      clearError();
    }
  }
);
</script>

<template>
  <div v-if="isOpen" class="settings-overlay" @click="$emit('close')">
    <div class="settings-modal" @click.stop>
      <!-- Header -->
      <div class="settings-header">
        <h2>
          <span class="icon">⚙️</span>
          Settings
        </h2>
        <button class="close-btn" @click="$emit('close')">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Settings Content -->
      <div class="settings-content">
        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading settings...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error || saveError" class="error-state">
          <p class="error-message">{{ error || saveError }}</p>
          <button
            @click="
              clearError();
              saveError = null;
            "
            class="btn btn-secondary"
          >
            Dismiss
          </button>
        </div>

        <!-- Settings Form -->
        <div v-else>
          <!-- Baby Profile Section -->
          <div class="settings-section">
            <h3>
              <span class="section-icon">👶</span>
              Baby Profile
            </h3>

            <div class="form-group">
              <label for="ageRange">Age Range</label>
              <select
                id="ageRange"
                v-model="localSettings.ageRange"
                @change="handleAgeRangeChange(localSettings.ageRange)"
                class="form-select"
              >
                <option
                  v-for="option in ageRangeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Sleep Schedule Section -->
          <div class="settings-section">
            <h3>
              <span class="section-icon">🌙</span>
              Sleep Schedule
            </h3>

            <div class="form-row">
              <div class="form-group">
                <label for="bedtime">Bedtime</label>
                <input
                  id="bedtime"
                  v-model="localSettings.bedtime"
                  type="time"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="morningWake">Morning Wake</label>
                <input
                  id="morningWake"
                  v-model="localSettings.morningWake"
                  type="time"
                  class="form-input"
                />
              </div>
            </div>
          </div>

          <!-- Preferences Section -->
          <div class="settings-section">
            <h3>
              <span class="section-icon">✨</span>
              Preferences
            </h3>

            <div class="preferences-list">
              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    v-model="localSettings.enableNapSuggestions"
                    type="checkbox"
                    class="form-checkbox"
                  />
                  <span class="checkbox-text">Enable Nap Suggestions</span>
                </label>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    v-model="localSettings.notificationsEnabled"
                    type="checkbox"
                    class="form-checkbox"
                  />
                  <span class="checkbox-text">Enable Notifications</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <!-- End of conditional settings form -->
      </div>

      <!-- Footer Actions -->
      <div class="settings-footer">
        <button
          class="btn btn-secondary"
          @click="resetToDefaults"
          :disabled="isSaving"
        >
          {{ isSaving ? "Resetting..." : "Reset to Defaults" }}
        </button>
        <div class="btn-group">
          <button
            class="btn btn-cancel"
            @click="$emit('close')"
            :disabled="isSaving"
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            @click="saveSettings"
            :disabled="isSaving"
          >
            {{ isSaving ? "Saving..." : "Save Settings" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.settings-modal {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, var(--baby-lavender), var(--baby-pink));
}

.settings-header h2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  color: var(--text-dark);
}

.close-btn {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-dark);
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.close-btn svg {
  width: 18px;
  height: 18px;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section h3 {
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  color: var(--text-dark);
}

.section-icon {
  font-size: 1.2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-dark);
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s;
  background: white;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--baby-blue);
}

.preferences-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  justify-self: flex-start;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--baby-blue);
}

.checkbox-text {
  font-weight: 500;
  color: var(--text-dark);
}

.settings-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-group {
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, var(--baby-blue), var(--baby-lavender));
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(135, 206, 235, 0.4);
}

.btn-secondary {
  background: #f3f4f6;
  color: var(--text-dark);
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-cancel {
  background: none;
  color: var(--text-light);
  border: 2px solid #e5e7eb;
}

.btn-cancel:hover {
  border-color: #d1d5db;
  color: var(--text-dark);
}

/* Loading and error states */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: var(--text-muted);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-top: 2px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-state {
  padding: 2rem;
  text-align: center;
}

.error-message {
  color: var(--error);
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--error-bg);
  border: 1px solid var(--error);
  border-radius: 8px;
}

/* Button disabled states */
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .settings-modal {
    margin: 0.5rem;
    max-height: 95vh;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .settings-footer {
    flex-direction: column;
    gap: 1rem;
  }

  .btn-group {
    width: 100%;
  }

  .btn {
    flex: 1;
  }
}
</style>
