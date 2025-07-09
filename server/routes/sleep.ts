import express from 'express';
import { runQuery, getQuery, allQuery } from '../database.js';
import crypto from 'crypto';

const router = express.Router();

// Interface for sleep entry (matching frontend)
interface SleepEntry {
  id: string;
  type: 'sleep' | 'wake';
  timestamp: string;
  duration?: number;
  napNumber?: number;
  notes?: string;
}

// GET /api/sleep - Get all sleep entries
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    
    let sql = `
      SELECT 
        id,
        type,
        timestamp,
        duration,
        nap_number as napNumber,
        notes
      FROM sleep_entries
    `;
    
    const params: any[] = [];
    
    if (date) {
      sql += ' WHERE date(timestamp) = ?';
      params.push(date);
    }
    
    sql += ' ORDER BY timestamp ASC';
    
    const entries = await allQuery(sql, params);
    
    // Convert timestamp strings back to Date objects for frontend
    const formattedEntries = entries.map(entry => ({
      ...entry,
      timestamp: new Date(entry.timestamp)
    }));
    
    res.json(formattedEntries);
  } catch (error) {
    console.error('Error fetching sleep entries:', error);
    res.status(500).json({ error: 'Failed to fetch sleep entries' });
  }
});

// GET /api/sleep/today - Get today's sleep entries
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const sql = `
      SELECT 
        id,
        type,
        timestamp,
        duration,
        nap_number as napNumber,
        notes
      FROM sleep_entries
      WHERE date(timestamp) = ?
      ORDER BY timestamp ASC
    `;
    
    const entries = await allQuery(sql, [today]);
    
    const formattedEntries = entries.map(entry => ({
      ...entry,
      timestamp: new Date(entry.timestamp)
    }));
    
    res.json(formattedEntries);
  } catch (error) {
    console.error('Error fetching today\'s sleep entries:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s sleep entries' });
  }
});

// POST /api/sleep - Create new sleep entry
router.post('/', async (req, res) => {
  try {
    const { type, timestamp, duration, napNumber, notes } = req.body;
    
    // Validate required fields
    if (!type || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields: type, timestamp' });
    }
    
    if (!['sleep', 'wake'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "sleep" or "wake"' });
    }

    // Generate UUID for the server
    const id = crypto.randomUUID();
    
    const sql = `
      INSERT INTO sleep_entries (id, type, timestamp, duration, nap_number, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await runQuery(sql, [id, type, timestamp, duration || null, napNumber || null, notes || null]);
    
    // Return the created entry
    const createdEntry = await getQuery(
      `SELECT id, type, timestamp, duration, nap_number as napNumber, notes FROM sleep_entries WHERE id = ?`,
      [id]
    );
    
    res.status(201).json(createdEntry);
  } catch (error) {
    console.error('Error creating sleep entry:', error);
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      res.status(409).json({ error: 'Entry with this ID already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create sleep entry' });
    }
  }
});

// GET /api/sleep/stats - Get sleep statistics (must be before /:id routes)
router.get('/stats', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT 
        COUNT(CASE WHEN type = 'sleep' AND nap_number IS NOT NULL THEN 1 END) as nap_count,
        AVG(CASE WHEN type = 'sleep' AND nap_number IS NOT NULL THEN duration END) as avg_nap_duration,
        SUM(CASE WHEN type = 'sleep' AND nap_number IS NOT NULL THEN duration END) as total_nap_time,
        SUM(CASE WHEN type = 'sleep' AND nap_number IS NULL THEN duration END) as night_sleep_duration
      FROM sleep_entries
      WHERE date(timestamp) = ? AND type = 'sleep' AND duration IS NOT NULL
    `;
    
    const stats = await getQuery(sql, [targetDate]);
    
    res.json({
      date: targetDate,
      napCount: stats.nap_count || 0,
      averageNapDuration: Math.round(stats.avg_nap_duration || 0),
      totalNapTime: stats.total_nap_time || 0,
      nightSleepDuration: stats.night_sleep_duration || 0,
      totalSleepTime: (stats.total_nap_time || 0) + (stats.night_sleep_duration || 0)
    });
  } catch (error) {
    console.error('Error fetching sleep stats:', error);
    res.status(500).json({ error: 'Failed to fetch sleep statistics' });
  }
});

// PUT /api/sleep/:id - Update sleep entry
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, timestamp, duration, napNumber, notes }: Partial<SleepEntry> = req.body;
    
    // Check if entry exists
    const existingEntry = await getQuery('SELECT id FROM sleep_entries WHERE id = ?', [id]);
    if (!existingEntry) {
      return res.status(404).json({ error: 'Sleep entry not found' });
    }
    
    const sql = `
      UPDATE sleep_entries 
      SET type = ?, timestamp = ?, duration = ?, nap_number = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await runQuery(sql, [type, timestamp, duration || null, napNumber || null, notes || null, id]);
    
    res.json({ message: 'Sleep entry updated successfully' });
  } catch (error) {
    console.error('Error updating sleep entry:', error);
    res.status(500).json({ error: 'Failed to update sleep entry' });
  }
});

// DELETE /api/sleep/:id - Delete sleep entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await runQuery('DELETE FROM sleep_entries WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Sleep entry not found' });
    }
    
    res.json({ message: 'Sleep entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting sleep entry:', error);
    res.status(500).json({ error: 'Failed to delete sleep entry' });
  }
});

export default router;
