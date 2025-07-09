<script setup lang="ts">
import { ref, computed } from "vue";
import type { SleepEntry } from "../types/sleep";
import {
  Calendar,
  Moon,
  Sun,
  Bed,
  Edit,
  Trash2,
  Info,
  X,
} from "lucide-vue-next";

// Props
interface Props {
  isOpen: boolean;
  sleepEntries: SleepEntry[];
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  close: [];
  editEntry: [entry: SleepEntry];
  deleteEntry: [entryId: string];
}>();

// Reactive state
const activitiesFilter = ref<"all" | "sleep" | "wake">("all");
const activitiesDateRange = ref<"today" | "week" | "month" | "all">("all");

// Computed properties
const allActivities = computed(() => {
  let filteredEntries = [...props.sleepEntries];

  // Apply type filter
  if (activitiesFilter.value !== "all") {
    filteredEntries = filteredEntries.filter(
      (entry) => entry.type === activitiesFilter.value
    );
  }

  // Apply date range filter
  switch (activitiesDateRange.value) {
    case "today": {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filteredEntries = filteredEntries.filter((entry) => {
        const entryDate = new Date(entry.timestamp);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      });
      break;
    }
    case "week": {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredEntries = filteredEntries.filter(
        (entry) => entry.timestamp >= weekAgo
      );
      break;
    }
    case "month": {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filteredEntries = filteredEntries.filter(
        (entry) => entry.timestamp >= monthAgo
      );
      break;
    }
    case "all":
      // No additional filtering
      break;
  }

  return filteredEntries
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .map((entry) => {
      let durationFormatted: string | undefined;
      if (entry.duration) {
        if (entry.duration >= 60) {
          durationFormatted = `${Math.floor(entry.duration / 60)}h ${
            entry.duration % 60
          }m`;
        } else {
          durationFormatted = `${entry.duration}m`;
        }
      }

      return {
        ...entry,
        timeFormatted: entry.timestamp.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        dateFormatted: entry.timestamp.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        durationFormatted,
      };
    });
});

// Methods
const handleClose = () => {
  emit("close");
};

const handleEdit = (entry: SleepEntry) => {
  emit("editEntry", entry);
  emit("close");
};

const handleDelete = (entryId: string) => {
  emit("deleteEntry", entryId);
};

const resetFilters = () => {
  activitiesFilter.value = "all";
  activitiesDateRange.value = "all";
};

// Reset filters when modal opens
const onModalOpen = () => {
  resetFilters();
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleClose">
    <div class="modal all-activities-modal" @click.stop>
      <div class="modal-header">
        <h3>
          <Calendar :size="20" />
          All Activities
        </h3>
        <button class="close-btn" @click="handleClose" aria-label="Close">
          <X :size="24" />
        </button>
      </div>

      <div class="modal-content">
        <!-- Filters -->
        <div class="activity-filters">
          <div class="filter-group">
            <label for="activity-type-filter">Type:</label>
            <select
              id="activity-type-filter"
              v-model="activitiesFilter"
              class="filter-select"
            >
              <option value="all">All Activities</option>
              <option value="sleep">Sleep Sessions</option>
              <option value="wake">Wake Times</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="activity-date-filter">Date Range:</label>
            <select
              id="activity-date-filter"
              v-model="activitiesDateRange"
              class="filter-select"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        <!-- Activities List -->
        <div class="all-activities-list">
          <div v-if="allActivities.length === 0" class="no-activities">
            <Moon :size="48" color="var(--baby-blue)" />
            <p>No activities found for the selected filters.</p>
          </div>

          <div v-else class="activities-grid">
            <div
              v-for="entry in allActivities"
              :key="entry.id"
              class="activity-card"
              :class="entry.type"
            >
              <div class="activity-card-header">
                <div class="activity-icon">
                  <Bed
                    v-if="entry.type === 'sleep' && entry.sleepType === 'night'"
                    :size="20"
                    :color="'var(--baby-purple)'"
                  />
                  <Moon
                    v-else-if="entry.type === 'sleep'"
                    :size="20"
                    :color="'var(--baby-blue)'"
                  />
                  <Sun v-else :size="20" color="var(--baby-orange)" />
                </div>

                <div class="activity-type">
                  {{ entry.type === "sleep" ? "Fell Asleep" : "Woke Up" }}
                  <span v-if="entry.napNumber" class="nap-number">
                    (Nap {{ entry.napNumber }})
                  </span>
                </div>

                <div class="activity-actions" v-if="entry.type === 'sleep'">
                  <button
                    class="action-btn edit-btn"
                    @click="handleEdit(entry)"
                    title="Edit"
                  >
                    <Edit :size="14" />
                  </button>
                  <button
                    class="action-btn delete-btn"
                    @click="handleDelete(entry.id)"
                    title="Delete"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>

              <div class="activity-details">
                <div class="activity-datetime">
                  <div class="activity-date">{{ entry.dateFormatted }}</div>
                  <div class="activity-time">
                    {{ entry.timeFormatted }}
                    <span v-if="entry.durationFormatted" class="duration">
                      • {{ entry.durationFormatted }}
                    </span>
                  </div>
                </div>

                <div v-if="entry.notes" class="activity-notes">
                  <Info :size="12" />
                  {{ entry.notes }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
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
  padding: 1rem;
}

.modal {
  background: var(--soft-white);
  border-radius: 20px;
  max-width: 90vw;
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid var(--baby-pink);
}

.modal-header h3 {
  color: var(--text-dark);
  margin: 0;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-light);
  padding: 0.25rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--text-dark);
}

.modal-content {
  padding: 1.5rem;
}

.activity-filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--baby-mint);
  border-radius: 15px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: var(--text-dark);
  font-size: 0.9rem;
}

.filter-select {
  padding: 0.5rem;
  border: 2px solid var(--baby-pink);
  border-radius: 10px;
  background: white;
  color: var(--text-dark);
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.filter-select:focus {
  outline: none;
  border-color: var(--baby-blue);
}

.all-activities-list {
  max-height: 50vh;
  overflow-y: auto;
}

.all-activities-list::-webkit-scrollbar {
  width: 8px;
}

.all-activities-list::-webkit-scrollbar-track {
  background: var(--baby-mint);
  border-radius: 4px;
}

.all-activities-list::-webkit-scrollbar-thumb {
  background: var(--baby-blue);
  border-radius: 4px;
}

.no-activities {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-light);
}

.no-activities p {
  margin: 1rem 0 0 0;
  font-size: 1.1rem;
}

.activities-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-card {
  background: var(--soft-white);
  border-radius: 15px;
  padding: 1rem;
  border: 2px solid var(--baby-pink);
  transition: all 0.2s ease;
}

.activity-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.activity-card.sleep {
  border-color: var(--baby-lavender);
  background: linear-gradient(
    135deg,
    rgba(196, 181, 253, 0.1),
    var(--soft-white)
  );
}

.activity-card.wake {
  border-color: var(--baby-orange);
  background: linear-gradient(
    135deg,
    rgba(255, 183, 77, 0.1),
    var(--soft-white)
  );
}

.activity-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.activity-icon {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.activity-type {
  font-weight: 600;
  color: var(--text-dark);
  flex: 1;
}

.activity-actions {
  display: flex;
  gap: 0.5rem;
}

.activity-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.activity-datetime {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-date {
  font-weight: 600;
  color: var(--text-dark);
  font-size: 0.9rem;
}

.activity-time {
  color: var(--text-light);
  font-size: 0.9rem;
}

.activity-notes {
  color: var(--text-light);
  font-size: 0.8rem;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.duration {
  color: var(--baby-blue);
  font-weight: 600;
}

.nap-number {
  color: var(--text-light);
  font-weight: 500;
  font-size: 0.9rem;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
  color: var(--text-light);
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.edit-btn:hover {
  color: var(--baby-blue);
}

.delete-btn:hover {
  color: var(--baby-coral);
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .modal {
    width: 95vw;
    max-height: 85vh;
  }

  .activity-filters {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .activity-card-header {
    flex-wrap: wrap;
  }

  .activity-datetime {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
