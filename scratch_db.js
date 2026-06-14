const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

pool.query('SELECT 1', (err) => {
    if (err) console.log("DB connection error:", err.message);
    else console.log("DB connection SUCCESS");
    process.exit(0);
});
