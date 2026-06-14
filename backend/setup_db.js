const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    // 1. Connect to default 'postgres' database to create the new one
    const defaultClient = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'postgres',
        port: process.env.DB_PORT,
    });

    try {
        await defaultClient.connect();
        console.log('Connected to default postgres database.');
        
        // Check if database exists
        const res = await defaultClient.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`);
        if (res.rowCount === 0) {
            console.log(`Creating database ${process.env.DB_NAME}...`);
            await defaultClient.query(`CREATE DATABASE ${process.env.DB_NAME}`);
            console.log('Database created successfully.');
        } else {
            console.log(`Database ${process.env.DB_NAME} already exists.`);
        }
    } catch (err) {
        console.error('Error connecting to postgres:', err.message);
        console.error('*** Make sure your DB_PASSWORD in .env is correct for your local postgres user! ***');
        process.exit(1);
    } finally {
        await defaultClient.end();
    }

    // 2. Connect to the newly created database and run schema
    const dbClient = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    });

    try {
        await dbClient.connect();
        console.log(`Connected to ${process.env.DB_NAME} database.`);
        
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Running schema.sql...');
        await dbClient.query(schemaSql);
        console.log('Schema applied successfully! You can now start the backend.');
    } catch (err) {
        console.error('Error running schema:', err.message);
        process.exit(1);
    } finally {
        await dbClient.end();
    }
}

setupDatabase();
