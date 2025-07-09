<script setup lang="ts">
import { ref, computed } from "vue";
import type { AppSettings, AgeRange } from "../types/settings";
import {
  ageRangeLabels,
  defaultBedtimes,
  defaultWakeTimes,
} from "../data/sleepScience";

// Props and emits
const props = defineProps<{
  settings: AppSettings;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  save: [settings: AppSettings];
}>();

// Local settings state
const localSettings = ref<AppSettings>({ ...props.settings });

// Age range options
const ageRangeOptions = computed(() => {
  return Object.entries(ageRangeLabels).map(([value, label]) => ({
    value: value as AgeRange,
    label,
  }));
});

// Update defaults when age range changes
const handleAgeRangeChange = (newAgeRange: AgeRange) => {
  localSettings.value.babyAge.ageRange = newAgeRange;
  localSettings.value.bedtime = defaultBedtimes[newAgeRange];
  localSettings.value.morningWake = defaultWakeTimes[newAgeRange];
};

// Save settings
const saveSettings = () => {
  emit("save", { ...localSettings.value });
  emit("close");
};

// Reset to defaults
const resetToDefaults = () => {
  const ageRange = localSettings.value.babyAge.ageRange;
  localSettings.value = {
    babyAge: { ageRange },
    bedtime: defaultBedtimes[ageRange],
    morningWake: defaultWakeTimes[ageRange],
    enableNapSuggestions: true,
    notificationsEnabled: false,
    theme: "light",
  };
};
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
              v-model="localSettings.babyAge.ageRange"
              @change="handleAgeRangeChange(localSettings.babyAge.ageRange)"
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

      <!-- Footer Actions -->
      <div class="settings-footer">
        <button class="btn btn-secondary" @click="resetToDefaults">
          Reset to Defaults
        </button>
        <div class="btn-group">
          <button class="btn btn-cancel" @click="$emit('close')">Cancel</button>
          <button class="btn btn-primary" @click="saveSettings">
            Save Settings
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
