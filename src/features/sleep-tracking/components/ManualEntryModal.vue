<script setup lang="ts">
import { ref, computed, watch } from "vue";
import Icon from "../../../shared/components/Icon.vue";

// Props
const props = defineProps<{
  isOpen: boolean;
  isEdit?: boolean;
  initialData?: {
    type: "nap" | "night";
    entryMethod: "start-duration" | "start-end";
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    durationHours: number;
    durationMinutes: number;
    notes: string;
  };
}>();

// Emits
const emit = defineEmits<{
  close: [];
  save: [
    data: {
      type: "nap" | "night";
      entryMethod: "start-duration" | "start-end";
      startDate: string;
      startTime: string;
      endDate: string;
      endTime: string;
      durationHours: number;
      durationMinutes: number;
      notes: string;
    }
  ];
}>();

// Form state
const formData = ref({
  type: "nap" as "nap" | "night",
  entryMethod: "start-duration" as "start-duration" | "start-end",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  durationHours: 1,
  durationMinutes: 30,
  notes: "",
});

// Initialize form data when modal opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      if (props.initialData) {
        formData.value = { ...props.initialData };
      } else {
        // Reset to defaults
        const now = new Date();
        let defaultDate = now.toISOString().split("T")[0];

        // For night sleep, if it's after midnight but before 6 AM,
        // default to previous day (baby likely went to sleep yesterday)
        if (formData.value.type === "night" && now.getHours() < 6) {
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          defaultDate = yesterday.toISOString().split("T")[0];
        }

        formData.value = {
          type: "nap",
          entryMethod: "start-duration",
          startDate: defaultDate,
          startTime: now.toTimeString().slice(0, 5), // Current time as default
          endDate: defaultDate,
          endTime: "",
          durationHours: 1,
          durationMinutes: 30,
          notes: "",
        };
      }
    }
  }
);

// Watch for sleep type changes to adjust default date
watch(
  () => formData.value.type,
  (newType) => {
    // Only adjust date if it's currently set to today
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    if (formData.value.startDate === today) {
      if (newType === "night" && now.getHours() < 6) {
        // If switching to night sleep and it's early morning, default to yesterday
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        formData.value.startDate = yesterday.toISOString().split("T")[0];
      } else if (newType === "nap") {
        // If switching to nap, default to today
        formData.value.startDate = today;
      }
    }
  }
);

// Computed values
const modalTitle = computed(() => {
  return props.isEdit ? "Edit Sleep Entry" : "Add Sleep Entry";
});

const submitButtonText = computed(() => {
  return props.isEdit ? "Update Entry" : "Add Entry";
});

// Smart end date calculation
const calculatedEndDateTime = computed(() => {
  if (!formData.value.startDate || !formData.value.startTime) return null;

  if (formData.value.entryMethod === "start-duration") {
    // Calculate end time based on duration
    const startDateTime = new Date(
      `${formData.value.startDate}T${formData.value.startTime}`
    );
    const durationMs =
      (formData.value.durationHours * 60 + formData.value.durationMinutes) *
      60 *
      1000;
    const endDateTime = new Date(startDateTime.getTime() + durationMs);

    return {
      date: endDateTime.toISOString().split("T")[0],
      time: endDateTime.toTimeString().slice(0, 5),
      crossesDay: endDateTime.getDate() !== startDateTime.getDate(),
    };
  } else if (
    formData.value.entryMethod === "start-end" &&
    formData.value.endTime
  ) {
    // Check if end time is earlier than start time (next day)
    const startTime = formData.value.startTime;
    const endTime = formData.value.endTime;
    const crossesDay = endTime <= startTime;

    let endDate = formData.value.startDate;
    if (crossesDay) {
      const nextDay = new Date(formData.value.startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      endDate = nextDay.toISOString().split("T")[0];
    }

    return {
      date: endDate,
      time: endTime,
      crossesDay,
    };
  }

  return null;
});

// Show end date field only when needed
const showEndDateField = computed(() => {
  return (
    formData.value.entryMethod === "start-end" &&
    formData.value.endTime &&
    formData.value.endTime <= formData.value.startTime
  );
});

// Auto-sync end date when needed
watch(
  calculatedEndDateTime,
  (newVal) => {
    if (newVal) {
      formData.value.endDate = newVal.date;
    }
  },
  { immediate: true }
);

const canSubmit = computed(() => {
  if (!formData.value.startDate || !formData.value.startTime) return false;
  if (formData.value.entryMethod === "start-end" && !formData.value.endTime)
    return false;
  return true;
});

// Methods
const closeModal = () => {
  emit("close");
};

const handleSubmit = () => {
  if (!canSubmit.value) return;
  emit("save", { ...formData.value });
};

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    closeModal();
  }
};

// Sleep type options
const sleepTypeOptions = [
  { value: "nap", label: "Nap", icon: "moon", color: "var(--baby-blue)" },
  {
    value: "night",
    label: "Night Sleep",
    icon: "bed",
    color: "var(--baby-purple)",
  },
];

// Entry method options
const entryMethodOptions = [
  { value: "start-duration", label: "Start Time + Duration", icon: "timer" },
  { value: "start-end", label: "Start Time + End Time", icon: "clock" },
];

// Duration presets
const durationPresets = [
  { hours: 0, minutes: 30, label: "30min" },
  { hours: 1, minutes: 0, label: "1h" },
  { hours: 1, minutes: 30, label: "1h 30min" },
  { hours: 2, minutes: 0, label: "2h" },
  { hours: 2, minutes: 30, label: "2h 30min" },
  { hours: 3, minutes: 0, label: "3h" },
];

const selectDurationPreset = (preset: { hours: number; minutes: number }) => {
  formData.value.durationHours = preset.hours;
  formData.value.durationMinutes = preset.minutes;
};
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="handleBackdropClick">
      <div class="modal-container">
        <div class="modal-header">
          <h2 class="modal-title">
            <Icon :name="formData.type === 'nap' ? 'moon' : 'bed'" :size="20" />
            {{ modalTitle }}
          </h2>
          <button
            class="close-button"
            @click="closeModal"
            aria-label="Close modal"
          >
            <Icon name="close" :size="20" />
          </button>
        </div>

        <div class="modal-body">
          <!-- Sleep Type Selection -->
          <div class="section">
            <h3 class="section-title">Sleep Type</h3>
            <div class="option-grid">
              <label
                v-for="option in sleepTypeOptions"
                :key="option.value"
                class="option-card"
                :class="{ active: formData.type === option.value }"
              >
                <input
                  type="radio"
                  :value="option.value"
                  v-model="formData.type"
                  class="option-radio"
                />
                <div class="option-content">
                  <Icon :name="option.icon" :size="24" :color="option.color" />
                  <span class="option-label">{{ option.label }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Entry Method Selection -->
          <div class="section">
            <h3 class="section-title">Entry Method</h3>
            <div class="option-grid">
              <label
                v-for="option in entryMethodOptions"
                :key="option.value"
                class="option-card"
                :class="{ active: formData.entryMethod === option.value }"
              >
                <input
                  type="radio"
                  :value="option.value"
                  v-model="formData.entryMethod"
                  class="option-radio"
                />
                <div class="option-content">
                  <Icon :name="option.icon" :size="20" />
                  <span class="option-label">{{ option.label }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Start Date -->
          <div class="section">
            <label class="input-label" for="startDate">
              <Icon name="calendar" :size="16" />
              Date
            </label>
            <input
              id="startDate"
              type="date"
              v-model="formData.startDate"
              class="time-input"
              required
            />
            <p class="help-text">
              <Icon name="info" :size="12" />
              For night sleep, select the date when baby went to sleep (not when
              they woke up)
            </p>
          </div>

          <!-- Start Time -->
          <div class="section">
            <label class="input-label" for="startTime">
              <Icon name="clock" :size="16" />
              Start Time
            </label>
            <input
              id="startTime"
              type="time"
              v-model="formData.startTime"
              class="time-input"
              required
            />
          </div>

          <!-- Duration Method -->
          <div v-if="formData.entryMethod === 'start-duration'" class="section">
            <div class="input-label">
              <Icon name="timer" :size="16" />
              Duration
            </div>

            <!-- Duration Presets -->
            <div class="duration-presets">
              <button
                v-for="preset in durationPresets"
                :key="preset.label"
                type="button"
                class="preset-button"
                :class="{
                  active:
                    formData.durationHours === preset.hours &&
                    formData.durationMinutes === preset.minutes,
                }"
                @click="selectDurationPreset(preset)"
              >
                {{ preset.label }}
              </button>
            </div>

            <!-- Custom Duration Inputs -->
            <div class="duration-inputs">
              <div class="duration-input">
                <input
                  type="number"
                  v-model="formData.durationHours"
                  min="0"
                  max="12"
                  class="duration-number"
                  aria-label="Hours"
                />
                <span class="duration-unit">hours</span>
              </div>
              <div class="duration-input">
                <input
                  type="number"
                  v-model="formData.durationMinutes"
                  min="0"
                  max="59"
                  step="5"
                  class="duration-number"
                  aria-label="Minutes"
                />
                <span class="duration-unit">minutes</span>
              </div>
            </div>

            <!-- Smart End Date/Time Display for Duration Method -->
            <div v-if="calculatedEndDateTime" class="calculated-end-info">
              <div class="info-card">
                <Icon name="clock" :size="16" />
                <div class="info-content">
                  <span class="info-label">Sleep will end:</span>
                  <span class="info-value">
                    {{ calculatedEndDateTime.time }}
                    <span
                      v-if="calculatedEndDateTime.crossesDay"
                      class="next-day-indicator"
                    >
                      ({{ calculatedEndDateTime.date }})
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- End Time Method -->
          <div v-else class="section">
            <label class="input-label" for="endTime">
              <Icon name="clock" :size="16" />
              End Time
            </label>
            <input
              id="endTime"
              type="time"
              v-model="formData.endTime"
              class="time-input"
              required
            />

            <!-- End Date Field - Only show when sleep crosses to next day -->
            <div v-if="showEndDateField" class="end-date-section">
              <label class="input-label" for="endDate">
                <Icon name="calendar" :size="16" />
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                v-model="formData.endDate"
                class="time-input"
                required
              />
              <p class="help-text">
                <Icon name="info" :size="12" />
                Sleep crosses to next day
              </p>
            </div>

            <!-- Smart End Date/Time Display -->
            <div v-if="calculatedEndDateTime" class="calculated-end-info">
              <div class="info-card">
                <Icon name="clock" :size="16" />
                <div class="info-content">
                  <span class="info-label">Sleep will end:</span>
                  <span class="info-value">
                    {{ calculatedEndDateTime.time }}
                    <span
                      v-if="calculatedEndDateTime.crossesDay"
                      class="next-day-indicator"
                    >
                      ({{ calculatedEndDateTime.date }})
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="section">
            <label class="input-label" for="notes">
              <Icon name="edit" :size="16" />
              Notes (optional)
            </label>
            <textarea
              id="notes"
              v-model="formData.notes"
              placeholder="Any additional notes about this sleep..."
              class="notes-input"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="button button-secondary"
            @click="closeModal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="button button-primary"
            @click="handleSubmit"
            :disabled="!canSubmit"
          >
            <Icon name="check" :size="16" />
            {{ submitButtonText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 24px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: modal-appear 0.3s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0;
  margin-bottom: 1rem;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-dark);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-button {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  transition: all 0.2s ease;
}

.close-button:hover {
  background: var(--background-light);
  color: var(--text-dark);
}

.modal-body {
  padding: 0 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.section {
  margin-bottom: 1.5rem;
}

.section-title {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-dark);
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.option-card {
  position: relative;
  padding: 1rem;
  border: 2px solid var(--border-light);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.option-card:hover {
  border-color: var(--baby-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.option-card.active {
  border-color: var(--baby-blue);
  background: linear-gradient(135deg, var(--baby-blue), var(--baby-mint));
  color: white;
}

.option-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.option-label {
  font-weight: 500;
  font-size: 0.9rem;
}

.input-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--text-dark);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.time-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-light);
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.time-input:focus {
  outline: none;
  border-color: var(--baby-blue);
}

.duration-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.preset-button {
  padding: 0.5rem 1rem;
  border: 2px solid var(--border-light);
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.preset-button:hover {
  border-color: var(--baby-blue);
}

.preset-button.active {
  border-color: var(--baby-blue);
  background: var(--baby-blue);
  color: white;
}

.duration-inputs {
  display: flex;
  gap: 1rem;
}

.duration-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.duration-number {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid var(--border-light);
  border-radius: 12px;
  font-size: 1rem;
  text-align: center;
  transition: border-color 0.2s ease;
}

.duration-number:focus {
  outline: none;
  border-color: var(--baby-blue);
}

.duration-unit {
  font-size: 0.85rem;
  color: var(--text-light);
  font-weight: 500;
}

.notes-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-light);
  border-radius: 12px;
  font-size: 1rem;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s ease;
  font-family: inherit;
}

.notes-input:focus {
  outline: none;
  border-color: var(--baby-blue);
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-light);
}

.button {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.button-secondary {
  background: var(--background-light);
  color: var(--text-dark);
}

.button-secondary:hover {
  background: var(--border-light);
}

.button-primary {
  background: linear-gradient(135deg, var(--baby-blue), var(--baby-mint));
  color: white;
}

.button-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.button-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.button-primary:disabled:hover {
  transform: none;
  box-shadow: none;
}

.help-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-light);
  margin-top: 0.5rem;
  margin-bottom: 0;
  padding: 0.5rem;
  background: var(--background-light);
  border-radius: 8px;
  border-left: 3px solid var(--baby-blue);
}

.end-date-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-light);
}

.calculated-end-info {
  margin-top: 1rem;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, var(--baby-blue), var(--baby-mint));
  border-radius: 16px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.85rem;
  opacity: 0.9;
}

.info-value {
  font-size: 1.1rem;
  font-weight: 600;
}

.next-day-indicator {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-left: 0.5rem;
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .modal-container {
    margin: 0.5rem;
    max-height: 95vh;
  }

  .modal-header {
    padding: 1rem 1rem 0;
  }

  .modal-body {
    padding: 0 1rem;
  }

  .modal-footer {
    padding: 1rem;
  }

  .option-grid {
    grid-template-columns: 1fr;
  }

  .duration-inputs {
    flex-direction: column;
    gap: 0.75rem;
  }

  .duration-presets {
    justify-content: center;
  }

  .info-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
