const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/review_site';

const client = new Client({
  connectionString,
});

module.exports = client; 