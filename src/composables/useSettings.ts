import { ref, computed, watch } from 'vue';
import type { AppSettings, AgeRange } from '../types/settings';
import { defaultBedtimes, defaultWakeTimes } from '../data/sleepScience';

// Default settings
const defaultSettings: AppSettings = {
  babyAge: {
    ageRange: 'older-infant', // 6-9 months - target age range
    exactAgeInWeeks: 32, // 8 months
  },
  bedtime: '19:00',
  morningWake: '07:00',
  enableNapSuggestions: true,
  notificationsEnabled: true,
  theme: 'light',
};

// Settings storage key
const SETTINGS_KEY = 'sleepycarla-settings';

// Reactive settings state
const settings = ref<AppSettings>(loadSettings());

// Load settings from localStorage
function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all properties exist
      return {
        ...defaultSettings,
        ...parsed,
        babyAge: {
          ...defaultSettings.babyAge,
          ...parsed.babyAge,
        },
      };
    }
  } catch (error) {
    console.warn('Failed to load settings:', error);
  }
  return { ...defaultSettings };
}

// Save settings to localStorage
function saveSettings(newSettings: AppSettings) {
  try {
    settings.value = { ...newSettings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// Watch for changes and auto-save
watch(settings, (newSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  } catch (error) {
    console.error('Failed to auto-save settings:', error);
  }
}, { deep: true });

// Computed properties for easy access
const currentAgeRange = computed(() => settings.value.babyAge.ageRange);
const currentBedtime = computed(() => settings.value.bedtime);
const currentMorningWake = computed(() => settings.value.morningWake);
const napSuggestionsEnabled = computed(() => settings.value.enableNapSuggestions);
const notificationsEnabled = computed(() => settings.value.notificationsEnabled);
const currentTheme = computed(() => settings.value.theme);

// Helper functions
const updateAgeRange = (newAgeRange: AgeRange) => {
  settings.value.babyAge.ageRange = newAgeRange;
  // Update default times for new age range
  settings.value.bedtime = defaultBedtimes[newAgeRange];
  settings.value.morningWake = defaultWakeTimes[newAgeRange];
};

const updateBedtime = (newBedtime: string) => {
  settings.value.bedtime = newBedtime;
};

const updateMorningWake = (newMorningWake: string) => {
  settings.value.morningWake = newMorningWake;
};

const toggleNapSuggestions = () => {
  settings.value.enableNapSuggestions = !settings.value.enableNapSuggestions;
};

const toggleNotifications = () => {
  settings.value.notificationsEnabled = !settings.value.notificationsEnabled;
};

const setTheme = (theme: 'light' | 'dark' | 'auto') => {
  settings.value.theme = theme;
};

// Export composable
export function useSettings() {
  return {
    // Reactive state
    settings: computed(() => settings.value),
    
    // Computed properties
    currentAgeRange,
    currentBedtime,
    currentMorningWake,
    napSuggestionsEnabled,
    notificationsEnabled,
    currentTheme,
    
    // Actions
    saveSettings,
    updateAgeRange,
    updateBedtime,
    updateMorningWake,
    toggleNapSuggestions,
    toggleNotifications,
    setTheme,
    
    // Utils
    loadSettings,
  };
}
