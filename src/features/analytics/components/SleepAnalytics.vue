<script setup lang="ts">
import { computed, ref } from "vue";
import type { SleepActivityEntry } from "../../../types/sleep-refactored";
import { useSleepAnalytics } from "../sleepAnalytics";
import { BarChart3, TrendingUp } from "lucide-vue-next";
import {
  formatLocalizedDateShort,
  formatLocalizedDateFull,
} from "../../../shared/utils/dateUtils";

const props = defineProps<{
  sleepEntries: SleepActivityEntry[];
}>();

const sleepEntriesRef = computed(() => props.sleepEntries);
const { averages, getPatternsForLastDays } = useSleepAnalytics(sleepEntriesRef);

// Tab functionality
const activeTab = ref<"overview" | "trends">("overview");

// Get last 5 days for both tabs (consistency)
const lastFiveDaysPatterns = computed(() => getPatternsForLastDays(5));

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// Modern SVG Chart with ultra-smooth curves
const chartData = computed(() => {
  const patterns = lastFiveDaysPatterns.value;
  if (!patterns.length) return null;

  const chartWidth = 400;
  const chartHeight = 200;
  const padding = 40;
  const innerWidth = chartWidth - 2 * padding;
  const innerHeight = chartHeight - 2 * padding;

  // Normalize data
  const maxSleepHours = Math.max(
    ...patterns.map((p) => p.totalSleepDuration / 60),
    8
  );
  const maxNapCount = Math.max(...patterns.map((p) => p.napCount), 4);

  // Calculate points for sleep duration
  const sleepPoints = patterns.map((pattern, index) => {
    const x = padding + (index * innerWidth) / (patterns.length - 1);
    const normalizedValue = pattern.totalSleepDuration / 60 / maxSleepHours;
    const y = padding + innerHeight - normalizedValue * innerHeight;
    return { x, y, value: pattern.totalSleepDuration / 60, date: pattern.date };
  });

  // Calculate points for nap count
  const napPoints = patterns.map((pattern, index) => {
    const x = padding + (index * innerWidth) / (patterns.length - 1);
    const normalizedValue = pattern.napCount / maxNapCount;
    const y = padding + innerHeight - normalizedValue * innerHeight;
    return { x, y, value: pattern.napCount, date: pattern.date };
  });

  // Ultra-smooth curve generation using improved Catmull-Rom splines
  const generateSmoothPath = (
    points: typeof sleepPoints,
    tension = 0.5
  ): string => {
    if (points.length < 2) return "";
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[0];
      const p1 = points[i];
      const p2 = points[i + 1] || points[points.length - 1];
      const p3 = points[i + 2] || points[points.length - 1];

      // Calculate control points for ultra-smooth Catmull-Rom curves
      const cp1x = p1.x + ((p2.x - p0.x) * tension) / 6;
      const cp1y = p1.y + ((p2.y - p0.y) * tension) / 6;
      const cp2x = p2.x - ((p3.x - p1.x) * tension) / 6;
      const cp2y = p2.y - ((p3.y - p1.y) * tension) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  // Generate gradient definitions
  const sleepGradientId = "sleepGradient";
  const napGradientId = "napGradient";
  const sleepAreaPath =
    generateSmoothPath(sleepPoints) +
    ` L ${sleepPoints[sleepPoints.length - 1].x} ${chartHeight - padding} L ${
      sleepPoints[0].x
    } ${chartHeight - padding} Z`;
  const napAreaPath =
    generateSmoothPath(napPoints) +
    ` L ${napPoints[napPoints.length - 1].x} ${chartHeight - padding} L ${
      napPoints[0].x
    } ${chartHeight - padding} Z`;

  return {
    chartWidth,
    chartHeight,
    padding,
    innerWidth,
    innerHeight,
    sleepPoints,
    napPoints,
    sleepPath: generateSmoothPath(sleepPoints),
    napPath: generateSmoothPath(napPoints),
    sleepAreaPath,
    napAreaPath,
    sleepGradientId,
    napGradientId,
    maxSleepHours,
    maxNapCount,
    labels: patterns.map((p) => formatLocalizedDateShort(p.date)),
  };
});

// Animated chart entry
const chartVisible = ref(false);
setTimeout(() => {
  chartVisible.value = true;
}, 100);

// Health app style data display
const selectedDataPoint = ref<{
  date: Date;
  sleepHours: number;
  napCount: number;
  napDuration: number;
  nightDuration: number;
  totalDuration: number;
} | null>(null);

const showDataPoint = (point: any, _type: "sleep" | "nap") => {
  const pattern = lastFiveDaysPatterns.value.find(
    (p) => p.date.toDateString() === point.date.toDateString()
  );

  if (pattern) {
    selectedDataPoint.value = {
      date: point.date,
      sleepHours: pattern.totalSleepDuration / 60,
      napCount: pattern.napCount,
      napDuration: pattern.totalNapDuration,
      nightDuration: pattern.nightSleepDuration,
      totalDuration: pattern.totalSleepDuration,
    };
  }
};

const closeDataPoint = () => {
  selectedDataPoint.value = null;
};

// Overview bar chart data
const overviewChartData = computed(() => {
  const patterns = lastFiveDaysPatterns.value;
  if (!patterns.length) return null;

  const chartWidth = 350;
  const chartHeight = 180;
  const padding = 40;
  const innerWidth = chartWidth - 2 * padding;
  const innerHeight = chartHeight - 2 * padding;

  // Calculate bar dimensions
  const barWidth = (innerWidth / patterns.length) * 0.6;
  const barSpacing = innerWidth / patterns.length;

  // Normalize data for bar heights
  const maxTotal = Math.max(...patterns.map((p) => p.totalSleepDuration), 600);
  const maxNap = Math.max(...patterns.map((p) => p.totalNapDuration), 180);
  const maxNight = Math.max(...patterns.map((p) => p.nightSleepDuration), 600);

  // Calculate bar data
  const bars = patterns.map((pattern, index) => {
    const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;

    // Calculate heights as percentages of available space
    const napHeight = (pattern.totalNapDuration / maxTotal) * innerHeight;
    const nightHeight = (pattern.nightSleepDuration / maxTotal) * innerHeight;

    return {
      x,
      napHeight,
      nightHeight,
      napY: padding + innerHeight - napHeight,
      nightY: padding + innerHeight - nightHeight,
      pattern,
      label: formatLocalizedDateShort(pattern.date),
    };
  });

  return {
    chartWidth,
    chartHeight,
    padding,
    innerWidth,
    innerHeight,
    barWidth,
    bars,
    maxTotal,
    maxNap,
    maxNight,
  };
});

const showOverviewDataPoint = (bar: any) => {
  selectedDataPoint.value = {
    date: bar.pattern.date,
    sleepHours: bar.pattern.totalSleepDuration / 60,
    napCount: bar.pattern.napCount,
    napDuration: bar.pattern.totalNapDuration,
    nightDuration: bar.pattern.nightSleepDuration,
    totalDuration: bar.pattern.totalSleepDuration,
  };
};
</script>

<template>
  <div class="analytics-dashboard">
    <h3>
      <BarChart3 :size="20" />
      Sleep Analytics
    </h3>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button
        class="tab-button"
        :class="{ active: activeTab === 'overview' }"
        @click="activeTab = 'overview'"
      >
        <BarChart3 :size="16" />
        Overview
      </button>
      <button
        class="tab-button"
        :class="{ active: activeTab === 'trends' }"
        @click="activeTab = 'trends'"
      >
        <TrendingUp :size="16" />
        Trends
      </button>
    </div>

    <!-- Overview Tab -->
    <div v-if="activeTab === 'overview'" class="tab-content">
      <!-- Weekly Averages -->
      <div v-if="averages" class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ averages.napCount }}</div>
          <div class="stat-label">Avg Naps/Day</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">
            {{ formatDuration(averages.totalNapDuration) }}
          </div>
          <div class="stat-label">Avg Nap Time</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">
            {{ formatDuration(averages.nightSleepDuration) }}
          </div>
          <div class="stat-label">Avg Night Sleep</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">
            {{ formatDuration(averages.totalSleepDuration) }}
          </div>
          <div class="stat-label">Total Sleep</div>
        </div>
      </div>

      <!-- Sleep Pattern Bar Chart -->
      <div v-if="overviewChartData" class="sleep-overview-chart">
        <h4>Last 5 Days</h4>
        <div class="overview-chart-container">
          <svg
            :width="overviewChartData.chartWidth"
            :height="overviewChartData.chartHeight"
            viewBox="0 0 350 180"
            class="overview-chart"
          >
            <!-- Gradient definitions -->
            <defs>
              <!-- Nap gradient -->
              <linearGradient
                id="overviewNapGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  style="stop-color: #60a5fa; stop-opacity: 0.9"
                />
                <stop
                  offset="100%"
                  style="stop-color: #3b82f6; stop-opacity: 0.8"
                />
              </linearGradient>

              <!-- Night gradient -->
              <linearGradient
                id="overviewNightGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  style="stop-color: #a855f7; stop-opacity: 0.9"
                />
                <stop
                  offset="100%"
                  style="stop-color: #8b45c1; stop-opacity: 0.8"
                />
              </linearGradient>

              <!-- Shadow filter -->
              <filter
                id="barShadow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="4"
                  flood-color="rgba(0,0,0,0.15)"
                />
              </filter>
            </defs>

            <!-- Background -->
            <rect
              :x="overviewChartData.padding"
              :y="overviewChartData.padding"
              :width="overviewChartData.innerWidth"
              :height="overviewChartData.innerHeight"
              fill="rgba(255, 255, 255, 0.1)"
              rx="8"
              ry="8"
            />

            <!-- Horizontal grid lines -->
            <g class="grid-lines" opacity="0.3">
              <line
                v-for="i in 4"
                :key="`grid-${i}`"
                :x1="overviewChartData.padding"
                :y1="
                  overviewChartData.padding +
                  (i * overviewChartData.innerHeight) / 4
                "
                :x2="overviewChartData.padding + overviewChartData.innerWidth"
                :y2="
                  overviewChartData.padding +
                  (i * overviewChartData.innerHeight) / 4
                "
                stroke="rgba(255,255,255,0.6)"
                stroke-width="1"
                stroke-dasharray="2,4"
              />
            </g>

            <!-- Bars -->
            <g class="chart-bars">
              <!-- Nap bars -->
              <rect
                v-for="(bar, index) in overviewChartData.bars"
                :key="`nap-${index}`"
                :x="bar.x"
                :y="bar.napY"
                :width="overviewChartData.barWidth * 0.4"
                :height="bar.napHeight"
                fill="url(#overviewNapGradient)"
                rx="3"
                ry="3"
                class="chart-bar nap-bar"
                filter="url(#barShadow)"
                @click="showOverviewDataPoint(bar)"
              >
                <title>
                  {{ bar.label }}:
                  {{ formatDuration(bar.pattern.totalNapDuration) }} naps
                </title>
              </rect>

              <!-- Night bars -->
              <rect
                v-for="(bar, index) in overviewChartData.bars"
                :key="`night-${index}`"
                :x="bar.x + overviewChartData.barWidth * 0.45"
                :y="bar.nightY"
                :width="overviewChartData.barWidth * 0.4"
                :height="bar.nightHeight"
                fill="url(#overviewNightGradient)"
                rx="3"
                ry="3"
                class="chart-bar night-bar"
                filter="url(#barShadow)"
                @click="showOverviewDataPoint(bar)"
              >
                <title>
                  {{ bar.label }}:
                  {{ formatDuration(bar.pattern.nightSleepDuration) }} night
                  sleep
                </title>
              </rect>
            </g>

            <!-- X-axis labels -->
            <g class="axis-labels">
              <text
                v-for="(bar, index) in overviewChartData.bars"
                :key="`label-${index}`"
                :x="bar.x + overviewChartData.barWidth / 2"
                :y="overviewChartData.chartHeight - 10"
                text-anchor="middle"
                class="axis-label"
              >
                {{ bar.label }}
              </text>
            </g>

            <!-- Y-axis labels -->
            <g class="y-axis-labels">
              <text
                x="15"
                :y="overviewChartData.padding + 5"
                class="axis-label small"
              >
                {{ formatDuration(overviewChartData.maxTotal) }}
              </text>
              <text
                x="15"
                :y="
                  overviewChartData.chartHeight - overviewChartData.padding - 5
                "
                class="axis-label small"
              >
                0h
              </text>
            </g>

            <!-- Nap count indicators -->
            <g class="nap-indicators">
              <circle
                v-for="(bar, index) in overviewChartData.bars"
                :key="`indicator-${index}`"
                :cx="bar.x + overviewChartData.barWidth / 2"
                :cy="bar.napY - 15"
                r="8"
                fill="white"
                stroke="#3b82f6"
                stroke-width="2"
                class="nap-indicator"
              />
              <text
                v-for="(bar, index) in overviewChartData.bars"
                :key="`count-${index}`"
                :x="bar.x + overviewChartData.barWidth / 2"
                :y="bar.napY - 11"
                text-anchor="middle"
                class="nap-count-text"
              >
                {{ bar.pattern.napCount }}
              </text>
            </g>
          </svg>

          <!-- Legend -->
          <div class="overview-legend">
            <div class="legend-item">
              <div class="legend-dot nap-dot"></div>
              <span>Nap Time</span>
            </div>
            <div class="legend-item">
              <div class="legend-dot night-dot"></div>
              <span>Night Sleep</span>
            </div>
            <div class="legend-item">
              <div class="legend-indicator">
                <div class="legend-circle">3</div>
              </div>
              <span>Nap Count</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Trends Tab -->
    <div v-if="activeTab === 'trends'" class="tab-content">
      <div v-if="chartData" class="trends-container">
        <h4>Sleep Trends (Last 5 Days)</h4>

        <!-- Modern SVG Chart -->
        <div class="modern-chart-container">
          <svg
            :width="chartData.chartWidth"
            :height="chartData.chartHeight"
            viewBox="0 0 400 200"
            class="modern-chart"
            :class="{ 'chart-animated': chartVisible }"
          >
            <!-- Gradient definitions -->
            <defs>
              <!-- Sleep gradients -->
              <linearGradient
                :id="chartData.sleepGradientId"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  style="stop-color: #8b45c1; stop-opacity: 0.4"
                />
                <stop
                  offset="50%"
                  style="stop-color: #a855f7; stop-opacity: 0.2"
                />
                <stop
                  offset="100%"
                  style="stop-color: #8b45c1; stop-opacity: 0.05"
                />
              </linearGradient>

              <!-- Nap gradients -->
              <linearGradient
                :id="chartData.napGradientId"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  style="stop-color: #3b82f6; stop-opacity: 0.4"
                />
                <stop
                  offset="50%"
                  style="stop-color: #60a5fa; stop-opacity: 0.2"
                />
                <stop
                  offset="100%"
                  style="stop-color: #3b82f6; stop-opacity: 0.05"
                />
              </linearGradient>

              <!-- Grid pattern -->
              <pattern
                id="grid"
                width="25"
                height="25"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 25 0 L 0 0 0 25"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  stroke-width="0.5"
                />
              </pattern>

              <!-- Enhanced glow effects -->
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <!-- Shadow filter -->
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow
                  dx="2"
                  dy="4"
                  stdDeviation="6"
                  flood-color="rgba(0,0,0,0.1)"
                />
              </filter>
            </defs>

            <!-- Modern gradient background -->
            <rect
              :x="chartData.padding"
              :y="chartData.padding"
              :width="chartData.innerWidth"
              :height="chartData.innerHeight"
              fill="url(#chartBackground)"
              rx="12"
              ry="12"
              opacity="0.4"
            />

            <!-- Subtle grid lines -->
            <g class="grid-lines" opacity="0.2">
              <!-- Horizontal grid lines -->
              <line
                v-for="i in 4"
                :key="`h-${i}`"
                :x1="chartData.padding"
                :y1="chartData.padding + (i * chartData.innerHeight) / 4"
                :x2="chartData.padding + chartData.innerWidth"
                :y2="chartData.padding + (i * chartData.innerHeight) / 4"
                stroke="rgba(255,255,255,0.8)"
                stroke-width="1"
                stroke-dasharray="2,4"
              />

              <!-- Vertical grid lines -->
              <line
                v-for="i in chartData.labels.length"
                :key="`v-${i}`"
                :x1="
                  chartData.padding +
                  ((i - 1) * chartData.innerWidth) /
                    (chartData.labels.length - 1)
                "
                :y1="chartData.padding"
                :x2="
                  chartData.padding +
                  ((i - 1) * chartData.innerWidth) /
                    (chartData.labels.length - 1)
                "
                :y2="chartData.padding + chartData.innerHeight"
                stroke="rgba(255,255,255,0.6)"
                stroke-width="1"
                stroke-dasharray="2,4"
              />
            </g>

            <!-- Add background gradient after other defs -->
            <defs>
              <linearGradient
                id="chartBackground"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  style="stop-color: #f8fafc; stop-opacity: 0.8"
                />
                <stop
                  offset="100%"
                  style="stop-color: #e2e8f0; stop-opacity: 0.6"
                />
              </linearGradient>
            </defs>

            <!-- Sleep area -->
            <path
              :d="chartData.sleepAreaPath"
              :fill="`url(#${chartData.sleepGradientId})`"
              class="chart-area sleep-area"
            />

            <!-- Nap area -->
            <path
              :d="chartData.napAreaPath"
              :fill="`url(#${chartData.napGradientId})`"
              class="chart-area nap-area"
            />

            <!-- Sleep line -->
            <path
              :d="chartData.sleepPath"
              fill="none"
              stroke="url(#sleepLineGradient)"
              stroke-width="4"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="chart-line sleep-line"
              filter="url(#glow)"
            />

            <!-- Nap line -->
            <path
              :d="chartData.napPath"
              fill="none"
              stroke="url(#napLineGradient)"
              stroke-width="4"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="chart-line nap-line"
              filter="url(#glow)"
            />

            <!-- Add line gradients after other defs -->
            <defs>
              <linearGradient
                id="sleepLineGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" style="stop-color: #8b45c1" />
                <stop offset="50%" style="stop-color: #a855f7" />
                <stop offset="100%" style="stop-color: #8b45c1" />
              </linearGradient>

              <linearGradient
                id="napLineGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" style="stop-color: #3b82f6" />
                <stop offset="50%" style="stop-color: #60a5fa" />
                <stop offset="100%" style="stop-color: #3b82f6" />
              </linearGradient>
            </defs>

            <!-- Sleep data points -->
            <g class="data-points sleep-points">
              <circle
                v-for="(point, index) in chartData.sleepPoints"
                :key="`sleep-${index}`"
                :cx="point.x"
                :cy="point.y"
                r="6"
                fill="#8B45C1"
                stroke="white"
                stroke-width="3"
                class="data-point sleep-point"
                filter="url(#shadow)"
                @click="showDataPoint(point, 'sleep')"
              >
                <title>
                  {{ point.date.toLocaleDateString() }}:
                  {{ point.value.toFixed(1) }}h total sleep
                </title>
              </circle>
            </g>

            <!-- Nap data points -->
            <g class="data-points nap-points">
              <circle
                v-for="(point, index) in chartData.napPoints"
                :key="`nap-${index}`"
                :cx="point.x"
                :cy="point.y"
                r="6"
                fill="#3B82F6"
                stroke="white"
                stroke-width="3"
                class="data-point nap-point"
                filter="url(#shadow)"
                @click="showDataPoint(point, 'nap')"
              >
                <title>
                  {{ point.date.toLocaleDateString() }}: {{ point.value }} naps
                </title>
              </circle>
            </g>

            <!-- X-axis labels -->
            <g class="axis-labels">
              <text
                v-for="(label, index) in chartData.labels"
                :key="`label-${index}`"
                :x="
                  chartData.padding +
                  (index * chartData.innerWidth) / (chartData.labels.length - 1)
                "
                :y="chartData.chartHeight - 10"
                text-anchor="middle"
                class="axis-label"
              >
                {{ label }}
              </text>
            </g>

            <!-- Y-axis labels for sleep -->
            <g class="y-axis-labels sleep-axis">
              <text x="15" :y="chartData.padding + 5" class="axis-label small">
                {{ chartData.maxSleepHours.toFixed(1) }}h
              </text>
              <text
                x="15"
                :y="chartData.chartHeight - chartData.padding - 5"
                class="axis-label small"
              >
                0h
              </text>
            </g>

            <!-- Y-axis labels for naps -->
            <g class="y-axis-labels nap-axis">
              <text
                :x="chartData.chartWidth - 15"
                :y="chartData.padding + 5"
                class="axis-label small"
                text-anchor="end"
              >
                {{ chartData.maxNapCount }}
              </text>
              <text
                :x="chartData.chartWidth - 15"
                :y="chartData.chartHeight - chartData.padding - 5"
                class="axis-label small"
                text-anchor="end"
              >
                0
              </text>
            </g>
          </svg>

          <!-- Modern legend -->
          <div class="modern-legend">
            <div class="legend-item">
              <div class="legend-dot sleep-dot"></div>
              <span>Total Sleep (hours)</span>
            </div>
            <div class="legend-item">
              <div class="legend-dot nap-dot"></div>
              <span>Nap Count</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Health App Style Data Display -->
      <div
        v-if="selectedDataPoint"
        class="data-point-modal"
        @click="closeDataPoint"
      >
        <div class="data-point-content" @click.stop>
          <div class="data-point-header">
            <h3>
              {{ formatLocalizedDateFull(selectedDataPoint.date) }}
            </h3>
            <button class="close-btn" @click="closeDataPoint">×</button>
          </div>

          <div class="data-point-metrics">
            <div class="metric-card primary">
              <div class="metric-icon">🛌</div>
              <div class="metric-info">
                <div class="metric-value">
                  {{ formatDuration(selectedDataPoint.totalDuration) }}
                </div>
                <div class="metric-label">Total Sleep</div>
              </div>
            </div>

            <div class="metric-row">
              <div class="metric-card">
                <div class="metric-icon">🌙</div>
                <div class="metric-info">
                  <div class="metric-value">
                    {{ formatDuration(selectedDataPoint.nightDuration) }}
                  </div>
                  <div class="metric-label">Night Sleep</div>
                </div>
              </div>

              <div class="metric-card">
                <div class="metric-icon">☀️</div>
                <div class="metric-info">
                  <div class="metric-value">
                    {{ formatDuration(selectedDataPoint.napDuration) }}
                  </div>
                  <div class="metric-label">Nap Time</div>
                </div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">📊</div>
              <div class="metric-info">
                <div class="metric-value">{{ selectedDataPoint.napCount }}</div>
                <div class="metric-label">Number of Naps</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data Message -->
      <div v-else class="no-data">
        <TrendingUp :size="24" />
        <p>Track more sleep data to see trends!</p>
      </div>
    </div>

    <!-- No Data Message -->
    <div v-if="!averages" class="no-data">
      <BarChart3 :size="24" />
      <p>Start tracking sleep to see analytics!</p>
    </div>
  </div>
</template>

<style scoped>
.analytics-dashboard {
  background: linear-gradient(135deg, var(--baby-lavender), var(--baby-pink));
  border-radius: 20px;
  padding: 1.5rem;
  margin: 1rem 0;
  color: var(--text-dark);
}

.analytics-dashboard h3 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-light);
  font-weight: 500;
}

.weekly-pattern h4 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.pattern-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: flex-end;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  padding: 1rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.day-pattern {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  width: 100%;
}

.day-label {
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-dark);
}

/* Force center alignment of sleep bars */
.day-pattern .sleep-bars {
  display: flex !important;
  align-items: flex-end !important;
  justify-content: center !important;
  gap: 2px !important;
  height: 60px !important;
  margin-bottom: 0.5rem !important;
  width: 100% !important;
}

.day-pattern .sleep-bars .sleep-bar {
  margin: 0 auto;
}

.sleep-bar {
  width: 12px;
  border-radius: 6px 6px 0 0;
  transition: all 0.3s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.nap-bar {
  background: linear-gradient(to top, var(--baby-blue), var(--baby-mint));
}

.night-bar {
  background: linear-gradient(to top, var(--baby-purple), var(--baby-lavender));
}

.sleep-bar:hover {
  transform: scale(1.1);
}

.nap-count {
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--baby-blue);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  padding: 0.25rem 0.5rem;
  min-width: 20px;
  text-align: center;
  align-self: center;
  display: inline-block;
}

.trends-chart {
  margin-top: 2rem;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 120px;
  overflow: hidden;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* Chart.js specific styles */

.total-sleep-chart,
.nap-count-chart {
  position: absolute;
  top: 0;
  left: 0;
}

.no-data {
  text-align: center;
  color: var(--text-light);
  font-style: italic;
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.no-data p {
  margin: 0;
  font-size: 1.1rem;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 0.25rem;
}

.tab-button {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: var(--text-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.5);
}

.tab-button.active {
  background: white;
  color: var(--baby-purple);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Overview Bar Chart Styles */
.sleep-overview-chart {
  margin-bottom: 1.5rem;
}

.sleep-overview-chart h4 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: var(--text-dark);
  font-weight: 600;
}

.overview-chart-container {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95),
    rgba(255, 255, 255, 0.9)
  );
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.overview-chart {
  width: 100%;
  height: auto;
  max-width: 100%;
  overflow: visible;
}

.chart-bar {
  transition: all 0.3s ease;
  cursor: pointer;
}

.chart-bar:hover {
  opacity: 0.8;
  transform: translateY(-2px);
}

.nap-indicator {
  transition: all 0.3s ease;
}

.nap-count-text {
  font-size: 10px;
  font-weight: 600;
  fill: #3b82f6;
}

.overview-legend {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.overview-legend .legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 12px;
  color: #374151;
  font-weight: 500;
}

.overview-legend .legend-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  position: relative;
  transition: all 0.3s ease;
}

.overview-legend .legend-dot::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  transform: translate(-50%, -50%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.overview-legend .legend-item:hover .legend-dot {
  transform: scale(1.2);
}

.overview-legend .legend-dot.nap-dot {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.overview-legend .legend-dot.night-dot {
  background: linear-gradient(135deg, #a855f7, #8b45c1);
  box-shadow: 0 4px 12px rgba(139, 69, 193, 0.3);
}

.legend-indicator {
  display: flex;
  align-items: center;
}

.legend-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  border: 2px solid #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  color: #3b82f6;
}

@media (max-width: 480px) {
  .overview-chart-container {
    padding: 1rem;
  }

  .overview-legend {
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }
}

/* Trends Styles */
.trends-container h4 {
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
  color: var(--text-dark);
  font-weight: 600;
}

.trend-section {
  margin-bottom: 2rem;
}

.trend-section h5 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: var(--text-dark);
  font-weight: 600;
}

.trends-container .chart-container {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  height: 320px;
}

.trend-chart {
  height: 300px !important;
  width: 100% !important;
}

/* Modern SVG Chart Styles */
.modern-chart-container {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95),
    rgba(255, 255, 255, 0.9)
  );
  border-radius: 24px;
  padding: 2rem;
  margin: 1rem 0;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.modern-chart {
  width: 100%;
  height: auto;
  max-width: 100%;
  filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.08));
  overflow: visible;
}

.chart-animated .chart-line {
  animation: fadeIn 0.8s ease-out;
}

.chart-animated .chart-area {
  animation: fadeIn 1s ease-out 0.2s both;
}

.chart-animated .data-point {
  animation: fadeIn 0.6s ease-out 0.4s both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.data-point {
  transition: all 0.2s ease;
  cursor: pointer;
}

.sleep-point:hover {
  r: 8;
  fill: #a855f7;
  transform: scale(1.1);
}

.nap-point:hover {
  r: 8;
  fill: #60a5fa;
  transform: scale(1.1);
}

.chart-line {
  transition: all 0.2s ease;
}

.chart-area {
  transition: all 0.4s ease;
}

.axis-label {
  font-size: 12px;
  fill: #6b7280;
  font-weight: 600;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.axis-label.small {
  font-size: 10px;
  fill: #9ca3af;
}

.modern-legend {
  display: flex;
  justify-content: flex-start;
  gap: 3rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 14px;
  color: #374151;
  font-weight: 600;
  transition: all 0.3s ease;
}

.legend-item:hover {
  color: #1f2937;
  transform: translateY(-2px);
}

.legend-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  position: relative;
  transition: all 0.3s ease;
}

.legend-dot::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  transform: translate(-50%, -50%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.legend-item:hover .legend-dot {
  transform: scale(1.2);
}

.sleep-dot {
  background: linear-gradient(135deg, #8b45c1, #a855f7);
  box-shadow: 0 4px 12px rgba(139, 69, 193, 0.3);
}

.nap-dot {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Responsive design */
@media (max-width: 768px) {
  .modern-chart-container {
    padding: 1rem;
  }

  .modern-legend {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .modern-chart {
    max-height: 300px;
  }
}

/* Health App Style Data Display */
.data-point-modal {
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

.data-point-content {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  max-width: 90vw;
  width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
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

.data-point-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.data-point-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.data-point-metrics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.metric-card {
  background: #f8fafc;
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
}

.metric-card:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
}

.metric-card.primary {
  background: linear-gradient(135deg, var(--baby-lavender), var(--baby-pink));
  color: white;
}

.metric-card.primary .metric-value {
  color: white;
}

.metric-card.primary .metric-label {
  color: rgba(255, 255, 255, 0.8);
}

.metric-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.metric-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.metric-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

@media (max-width: 480px) {
  .data-point-content {
    width: 95vw;
    padding: 1rem;
  }

  .metric-row {
    grid-template-columns: 1fr;
  }

  .metric-value {
    font-size: 1.3rem;
  }
}
</style>
