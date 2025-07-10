import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SleepTimeline from '../../src/features/sleep-tracking/components/SleepTimeline.vue';
import type { SleepSession } from '../../src/types/sleep-refactored';

describe('SleepTimeline', () => {
  const mockSleepSessions: Array<SleepSession & { timeFormatted: string; durationFormatted?: string }> = [
    {
      id: '1',
      sleepType: 'nap',
      startTime: new Date('2024-01-15T14:00:00'),
      endTime: new Date('2024-01-15T15:30:00'),
      duration: 90,
      napNumber: 1,
      notes: 'Good nap',
      createdAt: new Date('2024-01-15T14:00:00'),
      updatedAt: new Date('2024-01-15T15:30:00'),
      timeFormatted: '14:00',
      durationFormatted: '1h 30m',
      wakeEvent: {
        id: 'wake1',
        sleepSessionId: '1',
        wakeTime: new Date('2024-01-15T15:30:00'),
        createdAt: new Date('2024-01-15T15:30:00')
      }
    },
    {
      id: '2',
      sleepType: 'night',
      startTime: new Date('2024-01-15T19:00:00'),
      endTime: undefined, // Ongoing sleep
      duration: undefined,
      napNumber: undefined,
      notes: 'Night sleep',
      createdAt: new Date('2024-01-15T19:00:00'),
      updatedAt: new Date('2024-01-15T19:00:00'),
      timeFormatted: '19:00',
      durationFormatted: undefined
    }
  ];

  it('renders correctly with sleep sessions', () => {
    const wrapper = mount(SleepTimeline, {
      props: {
        entries: mockSleepSessions,
        isLoading: false
      }
    });

    expect(wrapper.find('.sleep-timeline-card').exists()).toBe(true);
    expect(wrapper.find('.card-title').text()).toBe('Today\'s Sleep Timeline');
    expect(wrapper.find('.entries-count').text()).toBe('2 sessions');
  });

  it('renders empty state when no entries', () => {
    const wrapper = mount(SleepTimeline, {
      props: {
        entries: [],
        isLoading: false
      }
    });

    expect(wrapper.find('.no-entries').exists()).toBe(true);
    expect(wrapper.find('.no-entries p').text()).toBe('No sleep sessions for today');
  });

  it('shows sleep session cards', () => {
    const wrapper = mount(SleepTimeline, {
      props: {
        entries: mockSleepSessions,
        isLoading: false
      }
    });

    const sessionCards = wrapper.findAll('.sleep-session-card');
    
    // Should have cards for both sleep sessions
    expect(sessionCards.length).toBe(2);
    
    // Check that sessions container exists
    expect(wrapper.find('.sleep-sessions-container').exists()).toBe(true);
    
    // Check that cards have correct classes
    expect(wrapper.find('.night-card').exists()).toBe(true);
    expect(wrapper.find('.nap-card').exists()).toBe(true);
  });

  it('emits edit-entry event when edit button is clicked', async () => {
    const wrapper = mount(SleepTimeline, {
      props: {
        entries: mockSleepSessions,
        isLoading: false
      }
    });

    const editButton = wrapper.find('[title="Edit"]');
    await editButton.trigger('click');

    expect(wrapper.emitted('edit-entry')).toBeTruthy();
    expect(wrapper.emitted('edit-entry')?.[0][0]).toEqual(mockSleepSessions[1]); // Most recent first
  });

  it('emits delete-entry event when delete button is clicked', async () => {
    const wrapper = mount(SleepTimeline, {
      props: {
        entries: mockSleepSessions,
        isLoading: false
      }
    });

    const deleteButton = wrapper.find('[title="Delete"]');
    await deleteButton.trigger('click');

    expect(wrapper.emitted('delete-entry')).toBeTruthy();
    expect(wrapper.emitted('delete-entry')?.[0][0]).toBe(mockSleepSessions[1].id); // Most recent first
  });

  it('shows ongoing indicator for active sleep sessions', () => {
    const wrapper = mount(SleepTimeline, {
      props: {
        entries: mockSleepSessions,
        isLoading: false
      }
    });

    expect(wrapper.find('.ongoing-text').exists()).toBe(true);
    expect(wrapper.find('.ongoing-text').text()).toBe('In progress');
  });

  it('displays duration info for completed sessions', () => {
    const wrapper = mount(SleepTimeline, {
      props: {
        entries: mockSleepSessions,
        isLoading: false
      }
    });

    expect(wrapper.find('.duration-info').exists()).toBe(true);
    expect(wrapper.find('.duration-value').text()).toBe('1h 30m');
  });
});
