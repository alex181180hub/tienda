import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

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
    }
};

async function migrate() {
    console.log('Connecting to DB...');
    const connection = await mysql.createConnection(dbConfig);

    try {
        console.log('Adding columns to Ventas table...');

        // Add ClienteNombre
        try {
            await connection.query("ALTER TABLE Ventas ADD COLUMN ClienteNombre VARCHAR(100) DEFAULT 'Sin Nombre'");
            console.log('Added ClienteNombre');
        } catch (e) {
            if (!e.message.includes('Duplicate column')) console.error(e.message);
        }

        // Add ClienteNit
        try {
            await connection.query("ALTER TABLE Ventas ADD COLUMN ClienteNit VARCHAR(20) DEFAULT '0'");
            console.log('Added ClienteNit');
        } catch (e) {
            if (!e.message.includes('Duplicate column')) console.error(e.message);
        }

        console.log('Migration complete.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
