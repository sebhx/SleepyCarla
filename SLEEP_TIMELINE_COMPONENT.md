# Sleep Timeline Component

## Overview

The `SleepTimeline` component replaces the previous `SleepEntriesList` component with a modern, vertical timeline interface that better visualizes the relationship between sleep sessions and wake-up events.

## Features

### Visual Timeline

- **Vertical timeline layout** optimized for mobile (iPhone)
- **Connected sleep-wake pairs** with visual connectors
- **Chronological order** with most recent events at the top
- **Modern baby-themed design** with soft colors and playful elements

### Event Types

- **Sleep Start Events**: Moon icon (naps) or Bed icon (night sleep)
- **Wake Up Events**: Sun icon with connection to the sleep session
- **Ongoing Sleep**: Pulse animation and "Ongoing..." indicator

### Interactive Features

- **Edit sleep sessions**: Click edit button on sleep start events
- **Delete sleep sessions**: Click delete button (cascades to wake events)
- **Responsive design**: Adapts to mobile and desktop layouts
- **Loading states**: Disabled buttons during API calls

## Data Structure

The component consumes sleep sessions with optional wake events:

```typescript
interface SleepSession {
  id: string;
  sleepType: "nap" | "night";
  startTime: Date;
  endTime?: Date;
  duration?: number;
  napNumber?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  wakeEvent?: WakeEvent; // Auto-populated from API
}

interface WakeEvent {
  id: string;
  sleepSessionId: string;
  wakeTime: Date;
  createdAt: Date;
}
```

## Visual Design

### Connected Sleep-Wake Pairs

- Sleep sessions with wake events are visually connected
- Dashed line connector between sleep start and wake up
- Grouped in a card with light background
- Duration badge shown on wake-up event

### Standalone Events

- Ongoing sleep sessions shown without wake events
- Future wake events will be added when sleep ends
- Pulse animation for active sleep sessions

### Color Scheme

- **Naps**: Baby blue (`--baby-blue`)
- **Night sleep**: Baby purple (`--baby-purple`)
- **Wake ups**: Baby yellow (`--baby-yellow`)
- **Ongoing**: Baby orange (`--baby-orange`)

## Mobile Optimization

- **Touch-friendly** action buttons
- **Vertical stacking** on narrow screens
- **Readable time stamps** with monospace font
- **Optimized spacing** for thumb navigation

## Empty State

When no sleep sessions exist for the day:

- Moon icon with message
- Encourages first entry
- Maintains visual consistency

## API Integration

The component automatically fetches wake events through the enhanced API:

- `GET /api/sleep-sessions?includeWake=true`
- Wake events are joined with sleep sessions
- Cascading deletes handled server-side

## Usage

```vue
<SleepTimeline
  :entries="sleepSessions"
  :is-loading="isLoading"
  @edit-entry="handleEditEntry"
  @delete-entry="handleDeleteEntry"
/>
```

## Benefits Over Previous Component

1. **Better UX**: Timeline shows the natural flow of sleep patterns
2. **Visual Relationships**: Clear connection between sleep and wake events
3. **Information Hierarchy**: More important information is more prominent
4. **Modern Design**: Baby-themed with smooth animations
5. **Mobile-First**: Optimized for primary use case (iPhone)
6. **Accessibility**: Clear visual indicators and semantic structure

## Testing

Comprehensive test suite covers:

- Component rendering
- Event emission
- Empty states
- Timeline event creation
- Visual indicators
- User interactions

Run tests with: `npm run test:run tests/unit/SleepTimeline.test.ts`
