# Unified Sleep Timeline Card Design

## Overview

The SleepTimeline component has been redesigned to use a unified card approach, where each sleep session is represented by a single, premium-looking card that contains both the sleep start and wake-up information.

## Key Design Changes

### 1. Single Card Per Session

- **Before**: Separate cards for sleep start and wake events connected by visual connectors
- **After**: One unified card per sleep session showing both start and end times

### 2. Visual Hierarchy

- **Card Header**: Large sleep icon (64px) + session info + action buttons
- **Sleep Times**: Start time → Wake time (or "In progress" for ongoing)
- **Meta Information**: Duration and active status in a dedicated section
- **Notes**: Styled notes section when present

### 3. Premium Styling Features

- **Gradient Top Border**: Different colors for nap vs night sleep
- **Enhanced Shadows**: Subtle shadows with hover effects
- **Monospace Fonts**: Time display uses SF Mono for precision
- **Smooth Animations**: Hover effects and pulse animations for active sessions
- **Mobile Responsive**: Adaptive layout for smaller screens

## Component Structure

### Template

```vue
<template>
  <div class="sleep-timeline-card card">
    <div class="card-header">
      <h3 class="card-title">Today's Sleep Timeline</h3>
      <span class="entries-count">{{ entries.length }} sessions</span>
    </div>

    <div class="sleep-sessions-container">
      <div class="sleep-session-card" v-for="card in sleepSessionCards">
        <!-- Card Header with Icon, Info, and Actions -->
        <div class="card-header-section">
          <div class="sleep-icon"><!-- Icon --></div>
          <div class="sleep-info">
            <h3 class="sleep-title"><!-- Session Type --></h3>
            <div class="sleep-times"><!-- Start → Wake Times --></div>
          </div>
          <div class="card-actions"><!-- Edit/Delete Buttons --></div>
        </div>

        <!-- Duration and Status -->
        <div class="card-meta">
          <div class="duration-info"><!-- Duration --></div>
          <div class="ongoing-status"><!-- Active Status --></div>
        </div>

        <!-- Notes -->
        <div class="card-notes"><!-- Session Notes --></div>
      </div>
    </div>
  </div>
</template>
```

### Computed Properties

- `sleepSessionCards`: Maps sleep sessions to card data objects
- Each card contains: id, session, timing info, status flags, and display data

## Color Scheme & Theming

### Sleep Type Colors

- **Nap**: Baby blue gradient (`var(--baby-blue)` to `#5fb3d4`)
- **Night**: Baby purple gradient (`var(--baby-purple)` to `#b47bb8`)
- **Ongoing**: Baby coral gradient (`var(--baby-coral)` to `#ff6b6b`)

### Visual Elements

- **Icons**: 64px circular icons with gradients
- **Action Buttons**: 48px circular buttons with hover effects
- **Time Display**: Monospace font for precise time alignment
- **Animations**: Pulse effects for active sessions

## Responsive Design

### Mobile (≤768px)

- Cards stack vertically with reduced padding
- Header section becomes vertical layout
- Smaller icons (56px) and buttons (44px)
- Times display in vertical list

### Desktop

- Full horizontal layout with larger elements
- Hover effects enabled
- Optimal spacing and typography

## Accessibility Features

- High contrast color combinations
- Clear visual hierarchy
- Keyboard navigation support
- Screen reader friendly structure
- Meaningful hover states

## Benefits of Unified Design

1. **Cleaner Visual Flow**: No confusing connectors or separate events
2. **Better Information Density**: All session data in one place
3. **Improved Mobile Experience**: Better touch targets and layout
4. **Premium Appearance**: Modern card design with subtle animations
5. **Easier Testing**: Single card structure simplifies component testing

## Files Modified

- `src/features/sleep-tracking/components/SleepTimeline.vue`
- `tests/unit/SleepTimeline.test.ts`
- Updated CSS classes and structure
- Maintained all existing functionality and props

This unified approach provides a much cleaner, more premium user experience while maintaining all the functionality of the original timeline design.
