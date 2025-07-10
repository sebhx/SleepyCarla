import { ref, computed, onMounted } from 'vue';
import type { AppSettings, AgeRange, ThemeMode, UserSettings, UpdateUserSettingsRequest } from '../../types/settings';
import { api } from '../../services/api';
import { defaultBedtimes, defaultWakeTimes } from '../../data/sleepScience';

// Default settings (fallback)
const defaultSettings: AppSettings = {
  babyAge: {
    ageRange: 'older-infant',
    exactAgeInWeeks: 32,
  },
  bedtime: '19:00',
  morningWake: '07:00',
  enableNapSuggestions: true,
  notificationsEnabled: false,
  theme: 'light',
};

// Reactive settings state
const settings = ref<AppSettings>({ ...defaultSettings });
const isLoading = ref(true);
const error = ref<string | null>(null);

// Convert API UserSettings to AppSettings format
function convertApiToAppSettings(apiSettings: UserSettings): AppSettings {
  return {
    babyAge: {
      ageRange: apiSettings.babyAgeRange,
      exactAgeInWeeks: apiSettings.babyExactAgeWeeks,
    },
    bedtime: apiSettings.bedtime,
    morningWake: apiSettings.morningWake,
    enableNapSuggestions: apiSettings.enableNapSuggestions,
    notificationsEnabled: apiSettings.notificationsEnabled,
    theme: apiSettings.theme,
  };
}

// Convert AppSettings to API UpdateUserSettingsRequest format
function convertAppToApiSettings(appSettings: AppSettings): UpdateUserSettingsRequest {
  return {
    babyAgeRange: appSettings.babyAge.ageRange,
    babyExactAgeWeeks: appSettings.babyAge.exactAgeInWeeks,
    bedtime: appSettings.bedtime,
    morningWake: appSettings.morningWake,
    enableNapSuggestions: appSettings.enableNapSuggestions,
    notificationsEnabled: appSettings.notificationsEnabled,
    theme: appSettings.theme,
  };
}

// Load settings from API
async function loadSettings() {
  try {
    isLoading.value = true;
    error.value = null;
    const apiSettings = await api.getUserSettings();
    settings.value = convertApiToAppSettings(apiSettings);
    console.log('✅ Settings loaded from API:', settings.value);
  } catch (err) {
    console.error('❌ Failed to load settings from API:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load settings';
    // Keep default settings on error
  } finally {
    isLoading.value = false;
  }
}

// Save settings to API
async function saveSettings(newSettings: AppSettings) {
  try {
    const apiRequest = convertAppToApiSettings(newSettings);
    const updatedSettings = await api.updateUserSettings(apiRequest);
    settings.value = convertApiToAppSettings(updatedSettings);
    console.log('✅ Settings saved to API:', settings.value);
  } catch (err) {
    console.error('❌ Failed to save settings to API:', err);
    error.value = err instanceof Error ? err.message : 'Failed to save settings';
    throw err; // Re-throw so UI can handle the error
  }
}

// Reset settings to defaults
async function resetSettings() {
  try {
    const resetSettings = await api.resetUserSettings();
    settings.value = convertApiToAppSettings(resetSettings);
    console.log('✅ Settings reset to defaults:', settings.value);
  } catch (err) {
    console.error('❌ Failed to reset settings:', err);
    error.value = err instanceof Error ? err.message : 'Failed to reset settings';
    throw err;
  }
}

// Computed properties for easy access
const currentAgeRange = computed(() => settings.value.babyAge.ageRange);
const currentBedtime = computed(() => settings.value.bedtime);
const currentMorningWake = computed(() => settings.value.morningWake);
const napSuggestionsEnabled = computed(() => settings.value.enableNapSuggestions);
const notificationsEnabled = computed(() => settings.value.notificationsEnabled);
const currentTheme = computed(() => settings.value.theme);

// Helper functions with API persistence
const updateAgeRange = async (newAgeRange: AgeRange) => {
  const newSettings = { ...settings.value };
  newSettings.babyAge.ageRange = newAgeRange;
  // Update default times for new age range
  newSettings.bedtime = defaultBedtimes[newAgeRange];
  newSettings.morningWake = defaultWakeTimes[newAgeRange];
  await saveSettings(newSettings);
};

const updateBedtime = async (newBedtime: string) => {
  const newSettings = { ...settings.value };
  newSettings.bedtime = newBedtime;
  await saveSettings(newSettings);
};

const updateMorningWake = async (newMorningWake: string) => {
  const newSettings = { ...settings.value };
  newSettings.morningWake = newMorningWake;
  await saveSettings(newSettings);
};

const toggleNapSuggestions = async () => {
  const newSettings = { ...settings.value };
  newSettings.enableNapSuggestions = !newSettings.enableNapSuggestions;
  await saveSettings(newSettings);
};

const toggleNotifications = async () => {
  const newSettings = { ...settings.value };
  newSettings.notificationsEnabled = !newSettings.notificationsEnabled;
  await saveSettings(newSettings);
};

const setTheme = async (theme: ThemeMode) => {
  const newSettings = { ...settings.value };
  newSettings.theme = theme;
  await saveSettings(newSettings);
};

// Export composable
export function useSettings() {
  // Load settings on first use
  onMounted(() => {
    loadSettings();
  });

  return {
    // Reactive state
    settings: computed(() => settings.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // Computed properties
    currentAgeRange,
    currentBedtime,
    currentMorningWake,
    napSuggestionsEnabled,
    notificationsEnabled,
    currentTheme,
    
    // Actions (all async now)
    saveSettings,
    updateAgeRange,
    updateBedtime,
    updateMorningWake,
    toggleNapSuggestions,
    toggleNotifications,
    setTheme,
    resetSettings,
    
    // Utils
    loadSettings,
    clearError: () => { error.value = null; },
  };
}
