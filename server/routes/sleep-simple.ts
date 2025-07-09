import express from 'express';
import { runQuery, getQuery, allQuery } from '../database.js';
import crypto from 'crypto';

const router = express.Router();

// GET /api/sleep - Get all sleep entries
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/sleep - fetching entries');
    const sql = `
      SELECT 
        id,
        type,
        timestamp,
        duration,
        nap_number as napNumber,
        notes
      FROM sleep_entries
      ORDER BY timestamp ASC
    `;
    
    const entries = await allQuery(sql, []);
    console.log(`Found ${entries.length} sleep entries`);
    res.json(entries);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch sleep entries' });
  }
});

// POST /api/sleep - Create new sleep entry
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/sleep - creating entry:', req.body);
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
    
    console.log('Created entry:', createdEntry);
    res.status(201).json(createdEntry);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to create sleep entry' });
  }
});

// PUT /api/sleep/:id - Update sleep entry
router.put('/:id', async (req, res) => {
  try {
    console.log('PUT /api/sleep/:id - updating entry:', req.params.id, req.body);
    const { id } = req.params;
    const { type, timestamp, duration, napNumber, notes } = req.body;
    
    // Check if entry exists
    const existingEntry = await getQuery(
      `SELECT id FROM sleep_entries WHERE id = ?`,
      [id]
    );
    
    if (!existingEntry) {
      return res.status(404).json({ error: 'Sleep entry not found' });
    }
    
    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];
    
    if (type !== undefined) { updates.push('type = ?'); params.push(type); }
    if (timestamp !== undefined) { updates.push('timestamp = ?'); params.push(timestamp); }
    if (duration !== undefined) { updates.push('duration = ?'); params.push(duration); }
    if (napNumber !== undefined) { updates.push('nap_number = ?'); params.push(napNumber); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    const sql = `UPDATE sleep_entries SET ${updates.join(', ')} WHERE id = ?`;
    
    await runQuery(sql, params);
    
    // Return updated entry
    const updatedEntry = await getQuery(
      `SELECT id, type, timestamp, duration, nap_number as napNumber, notes FROM sleep_entries WHERE id = ?`,
      [id]
    );
    
    console.log('Updated entry:', updatedEntry);
    res.json(updatedEntry);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to update sleep entry' });
  }
});

// DELETE /api/sleep/:id - Delete sleep entry
router.delete('/:id', async (req, res) => {
  try {
    console.log('DELETE /api/sleep/:id - deleting entry:', req.params.id);
    const { id } = req.params;
    
    // Check if entry exists
    const existingEntry = await getQuery(
      `SELECT id FROM sleep_entries WHERE id = ?`,
      [id]
    );
    
    if (!existingEntry) {
      return res.status(404).json({ error: 'Sleep entry not found' });
    }
    
    await runQuery(`DELETE FROM sleep_entries WHERE id = ?`, [id]);
    console.log('Deleted entry:', id);
    res.json({ message: 'Sleep entry deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to delete sleep entry' });
  }
});

export default router;
