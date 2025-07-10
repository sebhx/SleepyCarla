# SleepyCarla Database Refactoring Plan

## Problem Statement

The current database design stores both sleep and wake entries in a single `sleep_entries` table with a `type` column. This creates several issues:

1. **No proper relationship**: Sleep and wake events are logically related but have no enforced relationship in the database
2. **Manual cascade deletion**: Current code manually searches for related wake entries using time-based matching, which is error-prone
3. **Data integrity issues**: If the manual deletion logic fails, orphaned wake entries remain in the database
4. **Complex queries**: Finding related entries requires complex time-window calculations
5. **Inconsistent data state**: Wake entries can exist without corresponding sleep entries

## Proposed Solution: Two-Table Design

### New Schema

#### 1. `sleep_sessions` table

Stores the main sleep sessions (both naps and night sleep):

```sql
CREATE TABLE sleep_sessions (
  id TEXT PRIMARY KEY,
  sleep_type TEXT NOT NULL CHECK (sleep_type IN ('nap', 'night')),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,  -- NULL if sleep is ongoing
  duration INTEGER,    -- in minutes, calculated when end_time is set
  nap_number INTEGER CHECK (nap_number BETWEEN 1 AND 3), -- For naps only
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. `wake_events` table

Stores wake events linked to sleep sessions:

```sql
CREATE TABLE wake_events (
  id TEXT PRIMARY KEY,
  sleep_session_id TEXT NOT NULL,
  wake_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sleep_session_id) REFERENCES sleep_sessions(id) ON DELETE CASCADE
);
```

#### 3. `user_settings` table

Stores user preferences and baby profile:

```sql
CREATE TABLE user_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  baby_age_range TEXT NOT NULL CHECK (baby_age_range IN ('newborn', 'infant', 'older-infant', 'toddler', 'young-toddler', 'toddler-plus')),
  baby_exact_age_weeks INTEGER,
  bedtime TIME NOT NULL DEFAULT '19:00',
  morning_wake TIME NOT NULL DEFAULT '07:00',
  enable_nap_suggestions BOOLEAN NOT NULL DEFAULT true,
  notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  theme TEXT NOT NULL CHECK (theme IN ('light', 'dark', 'auto')) DEFAULT 'light',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Benefits

1. **Proper relationships**: Foreign key constraint ensures data integrity
2. **Automatic cascade deletion**: Database handles deletion of related wake events
3. **Clearer data model**: Sleep sessions, wake events, and settings are separate concerns
4. **Better performance**: Optimized queries with proper indexes
5. **Data consistency**: Cannot have orphaned wake events
6. **Persistent settings**: User preferences are stored in database instead of local storage

## Migration Strategy

### Phase 1: Preparation

1. ✅ Create new database schema files
2. ✅ Create new TypeScript types
3. ✅ Create migration script
4. ✅ Create new API routes

### Phase 2: Fresh Database Setup (Updated Approach)

**Note: We're now doing a fresh setup instead of migrating existing data**

1. **Clear existing data**

   ```bash
   npm run setup:fresh
   ```

2. **Verify new schema setup**

   - Test all new tables are created
   - Verify default settings are inserted
   - Check indexes are in place

3. **Test new API endpoints**
   - Test sleep session CRUD operations
   - Test user settings CRUD operations
   - Verify cascade deletion works
   - Check backward compatibility view

### Phase 3: Frontend Updates

1. **Update API service layer**

   - Create new service methods for sleep sessions
   - Maintain backward compatibility during transition

2. **Update components gradually**

   - Start with backend API calls
   - Update UI components to use new data structure
   - Remove old API calls when confirmed working

3. **Update state management**
   - Modify composables to work with new structure
   - Update type definitions

### Phase 4: Cleanup

1. **Remove old API routes** (after frontend is fully migrated)
2. **Drop old table** (only after everything is working)
3. **Remove backward compatibility code**

## API Changes

### New Endpoints

#### Sleep Sessions

- `GET /api/sleep-sessions` - Get all sleep sessions (with optional wake events)
- `POST /api/sleep-sessions` - Start a new sleep session
- `PUT /api/sleep-sessions/:id` - Update a sleep session
- `PUT /api/sleep-sessions/:id/end` - End a sleep session (creates wake event)
- `DELETE /api/sleep-sessions/:id` - Delete sleep session (cascades to wake event)

#### User Settings

- `GET /api/user-settings` - Get user settings
- `PUT /api/user-settings` - Update user settings
- `POST /api/user-settings/reset` - Reset settings to defaults

#### Backward Compatibility

- `GET /api/sleep-sessions/activities` - Get unified activity feed (uses view)

### Migration Benefits

#### Before (Current Issues)

```typescript
// Manual cascade deletion - error prone
if (existingEntry.type === "sleep" && existingEntry.duration) {
  const expectedWakeTime = new Date(
    sleepStart.getTime() + existingEntry.duration * 60 * 1000
  );
  const wakeEntry = await findWakeEntryByTimeWindow(expectedWakeTime);
  if (wakeEntry) {
    await deleteWakeEntry(wakeEntry.id); // Manual deletion
  }
}
```

#### After (Automatic Cascade)

```typescript
// Database handles cascade deletion automatically
await runQuery("DELETE FROM sleep_sessions WHERE id = $1", [id]);
// Wake events are automatically deleted via ON DELETE CASCADE
```

## Rollback Plan

If issues occur during migration:

1. **Immediate rollback**:

   ```bash
   npm run migrate:rollback -- sleep_entries_backup_[timestamp]
   ```

2. **Manual recovery**:
   - Restore from backup table
   - Switch back to old API routes
   - Revert frontend changes

## Testing Strategy

### Database Layer

- ✅ Unit tests for cascade deletion
- ✅ Migration validation tests
- ✅ Data integrity tests

### API Layer

- Test all new endpoints
- Test backward compatibility
- Test error scenarios

### Frontend Layer

- Test sleep tracking workflow
- Test entry editing/deletion
- Test analytics and statistics

## Timeline

### Week 1: Backend Foundation

- [x] Database schema design
- [x] Migration script creation
- [x] New API routes implementation
- [ ] Backend testing

### Week 2: Migration & Testing

- [ ] Run migration on development database
- [ ] Comprehensive API testing
- [ ] Performance testing

### Week 3: Frontend Integration

- [ ] Update API service layer
- [ ] Update sleep tracking composables
- [ ] Update UI components

### Week 4: Testing & Deployment

- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Production deployment

## Risk Mitigation

1. **Data Loss Prevention**

   - Always backup before migration
   - Test migration on copy of production data
   - Validate data integrity after migration

2. **Performance Impact**

   - Monitor query performance
   - Optimize indexes if needed
   - Consider query caching

3. **Frontend Compatibility**
   - Maintain backward compatibility view
   - Gradual frontend migration
   - Rollback plan ready

## Files Created/Modified

### New Files

- `server/database-refactor.sql` - Migration SQL script
- `server/database-refactored.ts` - New database implementation
- `server/routes/sleep-sessions.ts` - New API routes
- `server/migration.ts` - Migration automation script
- `src/types/sleep-refactored.ts` - New TypeScript types

### Files to Modify

- `server/server.ts` - Add new routes
- `src/services/api.ts` - Add new API methods
- Frontend components - Gradual migration to new structure

## Conclusion

This refactoring addresses the fundamental data integrity issues in the current design by:

1. Establishing proper relationships between sleep sessions and wake events
2. Leveraging database features for automatic cascade operations
3. Simplifying the codebase by removing manual relationship management
4. Improving data consistency and reliability

The migration is designed to be safe, reversible, and minimally disruptive to the user experience.
