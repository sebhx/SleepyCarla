import express from 'express';
import { runQuery, getQuery } from '../database-refactored.js';
import type { UpdateUserSettingsRequest } from '../../src/types/sleep-refactored.js';

const router = express.Router();

// GET /api/user-settings - Get user settings
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/user-settings - fetching settings');
    
    const sql = `
      SELECT 
        id,
        baby_age_range as "babyAgeRange",
        baby_exact_age_weeks as "babyExactAgeWeeks",
        bedtime,
        morning_wake as "morningWake",
        enable_nap_suggestions as "enableNapSuggestions",
        notifications_enabled as "notificationsEnabled",
        theme,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM user_settings 
      WHERE id = 'default'
    `;
    
    const settings = await getQuery(sql);
    
    if (!settings) {
      // If no settings found, return default settings
      const defaultSettings = {
        id: 'default',
        babyAgeRange: 'older-infant',
        babyExactAgeWeeks: null,
        bedtime: '19:00',
        morningWake: '07:00',
        enableNapSuggestions: true,
        notificationsEnabled: false,
        theme: 'light',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('No settings found, returning defaults');
      return res.json(defaultSettings);
    }
    
    console.log('Found user settings:', settings);
    res.json(settings);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
});

// PUT /api/user-settings - Update user settings
router.put('/', async (req, res) => {
  try {
    console.log('PUT /api/user-settings - updating settings:', req.body);
    const { 
      babyAgeRange, 
      babyExactAgeWeeks, 
      bedtime, 
      morningWake, 
      enableNapSuggestions, 
      notificationsEnabled, 
      theme 
    }: UpdateUserSettingsRequest = req.body;
    
    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;
    
    if (babyAgeRange !== undefined) {
      updates.push(`baby_age_range = $${paramCount}`);
      params.push(babyAgeRange);
      paramCount++;
    }
    
    if (babyExactAgeWeeks !== undefined) {
      updates.push(`baby_exact_age_weeks = $${paramCount}`);
      params.push(babyExactAgeWeeks);
      paramCount++;
    }
    
    if (bedtime !== undefined) {
      updates.push(`bedtime = $${paramCount}`);
      params.push(bedtime);
      paramCount++;
    }
    
    if (morningWake !== undefined) {
      updates.push(`morning_wake = $${paramCount}`);
      params.push(morningWake);
      paramCount++;
    }
    
    if (enableNapSuggestions !== undefined) {
      updates.push(`enable_nap_suggestions = $${paramCount}`);
      params.push(enableNapSuggestions);
      paramCount++;
    }
    
    if (notificationsEnabled !== undefined) {
      updates.push(`notifications_enabled = $${paramCount}`);
      params.push(notificationsEnabled);
      paramCount++;
    }
    
    if (theme !== undefined) {
      updates.push(`theme = $${paramCount}`);
      params.push(theme);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    const sql = `
      UPDATE user_settings 
      SET ${updates.join(', ')}
      WHERE id = 'default'
    `;
    
    console.log('🗃️ SQL:', sql);
    console.log('📋 Params:', params);
    
    await runQuery(sql, params);
    
    // Return updated settings
    const updatedSettings = await getQuery(`
      SELECT 
        id,
        baby_age_range as "babyAgeRange",
        baby_exact_age_weeks as "babyExactAgeWeeks",
        bedtime,
        morning_wake as "morningWake",
        enable_nap_suggestions as "enableNapSuggestions",
        notifications_enabled as "notificationsEnabled",
        theme,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM user_settings 
      WHERE id = 'default'
    `);
    
    console.log('Updated settings:', updatedSettings);
    res.json(updatedSettings);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

// POST /api/user-settings/reset - Reset settings to defaults
router.post('/reset', async (req, res) => {
  try {
    console.log('POST /api/user-settings/reset - resetting to defaults');
    
    const sql = `
      INSERT INTO user_settings (
        id, baby_age_range, baby_exact_age_weeks, bedtime, morning_wake, 
        enable_nap_suggestions, notifications_enabled, theme, updated_at
      ) VALUES (
        'default', 'older-infant', NULL, '19:00', '07:00', true, false, 'light', CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET 
        baby_age_range = 'older-infant',
        baby_exact_age_weeks = NULL,
        bedtime = '19:00',
        morning_wake = '07:00',
        enable_nap_suggestions = true,
        notifications_enabled = false,
        theme = 'light',
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await runQuery(sql);
    
    // Return the reset settings
    const resetSettings = await getQuery(`
      SELECT 
        id,
        baby_age_range as "babyAgeRange",
        baby_exact_age_weeks as "babyExactAgeWeeks",
        bedtime,
        morning_wake as "morningWake",
        enable_nap_suggestions as "enableNapSuggestions",
        notifications_enabled as "notificationsEnabled",
        theme,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM user_settings 
      WHERE id = 'default'
    `);
    
    console.log('Reset settings:', resetSettings);
    res.json(resetSettings);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to reset user settings' });
  }
});

export default router;
