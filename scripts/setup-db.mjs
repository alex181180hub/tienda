import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log('Connecting to TiDB...');

    const config = {
        host: process.env.DB_SERVER,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 4000,
        ssl: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true
        },
        multipleStatements: true
    };

    if (!config.password || config.password === 'YOUR_PASSWORD_HERE') {
        console.error('Error: DB_PASSWORD is missing in .env.local');
        process.exit(1);
    }

    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected!');

        const schemaPath = path.join(__dirname, '../database/schema_mysql.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Applying schema...');
        // Split by semicolon vs using multipleStatements (safer for some drivers, but mysql2 supports it)
        // schema_mysql.sql uses ; separator.

        await connection.query(schemaSql);

        console.log('Schema applied successfully!');
        await connection.end();

    } catch (error) {
        console.error('Failed to setup database:', error);
        process.exit(1);
    }
}

main();
