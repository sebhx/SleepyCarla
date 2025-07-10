# Fresh Database Setup - Integration Guide

## What was implemented

### 1. Database Schema ✅

- **`sleep_sessions`** table - Proper sleep session storage
- **`wake_events`** table - Wake events linked to sleep sessions via foreign key
- **`user_settings`** table - Persistent user settings storage
- **Automatic cascade deletion** - Delete sleep session → wake event deleted automatically
- **Backward compatibility view** - `sleep_entries_view` for existing frontend code

### 2. API Endpoints ✅

- **Sleep Sessions API** (`/api/sleep-sessions`) - Full CRUD with proper relationships
- **User Settings API** (`/api/user-settings`) - Persistent settings management
- **Backward compatibility** (`/api/sleep-sessions/activities`) - Unified activity feed

### 3. Database Scripts ✅

- **Fresh setup script** - Clears old data and creates new schema
- **Migration script** - Supports both fresh and data migration modes
- **Clear database script** - Utility to reset data

## Quick Start

### 1. Set up fresh database

```bash
# Clear all data and set up new schema
npm run setup:fresh

# OR use the migration script with fresh flag
npm run migrate:fresh
```

### 2. Verify setup

The script will output:

```
✅ Sleep sessions table created
✅ Wake events table created
✅ User settings table created
✅ Default settings inserted
✅ Backward compatibility view created
```

### 3. Test new endpoints

#### User Settings

```bash
# Get current settings
GET /api/user-settings

# Update settings
PUT /api/user-settings
{
  "babyAgeRange": "toddler",
  "bedtime": "19:30",
  "enableNapSuggestions": true
}

# Reset to defaults
POST /api/user-settings/reset
```

#### Sleep Sessions

```bash
# Start a sleep session
POST /api/sleep-sessions
{
  "sleepType": "nap",
  "startTime": "2025-07-09T14:00:00Z",
  "napNumber": 1
}

# End a sleep session (creates wake event automatically)
PUT /api/sleep-sessions/{id}/end
{
  "endTime": "2025-07-09T15:30:00Z"
}

# Delete sleep session (wake event deleted automatically)
DELETE /api/sleep-sessions/{id}
```

## Frontend Integration Steps

### Phase 1: Update Settings (Immediate)

1. **Update settings composable** to use new API endpoints
2. **Test settings modal** with persistent storage
3. **Verify age range changes** update defaults correctly

### Phase 2: Update Sleep Tracking (Gradual)

1. **Start with new API** for creating sleep sessions
2. **Test cascade deletion** works properly
3. **Update UI components** to use new data structure
4. **Remove old API calls** when confirmed working

### Phase 3: Cleanup

1. **Remove backward compatibility code** when no longer needed
2. **Optimize performance** if needed

## Key Benefits Achieved

### ✅ Data Integrity

- **No more orphaned wake events** - Database enforces relationships
- **Automatic cascade deletion** - Delete sleep → wake deleted automatically
- **Proper foreign key constraints** - Cannot have invalid references

### ✅ Simplified Code

- **No manual time-based matching** to find related records
- **No complex cascade deletion logic** in application code
- **Database handles relationships** automatically

### ✅ Better User Experience

- **Persistent settings** - No more losing preferences on page refresh
- **Consistent data** - Cannot get into invalid states
- **Better performance** - Optimized queries with proper indexes

## Default Settings

The system starts with these defaults:

- **Age Range**: older-infant (6-9 months)
- **Bedtime**: 19:00 (7 PM)
- **Morning Wake**: 07:00 (7 AM)
- **Nap Suggestions**: Enabled
- **Notifications**: Disabled
- **Theme**: Light

These match the existing SettingsModal component defaults and can be changed through the UI or API.

## Next Steps

1. **Test the database setup** by running `npm run setup:fresh`
2. **Update server.ts** to include the new API routes
3. **Update frontend settings** to use persistent storage
4. **Gradually migrate sleep tracking** to new API
5. **Test cascade deletion** thoroughly

## Rollback Plan

If any issues occur:

1. **Stop using new APIs** and revert to old ones
2. **Restore old database** if needed
3. **The old backend routes** are still available for backward compatibility

## Questions or Issues?

- Check the console output for detailed error messages
- Verify PostgreSQL connection is working
- Test with simple API calls using curl or Postman first
- The backward compatibility view should work with existing frontend code
