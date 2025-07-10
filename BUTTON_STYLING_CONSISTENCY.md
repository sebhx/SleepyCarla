# Button Styling Consistency Update

## Summary

Updated the SleepTimeline component action buttons to use the consistent button classes used throughout the app.

## Changes Made

### Before (Custom Button Styles)

```vue
<button class="action-btn edit-btn">
  <Edit :size="20" />
</button>
<button class="action-btn delete-btn">
  <Trash2 :size="20" />
</button>
```

### After (Standard App Button Classes)

```vue
<button class="btn btn-sm btn-secondary">
  <Edit :size="16" />
</button>
<button class="btn btn-sm btn-danger">
  <Trash2 :size="16" />
</button>
```

## Button Classes Used

- `btn`: Base button class with consistent styling
- `btn-sm`: Small button size variant
- `btn-secondary`: Secondary button style (light background)
- `btn-danger`: Danger button style (coral background)

## Styling Features

- **Consistent with App**: Uses the same button classes as other components
- **Proper Spacing**: Standard gap and padding using CSS variables
- **Hover Effects**: Built-in hover animations and shadow effects
- **Disabled States**: Proper disabled styling handled by global CSS
- **Mobile Responsive**: Automatically responsive through global button styles

## Removed Custom Styles

- `.action-btn` - Custom circular button styles
- `.edit-btn` - Custom edit button colors
- `.delete-btn` - Custom delete button colors
- Custom hover effects and disabled states

## Benefits

1. **Visual Consistency**: Buttons now match the rest of the app
2. **Maintainability**: Uses centralized button styles
3. **Accessibility**: Consistent focus states and contrast
4. **Reduced CSS**: Less custom CSS to maintain
5. **Better UX**: Familiar button patterns for users

## Files Modified

- `src/features/sleep-tracking/components/SleepTimeline.vue`
- Removed ~50 lines of custom button CSS
- Updated button HTML to use standard classes
- Maintained all functionality and accessibility

The action buttons now follow the established design system and provide a consistent user experience across the application.
