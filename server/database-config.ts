// Database configuration based on environment
let database;

if (process.env.DATABASE_URL) {
  // Production: Use PostgreSQL
  const { runQuery, getQuery, allQuery } = await import('./database-pg.js');
  database = { runQuery, getQuery, allQuery };
  console.log('Using PostgreSQL database');
} else {
  // Development: Use SQLite
  const { runQuery, getQuery, allQuery } = await import('./database.js');
  database = { runQuery, getQuery, allQuery };
  console.log('Using SQLite database');
}

export const { runQuery, getQuery, allQuery } = database;
