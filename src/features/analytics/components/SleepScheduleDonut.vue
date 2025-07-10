<script setup lang="ts">
import { computed, ref } from "vue";
import { Sun, Moon, Bed, Clock, X, Check } from "lucide-vue-next";
import type { SleepActivityEntry } from "../../../types/sleep-refactored";
import type { AppSettings } from "../../../types/settings";
import { useSleepSchedule } from "../composables/useSleepSchedule";
import { scientificSleepData } from "../../../data/sleepScience";

const props = defineProps<{
  sleepEntries: SleepActivityEntry[];
  settings: AppSettings;
}>();

const sleepEntriesRef = computed(() => props.sleepEntries);
const settingsRef = computed(() => props.settings);

const { todaysSchedule, currentTimeAngle, nextActivity } = useSleepSchedule(
  sleepEntriesRef,
  settingsRef
);

// State for nap details modal
const selectedNap = ref<any>(null);
const showNapDetails = ref(false);

// SVG configuration
const size = 320; // Increased from 280
const center = size / 2;
const radius = 100;
const strokeWidth = 24;

// Generate SVG path for the 3/4 circle (270 degrees)
const generateArcPath = (startAngle: number, endAngle: number): string => {
  // Start at 135 degrees (Northwest) and go 270 degrees to 45 degrees (Northeast) - rotated 90 degrees counter-clockwise from SW
  const startDegrees = 135 + (startAngle / 270) * 270; // Map 0-270 to 135-45 (next day)
  const endDegrees = 135 + (endAngle / 270) * 270;

  const start = (startDegrees * Math.PI) / 180;
  const end = (endDegrees * Math.PI) / 180;

  const innerRadius = radius - strokeWidth / 2;
  const outerRadius = radius + strokeWidth / 2;

  const x1 = center + innerRadius * Math.cos(start);
  const y1 = center + innerRadius * Math.sin(start);
  const x2 = center + outerRadius * Math.cos(start);
  const y2 = center + outerRadius * Math.sin(start);

  const x3 = center + outerRadius * Math.cos(end);
  const y3 = center + outerRadius * Math.sin(end);
  const x4 = center + innerRadius * Math.cos(end);
  const y4 = center + innerRadius * Math.sin(end);

  const largeArc = endAngle - startAngle > 135 ? 1 : 0; // 135 is half of 270

  return `M ${x1},${y1} 
          L ${x2},${y2} 
          A ${outerRadius},${outerRadius} 0 ${largeArc} 1 ${x3},${y3}
          L ${x4},${y4}
          A ${innerRadius},${innerRadius} 0 ${largeArc} 0 ${x1},${y1} Z`;
};

// Convert angle to coordinates for positioning icons
const angleToCoordinates = (
  angle: number,
  radiusOffset = 0
): { x: number; y: number } => {
  // Start at 135 degrees (Northwest) and map 0-270 to 135-405 (which is 135-45 next rotation)
  const adjustedAngle = 135 + (angle / 270) * 270;
  const rad = (adjustedAngle * Math.PI) / 180;
  const r = radius + radiusOffset;
  return {
    x: center + r * Math.cos(rad),
    y: center + r * Math.sin(rad),
  };
};

// Background arc (full 270 degrees)
const backgroundArc = generateArcPath(0, 270);

// Progress arc (from start to current time)
const progressArc = computed(() => {
  if (currentTimeAngle.value === null) return "";
  return generateArcPath(0, currentTimeAngle.value);
});

// Time slots with positions
const timeSlots = computed(() => {
  return todaysSchedule.value.map((slot) => ({
    ...slot,
    position: angleToCoordinates(slot.angle, 0),
    iconPosition: angleToCoordinates(slot.angle, 45), // Increased from 35 to 45
  }));
});

// Get icon component for slot type
const getSlotIcon = (type: string) => {
  switch (type) {
    case "wake":
      return Sun;
    case "nap":
      return Moon;
    case "bedtime":
      return Bed;
    default:
      return Clock;
  }
};

// Get color for slot type
const getSlotColor = (type: string, isCompleted: boolean) => {
  switch (type) {
    case "wake":
      return "var(--baby-orange)"; // Keep orange even when completed
    case "nap":
      return isCompleted ? "var(--baby-mint)" : "var(--baby-blue)";
    case "bedtime":
      return isCompleted ? "var(--baby-mint)" : "var(--baby-purple)";
    default:
      return isCompleted ? "var(--baby-mint)" : "var(--baby-pink)";
  }
};

// Get the appropriate glow animation class based on slot color
const getGlowClass = (slot: any) => {
  const color = getSlotColor(slot.type, slot.isCompleted || false);

  if (color.includes("baby-blue")) return "glow-blue";
  if (color.includes("baby-purple")) return "glow-purple";
  if (color.includes("baby-mint")) return "glow-mint";
  if (color.includes("baby-orange")) return "glow-orange";
  if (color.includes("baby-pink")) return "glow-pink";

  return "glow-default";
};

// Format time for display
const formatTime = (timeString: string): string => {
  return timeString;
};

// Get next activity message
const nextActivityMessage = computed(() => {
  if (!nextActivity.value) return "All done for today! 🎉";

  const minutesUntil = nextActivity.value.timeUntil;

  if (minutesUntil <= 0) {
    return `${nextActivity.value.label} time!`;
  } else if (minutesUntil < 60) {
    return `${nextActivity.value.label} in ${minutesUntil}m`;
  } else {
    const hours = Math.floor(minutesUntil / 60);
    const mins = minutesUntil % 60;
    return `${nextActivity.value.label} in ${hours}h ${mins}m`;
  }
});

// Get schedule summary
const scheduleSummary = computed(() => {
  const napCount = todaysSchedule.value.filter(
    (slot) => slot.type === "nap"
  ).length;
  const ageRange = props.settings.babyAge.ageRange;
  const napRecommendation = scientificSleepData.napRecommendations.find(
    (rec) => rec.ageRange === ageRange
  );

  if (napRecommendation) {
    return `${napCount} nap${napCount !== 1 ? "s" : ""} scheduled`;
  }

  return `Today's Schedule`;
});

// Handle slot click
const handleSlotClick = (slot: any) => {
  selectedNap.value = slot;
  showNapDetails.value = true;
};

// Close slot details
const closeNapDetails = () => {
  selectedNap.value = null;
  showNapDetails.value = false;
};

// Get modal title
const getModalTitle = () => {
  if (!selectedNap.value) return "Schedule Details";

  switch (selectedNap.value.type) {
    case "wake":
      return "Wake Time";
    case "nap":
      return `Nap ${selectedNap.value.napNumber || ""} Details`;
    case "bedtime":
      return "Bedtime";
    default:
      return "Schedule Details";
  }
};

// Get nap status based on current time
const getNapStatus = (slot: any) => {
  if (!slot || slot.type !== "nap") return "";

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  // Parse the slot time
  const [slotHour, slotMinute] = slot.time.split(":").map(Number);
  const slotTotalMinutes = slotHour * 60 + slotMinute;

  // Check if this nap was actually registered by the user
  const isUserRegistered = isNapUserRegistered(slot);

  // If the scheduled time has passed
  if (currentTotalMinutes > slotTotalMinutes) {
    return isUserRegistered ? "Completed" : "Suggested (not taken)";
  }

  // Future nap
  return isUserRegistered ? "Completed (early)" : "Upcoming";
};
const getNapDuration = () => {
  const ageRange = props.settings.babyAge.ageRange;
  const napRecommendation = scientificSleepData.napRecommendations.find(
    (rec) => rec.ageRange === ageRange
  );
  return napRecommendation?.averageNapDuration || 75; // Default to 75 minutes
};

// Format duration for display
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// Check if a nap has been completed by user (has sleep entries)
const isNapUserRegistered = (slot: any): boolean => {
  if (!slot || slot.type !== "nap") return false;

  // Check if there are any sleep entries for today that match this nap time
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // Parse slot time to get approximate nap window
  const [slotHour, slotMinute] = slot.time.split(":").map(Number);
  const slotTime = new Date(todayStart);
  slotTime.setHours(slotHour, slotMinute, 0, 0);

  // Check for sleep entries within 2 hours of the scheduled nap time (expanded window)
  const windowStart = new Date(slotTime.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
  const windowEnd = new Date(slotTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours after

  // Filter today's sleep entries
  const todaysSleepEntries = props.sleepEntries.filter((entry) => {
    const entryTime = new Date(entry.timestamp);
    return (
      entry.type === "sleep" &&
      entryTime >= todayStart &&
      entryTime < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    );
  });

  // For debugging - log what we find
  console.log(`Checking nap at ${slot.time}:`, {
    windowStart: windowStart.toLocaleTimeString(),
    windowEnd: windowEnd.toLocaleTimeString(),
    todaysSleepEntries: todaysSleepEntries.map((e) => ({
      time: new Date(e.timestamp).toLocaleTimeString(),
      sleepType: e.sleepType,
      type: e.type,
    })),
  });

  return todaysSleepEntries.some((entry) => {
    const entryTime = new Date(entry.timestamp);

    // Check for sleep entries during daytime hours (not night sleep)
    const entryHour = entryTime.getHours();
    const isLikelyNap = entryHour >= 7 && entryHour <= 18; // Between 7 AM and 6 PM

    const isInWindow = entryTime >= windowStart && entryTime <= windowEnd;
    const isSleepEntry = entry.type === "sleep";
    const isNapOrUnspecified = entry.sleepType === "nap" || !entry.sleepType;

    return isSleepEntry && isLikelyNap && isInWindow && isNapOrUnspecified;
  });
};
</script>

<template>
  <div class="sleep-schedule-donut">
    <div class="donut-header">
      <h3>
        <Clock :size="18" />
        Today's Schedule
      </h3>
      <div class="next-activity">
        {{ nextActivityMessage }}
      </div>
    </div>

    <div class="donut-container">
      <svg :width="size" :height="size" viewBox="0 0 320 320" class="donut-svg">
        <!-- Background arc -->
        <path
          :d="backgroundArc"
          fill="rgba(255, 255, 255, 0.3)"
          stroke="none"
        />

        <!-- Progress arc -->
        <path
          v-if="progressArc"
          :d="progressArc"
          fill="url(#progressGradient)"
          stroke="none"
          class="progress-arc"
        />

        <!-- Current time indicator -->
        <circle
          v-if="currentTimeAngle !== null"
          :cx="angleToCoordinates(currentTimeAngle).x"
          :cy="angleToCoordinates(currentTimeAngle).y"
          r="8"
          fill="var(--baby-orange)"
          stroke="white"
          stroke-width="3"
          class="current-time-indicator"
        />

        <!-- Time slots -->
        <g v-for="slot in timeSlots" :key="slot.id" class="time-slot">
          <!-- Slot marker -->
          <circle
            :cx="slot.position.x"
            :cy="slot.position.y"
            r="16"
            :fill="getSlotColor(slot.type, slot.isCompleted || false)"
            stroke="white"
            stroke-width="3"
            class="slot-marker"
            :class="{
              completed: slot.isCompleted,
              'next-up': slot.id === nextActivity?.id,
              clickable: true,
              'wake-marker': slot.type === 'wake',
              [getGlowClass(slot)]: slot.id === nextActivity?.id,
            }"
            @click="handleSlotClick(slot)"
          />

          <!-- Icon -->
          <foreignObject
            :x="slot.position.x - 8"
            :y="slot.position.y - 8"
            width="16"
            height="16"
            class="slot-icon"
          >
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
              "
            >
              <component
                :is="getSlotIcon(slot.type)"
                :size="10"
                :color="slot.isCompleted ? 'var(--text-dark)' : 'white'"
              />
            </div>
          </foreignObject>

          <!-- User-registered nap markers (inside the donut arc) -->
          <circle
            v-if="slot.type === 'nap' && isNapUserRegistered(slot)"
            :cx="angleToCoordinates(slot.angle, -32).x"
            :cy="angleToCoordinates(slot.angle, -32).y"
            r="12"
            fill="#10b981"
            stroke="white"
            stroke-width="2"
            class="user-registered-nap"
          />
          <foreignObject
            v-if="slot.type === 'nap' && isNapUserRegistered(slot)"
            :x="angleToCoordinates(slot.angle, -32).x - 6"
            :y="angleToCoordinates(slot.angle, -32).y - 6"
            width="12"
            height="12"
            class="user-registered-icon"
          >
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
              "
            >
              <Check :size="8" color="white" />
            </div>
          </foreignObject>

          <!-- Time label -->
          <text
            :x="slot.iconPosition.x"
            :y="slot.iconPosition.y + 4"
            :text-anchor="
              slot.type === 'bedtime'
                ? 'end'
                : slot.type === 'wake'
                ? 'start'
                : 'middle'
            "
            class="time-label"
            :class="{
              'next-up': slot.id === nextActivity?.id,
              'wake-label': slot.type === 'wake',
              'bedtime-label': slot.type === 'bedtime',
            }"
          >
            {{ formatTime(slot.time) }}
          </text>

          <!-- Activity label -->
          <text
            :x="slot.iconPosition.x"
            :y="slot.iconPosition.y + 18"
            :text-anchor="
              slot.type === 'bedtime'
                ? 'end'
                : slot.type === 'wake'
                ? 'start'
                : 'middle'
            "
            class="activity-label"
            :class="{
              'next-up': slot.id === nextActivity?.id,
              'wake-label': slot.type === 'wake',
              'bedtime-label': slot.type === 'bedtime',
            }"
          >
            {{ slot.label }}
          </text>
        </g>

        <!-- Gradient definitions -->
        <defs>
          <linearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              style="stop-color: var(--baby-mint); stop-opacity: 0.8"
            />
            <stop
              offset="50%"
              style="stop-color: var(--baby-blue); stop-opacity: 0.6"
            />
            <stop
              offset="100%"
              style="stop-color: var(--baby-purple); stop-opacity: 0.4"
            />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>

    <!-- Activity details modal -->
    <div
      v-if="showNapDetails"
      class="nap-details-modal"
      @click.self="closeNapDetails"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h4>{{ getModalTitle() }}</h4>
          <button class="close-button" @click="closeNapDetails">
            <X />
          </button>
        </div>
        <div class="modal-body">
          <p v-if="selectedNap">
            <strong>Time:</strong> {{ formatTime(selectedNap.time) }}
          </p>
          <p v-if="selectedNap?.type === 'nap'">
            <strong>Recommended Duration:</strong>
            {{ formatDuration(getNapDuration()) }}
          </p>
          <p v-if="selectedNap?.type === 'nap'">
            <strong>Status:</strong>
            {{ getNapStatus(selectedNap) }}
          </p>
          <p v-if="selectedNap?.type === 'wake'">
            <strong>Activity:</strong> Start of the day
          </p>
          <p v-if="selectedNap?.type === 'bedtime'">
            <strong>Activity:</strong> Night sleep begins
          </p>
        </div>
      </div>
    </div>

    <!-- Schedule summary -->
    <div class="schedule-summary">
      {{ scheduleSummary }}
    </div>
  </div>
</template>

<style scoped>
.sleep-schedule-donut {
  background: linear-gradient(135deg, var(--baby-lavender), var(--baby-pink));
  border-radius: 20px;
  padding: 1.5rem;
  margin: 1rem 0;
  color: var(--text-dark);
  animation: fadeInUp 0.5s ease;
}

.donut-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.donut-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.next-activity {
  font-size: 0.9rem;
  color: var(--text-light);
  font-weight: 500;
  background: rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 12px;
  display: inline-block;
}

.donut-container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.donut-svg {
  max-width: 100%;
  height: auto;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
}

.progress-arc {
  transition: all 0.3s ease;
}

.current-time-indicator {
  animation: pulse 2s infinite;
  filter: url(#glow);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.time-slot {
  transition: all 0.3s ease;
}

.slot-marker {
  transition: all 0.3s ease;
  cursor: pointer;
}

.slot-marker.completed {
  opacity: 0.8;
}

.slot-marker.glow-blue {
  animation: heartbeatGlowBlue 2s ease-in-out infinite;
}

.slot-marker.glow-purple {
  animation: heartbeatGlowPurple 2s ease-in-out infinite;
}

.slot-marker.glow-mint {
  animation: heartbeatGlowMint 2s ease-in-out infinite;
}

.slot-marker.glow-orange {
  animation: heartbeatGlow 2s ease-in-out infinite;
}

.slot-marker.glow-pink {
  animation: heartbeatGlowPink 2s ease-in-out infinite;
}

.slot-marker.glow-default {
  animation: heartbeatGlow 2s ease-in-out infinite;
}

.slot-marker:hover {
  filter: drop-shadow(0 0 8px currentColor);
}

/* Enhanced heartbeat glow effect for next upcoming activity */
@keyframes heartbeatGlow {
  0%,
  100% {
    filter: drop-shadow(0 0 8px var(--baby-orange))
      drop-shadow(0 0 12px var(--baby-orange));
  }
  50% {
    filter: drop-shadow(0 0 20px var(--baby-orange))
      drop-shadow(0 0 24px var(--baby-orange));
  }
}

@keyframes heartbeatGlowBlue {
  0%,
  100% {
    filter: drop-shadow(0 0 8px #0891b2) drop-shadow(0 0 12px #0891b2);
  }
  50% {
    filter: drop-shadow(0 0 20px #0891b2) drop-shadow(0 0 24px #0891b2);
  }
}

@keyframes heartbeatGlowPurple {
  0%,
  100% {
    filter: drop-shadow(0 0 8px #7c3aed) drop-shadow(0 0 12px #7c3aed);
  }
  50% {
    filter: drop-shadow(0 0 20px #7c3aed) drop-shadow(0 0 24px #7c3aed);
  }
}

@keyframes heartbeatGlowMint {
  0%,
  100% {
    filter: drop-shadow(0 0 8px #059669) drop-shadow(0 0 12px #059669);
  }
  50% {
    filter: drop-shadow(0 0 20px #059669) drop-shadow(0 0 24px #059669);
  }
}

@keyframes heartbeatGlowPink {
  0%,
  100% {
    filter: drop-shadow(0 0 8px #ec4899) drop-shadow(0 0 12px #ec4899);
  }
  50% {
    filter: drop-shadow(0 0 20px #ec4899) drop-shadow(0 0 24px #ec4899);
  }
}

.slot-icon {
  pointer-events: none;
}

.time-label {
  font-size: 11px;
  font-weight: 600;
  fill: var(--text-dark);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
}

.activity-label {
  font-size: 9px;
  font-weight: 500;
  fill: var(--text-light);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
}

.time-label.next-up:not(.wake-label):not(.bedtime-label),
.activity-label.next-up:not(.wake-label):not(.bedtime-label) {
  fill: var(--baby-purple);
  font-weight: 700;
}

.time-label.bedtime-label,
.activity-label.bedtime-label {
  fill: var(--text-dark) !important;
}

.slot-marker.clickable {
  cursor: pointer;
}

/* User-registered nap styles */
.user-registered-nap {
  animation: userNapAppear 0.5s ease;
}

.user-registered-icon {
  pointer-events: none;
  animation: userNapAppear 0.5s ease;
}

@keyframes userNapAppear {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Responsive design */
@media (max-width: 480px) {
  .sleep-schedule-donut {
    padding: 1rem;
  }

  .donut-header h3 {
    font-size: 1rem;
  }

  .next-activity {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }

  .time-label {
    font-size: 10px;
  }

  .activity-label {
    font-size: 8px;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Nap details modal */
.nap-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  max-width: 90vw;
  width: 300px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h4 {
  margin: 0;
  color: var(--text-dark);
  font-size: 1.1rem;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-light);
  padding: 0.25rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f3f4f6;
  color: var(--text-dark);
}

.modal-body {
  font-size: 0.9rem;
  color: var(--text-dark);
  line-height: 1.5;
}

.modal-body p {
  margin: 0.5rem 0;
}

.modal-body strong {
  color: var(--baby-purple);
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.schedule-summary {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--text-dark);
  font-weight: 500;
}
</style>
