import express from 'express';
import crypto from 'crypto';
import { runQuery, getQuery, allQuery } from '../database-refactored.js';
import type { 
  CreateSleepSessionRequest, 
  EndSleepSessionRequest,
  UpdateSleepSessionRequest
} from '../../src/types/sleep-refactored.js';

const router = express.Router();

// GET /api/sleep-sessions - Get all sleep sessions with optional wake events
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/sleep-sessions - fetching sessions');
    
    const { includeWake = 'true', date } = req.query;
    
    let sql = `
      SELECT 
        ss.id,
        ss.sleep_type as "sleepType",
        ss.start_time as "startTime",
        ss.end_time as "endTime",
        ss.duration,
        ss.nap_number as "napNumber",
        ss.notes,
        ss.created_at as "createdAt",
        ss.updated_at as "updatedAt"
      FROM sleep_sessions ss
    `;
    
    const params: any[] = [];
    
    if (date) {
      sql += ' WHERE DATE(ss.start_time) = $1';
      params.push(date);
    }
    
    sql += ' ORDER BY ss.start_time ASC';
    
    const sessions = await allQuery(sql, params);
    
    // If including wake events, fetch them separately and join
    if (includeWake === 'true') {
      const sessionIds = sessions.map(s => s.id);
      if (sessionIds.length > 0) {
        const wakeEventsSql = `
          SELECT 
            id,
            sleep_session_id as "sleepSessionId",
            wake_time as "wakeTime",
            created_at as "createdAt"
          FROM wake_events 
          WHERE sleep_session_id = ANY($1)
        `;
        
        const wakeEvents = await allQuery(wakeEventsSql, [sessionIds]);
        
        // Attach wake events to their corresponding sessions
        const wakeEventMap = new Map();
        wakeEvents.forEach(we => {
          wakeEventMap.set(we.sleepSessionId, we);
        });
        
        sessions.forEach(session => {
          const wakeEvent = wakeEventMap.get(session.id);
          if (wakeEvent) {
            session.wakeEvent = wakeEvent;
          }
        });
      }
    }
    
    console.log(`Found ${sessions.length} sleep sessions`);
    res.json(sessions);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch sleep sessions' });
  }
});

// GET /api/sleep-sessions/activities - Get unified activity feed (backward compatibility)
router.get('/activities', async (req, res) => {
  try {
    console.log('GET /api/sleep-sessions/activities - fetching unified feed');
    
    const { date } = req.query;
    
    let sql = `
      SELECT 
        id,
        type,
        timestamp,
        duration,
        nap_number as "napNumber",
        sleep_type as "sleepType",
        notes
      FROM sleep_entries_view
    `;
    
    const params: any[] = [];
    
    if (date) {
      sql += ' WHERE DATE(timestamp) = $1';
      params.push(date);
    }
    
    sql += ' ORDER BY timestamp ASC';
    
    const activities = await allQuery(sql, params);
    
    console.log(`Found ${activities.length} activities`);
    res.json(activities);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// POST /api/sleep-sessions - Start a new sleep session
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/sleep-sessions - creating session:', req.body);
    const { sleepType, startTime, napNumber, notes }: CreateSleepSessionRequest = req.body;
    
    // Validate required fields
    if (!sleepType) {
      return res.status(400).json({ error: 'Missing required field: sleepType' });
    }
    
    if (!['nap', 'night'].includes(sleepType)) {
      return res.status(400).json({ error: 'sleepType must be either "nap" or "night"' });
    }

    // Use provided startTime or current time
    const sessionStartTime = startTime || new Date().toISOString();

    // Generate UUID for the session
    const id = crypto.randomUUID();
    
    const sql = `
      INSERT INTO sleep_sessions (id, sleep_type, start_time, nap_number, notes)
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    const params = [id, sleepType, sessionStartTime, napNumber || null, notes || null];
    console.log('🗃️ SQL:', sql);
    console.log('📋 Params:', params);
    
    await runQuery(sql, params);
    
    // Return the created session
    const createdSession = await getQuery(
      `SELECT 
        id,
        sleep_type as "sleepType",
        start_time as "startTime",
        end_time as "endTime",
        duration,
        nap_number as "napNumber",
        notes,
        created_at as "createdAt",
        updated_at as "updatedAt"
       FROM sleep_sessions WHERE id = $1`,
      [id]
    );
    
    console.log('Created session:', createdSession);
    res.status(201).json(createdSession);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to create sleep session' });
  }
});

// PUT /api/sleep-sessions/:id/end - End a sleep session and create wake event
router.put('/:id/end', async (req, res) => {
  try {
    console.log('PUT /api/sleep-sessions/:id/end - ending session:', req.params.id, req.body);
    const { id } = req.params;
    const { endTime }: EndSleepSessionRequest = req.body;
    
    // Use provided endTime or current time
    const sessionEndTime = endTime || new Date().toISOString();
    
    // Get the existing session
    const existingSession = await getQuery(
      'SELECT id, start_time, end_time FROM sleep_sessions WHERE id = $1',
      [id]
    );
    
    if (!existingSession) {
      return res.status(404).json({ error: 'Sleep session not found' });
    }
    
    if (existingSession.end_time) {
      return res.status(400).json({ error: 'Sleep session has already ended' });
    }
    
    // Calculate duration
    const startTime = new Date(existingSession.start_time);
    const endDateTime = new Date(sessionEndTime);
    const duration = Math.round((endDateTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    // Update the sleep session with end time and duration
    await runQuery(
      'UPDATE sleep_sessions SET end_time = $1, duration = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [sessionEndTime, duration, id]
    );
    
    // Create the wake event
    const wakeEventId = crypto.randomUUID();
    await runQuery(
      'INSERT INTO wake_events (id, sleep_session_id, wake_time) VALUES ($1, $2, $3)',
      [wakeEventId, id, sessionEndTime]
    );
    
    // Return the updated session with wake event
    const updatedSession = await getQuery(
      `SELECT 
        ss.id,
        ss.sleep_type as "sleepType",
        ss.start_time as "startTime",
        ss.end_time as "endTime",
        ss.duration,
        ss.nap_number as "napNumber",
        ss.notes,
        ss.created_at as "createdAt",
        ss.updated_at as "updatedAt",
        we.id as "wakeEventId",
        we.wake_time as "wakeTime"
       FROM sleep_sessions ss
       LEFT JOIN wake_events we ON ss.id = we.sleep_session_id
       WHERE ss.id = $1`,
      [id]
    );
    
    console.log('Updated session with wake event:', updatedSession);
    res.json(updatedSession);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to end sleep session' });
  }
});

// PUT /api/sleep-sessions/:id - Update a sleep session
router.put('/:id', async (req, res) => {
  try {
    console.log('PUT /api/sleep-sessions/:id - updating session:', req.params.id, req.body);
    const { id } = req.params;
    const { sleepType, startTime, endTime, napNumber, notes }: UpdateSleepSessionRequest = req.body;
    
    // Check if session exists
    const existingSession = await getQuery(
      'SELECT id, end_time FROM sleep_sessions WHERE id = $1',
      [id]
    );
    
    if (!existingSession) {
      return res.status(404).json({ error: 'Sleep session not found' });
    }
    
    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;
    
    if (sleepType !== undefined) {
      updates.push(`sleep_type = $${paramCount}`);
      params.push(sleepType);
      paramCount++;
    }
    
    if (startTime !== undefined) {
      updates.push(`start_time = $${paramCount}`);
      params.push(startTime);
      paramCount++;
    }
    
    if (endTime !== undefined) {
      updates.push(`end_time = $${paramCount}`);
      params.push(endTime);
      paramCount++;
      
      // Recalculate duration if we have both start and end times
      if (startTime !== undefined || existingSession.start_time) {
        const start = new Date(startTime || existingSession.start_time);
        const end = new Date(endTime);
        const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
        
        updates.push(`duration = $${paramCount}`);
        params.push(duration);
        paramCount++;
      }
    }
    
    if (napNumber !== undefined) {
      updates.push(`nap_number = $${paramCount}`);
      params.push(napNumber);
      paramCount++;
    }
    
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount}`);
      params.push(notes);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);
    
    const sql = `UPDATE sleep_sessions SET ${updates.join(', ')} WHERE id = $${paramCount}`;
    
    await runQuery(sql, params);
    
    // Return updated session
    const updatedSession = await getQuery(
      `SELECT 
        id,
        sleep_type as "sleepType",
        start_time as "startTime",
        end_time as "endTime",
        duration,
        nap_number as "napNumber",
        notes,
        created_at as "createdAt",
        updated_at as "updatedAt"
       FROM sleep_sessions WHERE id = $1`,
      [id]
    );
    
    console.log('Updated session:', updatedSession);
    res.json(updatedSession);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to update sleep session' });
  }
});

// DELETE /api/sleep-sessions/:id - Delete a sleep session (and cascade delete wake event)
router.delete('/:id', async (req, res) => {
  try {
    console.log('DELETE /api/sleep-sessions/:id - deleting session:', req.params.id);
    const { id } = req.params;
    
    // Check if session exists
    const existingSession = await getQuery(
      'SELECT id FROM sleep_sessions WHERE id = $1',
      [id]
    );
    
    if (!existingSession) {
      return res.status(404).json({ error: 'Sleep session not found' });
    }
    
    // Delete the session (wake events will be cascade deleted automatically)
    const result = await runQuery('DELETE FROM sleep_sessions WHERE id = $1', [id]);
    
    console.log('Deleted session, affected rows:', result.changes);
    res.status(204).send(); // No content response for successful deletion
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to delete sleep session' });
  }
});

// GET /api/sleep-sessions/stats - Get sleep statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('GET /api/sleep-sessions/stats - fetching statistics');
    
    // Get basic stats
    const totalSessionsResult = await getQuery(
      'SELECT COUNT(*) as total FROM sleep_sessions'
    );
    
    const napSessionsResult = await getQuery(
      'SELECT COUNT(*) as count FROM sleep_sessions WHERE sleep_type = $1',
      ['nap']
    );
    
    const nightSessionsResult = await getQuery(
      'SELECT COUNT(*) as count FROM sleep_sessions WHERE sleep_type = $1',
      ['night']
    );
    
    const wakeEventsResult = await getQuery(
      'SELECT COUNT(*) as count FROM wake_events'
    );
    
    // Get average sleep duration for completed sessions
    const avgDurationResult = await getQuery(`
      SELECT AVG(duration) as avg_duration 
      FROM sleep_sessions 
      WHERE duration IS NOT NULL AND duration > 0
    `);
    
    // Get recent sleep data for last 7 days
    const recentSleepResult = await allQuery(`
      SELECT 
        DATE(start_time) as date,
        COUNT(*) as sessions,
        AVG(CASE WHEN duration IS NOT NULL THEN duration END) as avg_duration,
        SUM(CASE WHEN duration IS NOT NULL THEN duration ELSE 0 END) as total_duration
      FROM sleep_sessions 
      WHERE start_time >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(start_time)
      ORDER BY date DESC
    `);

    const stats = {
      totalSessions: parseInt(totalSessionsResult?.total || '0'),
      napSessions: parseInt(napSessionsResult?.count || '0'),
      nightSessions: parseInt(nightSessionsResult?.count || '0'),
      wakeEvents: parseInt(wakeEventsResult?.count || '0'),
      averageSleepDuration: Math.round(parseFloat(avgDurationResult?.avg_duration || '0')),
      recentSleep: recentSleepResult
    };
    
    console.log('Stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch sleep statistics' });
  }
});

// GET /api/sleep-sessions/:id - Get a specific sleep session
router.get('/:id', async (req, res) => {
  try {
    console.log('GET /api/sleep-sessions/:id - fetching session:', req.params.id);
    const { id } = req.params;
    
    const session = await getQuery(`
      SELECT 
        ss.id,
        ss.sleep_type as "sleepType",
        ss.start_time as "startTime",
        ss.end_time as "endTime",
        ss.duration,
        ss.nap_number as "napNumber",
        ss.notes,
        ss.created_at as "createdAt",
        ss.updated_at as "updatedAt"
      FROM sleep_sessions ss
      WHERE ss.id = $1
    `, [id]);
    
    if (!session) {
      return res.status(404).json({ error: 'Sleep session not found' });
    }
    
    // Check if there's a wake event for this session
    const wakeEvent = await getQuery(`
      SELECT 
        id,
        wake_time as "wakeTime",
        created_at as "createdAt"
      FROM wake_events 
      WHERE sleep_session_id = $1
    `, [id]);
    
    if (wakeEvent) {
      session.wakeEvent = wakeEvent;
    }
    
    console.log('Found session:', session);
    res.json(session);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch sleep session' });
  }
});

export default router;
