const express = require('express');
const crypto = require('crypto');
const { runQuery, getQuery, allQuery } = require('../database.js');

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

module.exports = router;
