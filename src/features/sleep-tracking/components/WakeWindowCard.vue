<script setup lang="ts">
import { computed } from "vue";
import type { AgeRange } from "../../../types/settings";
import { CheckCircle, AlertCircle, Clock } from "lucide-vue-next";
import { formatTime } from "../../../shared/utils/dateUtils";

interface WakeWindowStatus {
  isOptimal: boolean;
  nextNapTime: Date | null;
  timeUntilNap: number; // minutes
  message: string;
  confidence: "high" | "medium" | "low";
}

interface Props {
  wakeWindowStatus: WakeWindowStatus | null;
  enabled: boolean;
  babyAge: AgeRange;
}

const props = defineProps<Props>();

const statusIcon = computed(() => {
  if (!props.wakeWindowStatus) return Clock;
  return props.wakeWindowStatus.isOptimal ? CheckCircle : AlertCircle;
});

const statusColor = computed(() => {
  if (!props.wakeWindowStatus) return "var(--text-light)";
  return props.wakeWindowStatus.isOptimal ? "#4ade80" : "var(--baby-orange)";
});

const confidenceLabel = computed(() => {
  if (!props.wakeWindowStatus) return "";

  const confidence = props.wakeWindowStatus.confidence;
  if (confidence === "high") return "🔥";
  if (confidence === "medium") return "⚡";
  return "💡";
});

const formatTimeUntilNap = (minutes: number): string => {
  if (minutes <= 0) return "Now";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const nextNapTimeFormatted = computed(() => {
  if (!props.wakeWindowStatus?.nextNapTime) return "";

  return formatTime(props.wakeWindowStatus.nextNapTime);
});

const ageRangeLabel = computed(() => {
  const labels: Record<AgeRange, string> = {
    newborn: "Newborn (0-3 months)",
    infant: "Infant (3-6 months)",
    "older-infant": "Older Infant (6-9 months)",
    toddler: "Toddler (9-12 months)",
    "young-toddler": "Young Toddler (12-18 months)",
    "toddler-plus": "Toddler Plus (18+ months)",
  };
  return labels[props.babyAge] || "Unknown";
});
</script>

<template>
  <div v-if="enabled" class="wake-window-card card">
    <div class="card-header">
      <h3 class="card-title">Wake Window Guidance</h3>
      <span class="age-badge">{{ ageRangeLabel }}</span>
    </div>

    <div v-if="!wakeWindowStatus" class="no-status">
      <Clock :size="32" color="var(--text-light)" />
      <p>Analyzing sleep patterns...</p>
    </div>

    <div v-else class="wake-window-content">
      <div class="status-indicator">
        <component :is="statusIcon" :size="24" :color="statusColor" />
        <span class="confidence-badge">{{ confidenceLabel }}</span>
      </div>

      <div class="status-message">
        <p>{{ wakeWindowStatus.message }}</p>
      </div>

      <div v-if="wakeWindowStatus.nextNapTime" class="next-nap-info">
        <div class="info-item">
          <span class="info-label">Next nap suggestion:</span>
          <span class="info-value">{{ nextNapTimeFormatted }}</span>
        </div>

        <div class="info-item">
          <span class="info-label">Time until nap:</span>
          <span class="info-value">{{
            formatTimeUntilNap(wakeWindowStatus.timeUntilNap)
          }}</span>
        </div>
      </div>

      <div class="confidence-info">
        <span class="confidence-label">Confidence: </span>
        <span
          class="confidence-value"
          :class="`confidence-${wakeWindowStatus.confidence}`"
        >
          {{ wakeWindowStatus.confidence }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wake-window-card {
  margin-bottom: var(--spacing-lg);
  border-left: 4px solid var(--primary-color);
}

.age-badge {
  font-size: var(--font-size-xs);
  color: var(--text-light);
  background: var(--background-light);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
}

.no-status {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--text-light);
}

.no-status p {
  margin-top: var(--spacing-sm);
}

.wake-window-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.confidence-badge {
  font-size: var(--font-size-lg);
}

.status-message {
  background: var(--background-light);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border-left: 3px solid var(--primary-color);
}

.status-message p {
  margin: 0;
  color: var(--text-dark);
  font-weight: 500;
}

.next-nap-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(135, 206, 235, 0.1);
  border-radius: var(--border-radius-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-label {
  font-size: var(--font-size-sm);
  color: var(--text-light);
}

.info-value {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-dark);
}

.confidence-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.confidence-label {
  color: var(--text-light);
}

.confidence-value {
  font-weight: 600;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  text-transform: uppercase;
  font-size: var(--font-size-xs);
}

.confidence-high {
  background: #dcfce7;
  color: #166534;
}

.confidence-medium {
  background: #fef3c7;
  color: #a16207;
}

.confidence-low {
  background: #fee2e2;
  color: #dc2626;
}

@media (max-width: 768px) {
  .next-nap-info {
    grid-template-columns: 1fr;
  }

  .confidence-info {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
