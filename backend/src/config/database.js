const { Pool } = require('pg');

require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

let poolConfig;

if (process.env.DATABASE_URL) {
    poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: isProduction
            ? {
                  rejectUnauthorized: false
              }
            : false
    };
} else {
    poolConfig = {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: false
    };
}

const pool = new Pool(poolConfig);

module.exports = pool;