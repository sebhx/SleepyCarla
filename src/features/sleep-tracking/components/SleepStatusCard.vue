<script setup lang="ts">
import { computed } from "vue";
import type { SleepState } from "../../../types/sleep-refactored";
import { Moon, Sun, Bed, Play, Pause } from "lucide-vue-next";

interface Props {
  currentState: SleepState;
  isLoading: boolean;
  currentTime: string;
  sleepDuration: string;
}

interface Emits {
  (e: "start-nap"): void;
  (e: "start-night"): void;
  (e: "end-sleep"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const stateConfig = computed(() => {
  switch (props.currentState) {
    case "napping":
      return {
        title: "Napping",
        icon: Moon,
        color: "var(--baby-blue)",
        bgColor: "var(--baby-mint)",
        actionText: "End Nap",
        actionIcon: Pause,
      };
    case "nightSleep":
      return {
        title: "Night Sleep",
        icon: Bed,
        color: "var(--baby-purple)",
        bgColor: "var(--baby-lavender)",
        actionText: "Wake Up",
        actionIcon: Pause,
      };
    default:
      return {
        title: "Awake",
        icon: Sun,
        color: "var(--baby-orange)",
        bgColor: "var(--baby-mint)",
        actionText: "Start Sleep",
        actionIcon: Play,
      };
  }
});

const handleAction = () => {
  if (props.currentState === "awake") {
    // Show options for nap or night sleep
    return;
  }
  emit("end-sleep");
};
</script>

<template>
  <div
    class="sleep-status-card"
    :style="{ backgroundColor: stateConfig.bgColor }"
  >
    <div class="status-header">
      <component
        :is="stateConfig.icon"
        :size="32"
        :color="stateConfig.color"
        class="status-icon"
      />
      <h2 class="status-title">{{ stateConfig.title }}</h2>
    </div>

    <div class="status-content">
      <div class="current-time">
        <span class="time-label">Current Time</span>
        <span class="time-value">{{ currentTime }}</span>
      </div>

      <div v-if="currentState !== 'awake'" class="sleep-duration">
        <span class="duration-label">Duration</span>
        <span class="duration-value">{{ sleepDuration }}</span>
      </div>
    </div>

    <div class="status-actions">
      <div v-if="currentState === 'awake'" class="awake-actions">
        <button
          @click="emit('start-nap')"
          :disabled="isLoading"
          class="btn btn-primary action-btn"
        >
          <Moon :size="20" />
          Start Nap
        </button>
        <button
          @click="emit('start-night')"
          :disabled="isLoading"
          class="btn btn-secondary action-btn"
        >
          <Bed :size="20" />
          Bedtime
        </button>
      </div>

      <button
        v-else
        @click="handleAction"
        :disabled="isLoading"
        class="btn btn-danger action-btn"
      >
        <component :is="stateConfig.actionIcon" :size="20" />
        {{ stateConfig.actionText }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.sleep-status-card {
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-soft);
  transition: all var(--transition-base);
}

.status-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.status-icon {
  flex-shrink: 0;
}

.status-title {
  font-size: var(--font-size-xxl);
  font-weight: 600;
  color: var(--text-dark);
  margin: 0;
}

.status-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.current-time,
.sleep-duration {
  text-align: center;
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.7);
  border-radius: var(--border-radius-md);
}

.time-label,
.duration-label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--text-light);
  margin-bottom: var(--spacing-xs);
}

.time-value,
.duration-value {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-dark);
}

.status-actions {
  display: flex;
  justify-content: center;
}

.awake-actions {
  display: flex;
  gap: var(--spacing-md);
}

.action-btn {
  flex: 1;
  max-width: 200px;
}

@media (max-width: 768px) {
  .status-content {
    grid-template-columns: 1fr;
  }

  .awake-actions {
    flex-direction: column;
  }
}
</style>
