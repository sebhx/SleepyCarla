<script setup lang="ts">
import { computed } from "vue";

// Props
const props = defineProps<{
  name: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  class?: string;
}>();

// Compute size with default
const iconSize = computed(() => {
  if (typeof props.size === "number") return `${props.size}px`;
  return props.size || "24px";
});

// SVG paths for different icons
const icons: Record<string, string> = {
  // Sleep/nap icons
  sleep: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>`,
  moon: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>`,
  sun: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3V1M12 23V21M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22M12 8A4 4 0 0112 16A4 4 0 0112 8Z"/>`,
  bed: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 12H22M2 17H22M6 12V9A4 4 0 0110 5H14A4 4 0 0118 9V12M2 12V17A2 2 0 004 19H20A2 2 0 0022 17V12"/>`,

  // Action icons
  play: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5V19L19 12L8 5Z"/>`,
  pause: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 4H10V20H6V4ZM14 4H18V20H14V4Z"/>`,
  stop: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5H19V19H5V5Z"/>`,
  plus: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5V19M5 12H19"/>`,
  edit: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4A2 2 0 002 6V18A2 2 0 004 20H16A2 2 0 0018 18V11M18.5 2.5A2.121 2.121 0 0121.5 5.5L12 15L8 16L9 12L18.5 2.5Z"/>`,
  delete: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6H5H21M8 6V4A2 2 0 0110 2H14A2 2 0 0116 4V6M19 6V20A2 2 0 0117 22H7A2 2 0 015 20V6H19ZM10 11V17M14 11V17"/>`,

  // Navigation icons
  settings: `<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 8.5V4.5M15.5 12H19.5M12 15.5V19.5M8.5 12H4.5M14.12 9.88L16.95 7.05M14.12 14.12L16.95 16.95M9.88 14.12L7.05 16.95M9.88 9.88L7.05 7.05" stroke="currentColor" stroke-linecap="round" stroke-width="2"/>`,
  close: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6L18 18"/>`,
  check: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17L4 12"/>`,

  // Time icons
  clock: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V12L16 14M21 12A9 9 0 1112 3A9 9 0 0121 12Z"/>`,
  timer: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 2H14M12 6V12L16 14M21 12A9 9 0 1112 3A9 9 0 0121 12Z"/>`,

  // Analytics icons
  chart: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3V21H21M9 9L12 6L16 10L21 5"/>`,
  trend: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 17L9 11L13 15L21 7M16 7H21V12"/>`,
  analytics: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3V21H21M7 14L9.5 11.5L13 15L17 11M7 14H17M7 14V18H17V14"/>`,
  dashboard: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12A9 9 0 0021 12M3 12H21M3 12C3 16.97 7.03 21 12 21S21 16.97 21 12M12 3V21M12 3C16.97 3 21 7.03 21 12M12 3C7.03 3 3 7.03 3 12"/>`,

  // Baby-specific icons
  baby: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 12A5 5 0 1012 2A5 5 0 0012 12ZM12 14C16.418 14 20 17.582 20 22H4C4 17.582 7.582 14 12 14Z"/>`,
  bottle: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11H19L17 21H7L5 11ZM7 7V11M17 7V11M9 7V2H15V7"/>`,

  // Status icons
  alert: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9V13M12 17H12.01M21 12A9 9 0 1112 3A9 9 0 0121 12Z"/>`,
  info: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16V12M12 8H12.01M21 12A9 9 0 1112 3A9 9 0 0121 12Z"/>`,
  success: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12L11 14L15 10M21 12A9 9 0 1112 3A9 9 0 0121 12Z"/>`,

  // Calendar/date icons
  calendar: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9H21M7 3V5M17 3V5M6 12H10V16H6V12ZM6 1A2 2 0 014 3V5A2 2 0 016 7H18A2 2 0 0020 5V3A2 2 0 0018 1H6ZM20 7V19A2 2 0 0118 21H6A2 2 0 014 19V7H20Z"/>`,

  // Toggle icons
  toggle: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8.5A4.5 4.5 0 0112.5 4H7.5A4.5 4.5 0 003 8.5V8.5A4.5 4.5 0 007.5 13H12.5A4.5 4.5 0 0017 8.5V8.5ZM12.5 8.5A1.5 1.5 0 1015 7A1.5 1.5 0 0012.5 8.5Z"/>`,
};

// Get icon path
const iconPath = computed(() => {
  return icons[props.name] || icons.info; // fallback to info icon
});
</script>

<template>
  <svg
    :class="props.class"
    :width="iconSize"
    :height="iconSize"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :style="{ color: color || 'currentColor' }"
  >
    <g v-html="iconPath" :stroke-width="strokeWidth || 2" />
  </svg>
</template>

<style scoped>
svg {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
