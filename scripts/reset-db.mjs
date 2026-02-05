import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const envPath = path.join(rootDir, '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const dbConfig = {
    host: (process.env.DB_HOST || process.env.DB_SERVER || '127.0.0.1').trim(),
    user: (process.env.DB_USER || '').trim(),
    password: (process.env.DB_PASSWORD || '').trim(),
    database: (process.env.DB_NAME || '').trim(),
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 4000,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    },
    multipleStatements: true
};

async function resetDb() {
    console.log('Connecting to TiDB...');
    console.log('Host:', dbConfig.host);
    console.log('Database:', dbConfig.database);

    const connection = await mysql.createConnection(dbConfig);

    try {
        const schemaPath = path.join(rootDir, 'database', 'schema_mysql.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema...');
        // Split by command or just run it if multipleStatements is on
        await connection.query(schemaSql);

        console.log('Database recreated successfully!');
    } catch (error) {
        console.error('Error resetting database:', error);
    } finally {
        await connection.end();
    }
}

resetDb();
