# Timezone Fix Documentation

## Problem Identified

After migrating from SQLite to PostgreSQL, manual date entries were displaying with a 4-hour offset when the user was in UTC+2 timezone.

## Root Cause

1. **Database schema**: Used `TIMESTAMP WITHOUT TIME ZONE` columns
2. **Database server timezone**: `Europe/Berlin` (UTC+1/UTC+2 depending on DST)
3. **User timezone**: UTC+2 (likely Europe/Helsinki or similar)
4. **Double conversion**: PostgreSQL was interpreting UTC timestamps as local Berlin time

## Timeline of the Issue

1. User enters: "2025-07-10 00:00" (midnight local time)
2. Frontend converts to UTC: "2025-07-09T22:00:00.000Z" (UTC+2 → UTC)
3. PostgreSQL receives UTC string but stores it as `TIMESTAMP WITHOUT TIME ZONE`
4. Database server interprets this as Berlin local time (causing offset)
5. When querying back, additional timezone confusion occurred

## Solution Applied

### 1. Database Schema Update

Changed all timestamp columns from `TIMESTAMP` to `TIMESTAMPTZ` (timestamp with time zone):

```sql
-- Before
start_time TIMESTAMP NOT NULL,
end_time TIMESTAMP,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

-- After
start_time TIMESTAMPTZ NOT NULL,
end_time TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
```

### 2. Updated Files

- `server/database-refactored.ts` - Updated schema definitions
- `fix-timezone-schema.sql` - SQL migration script
- `fix-timezone.js` - Node.js script to apply migration
- `test-timezone.js` - Verification script

## Verification Results

After applying the fix:

```
User input (local): 2025-07-10T00:00
Frontend Date object: 2025-07-09T22:00:00.000Z
API payload (UTC): 2025-07-09T22:00:00.000Z
Database storage: Correctly stored with timezone info
API response: 2025-07-09T22:00:00.000Z
Frontend display: 2025-07-10, 00:00:00 ✅ CORRECT!
```

## Technical Details

- **TIMESTAMPTZ**: PostgreSQL's timezone-aware timestamp type
- **UTC Storage**: All timestamps stored in UTC internally
- **Automatic Conversion**: PostgreSQL handles timezone conversions based on client timezone
- **Best Practice**: Always use TIMESTAMPTZ for timestamps in PostgreSQL

## Migration Process

1. Backed up existing data (tables were dropped and recreated)
2. Updated schema to use TIMESTAMPTZ
3. Added proper indexes for performance
4. Tested timezone handling verification

## Files Modified

- `server/database-refactored.ts` - Schema definitions
- `fix-timezone-schema.sql` - Migration script
- `fix-timezone.js` - Migration executor
- `test-timezone.js` - Verification script

## Status: ✅ RESOLVED

The timezone offset issue has been resolved. All manual entries now display at the correct local time regardless of user timezone or database server timezone configuration.
