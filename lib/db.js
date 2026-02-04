import mysql from 'mysql2/promise';

const dbConfig = {
    // Check both DB_HOST (Vercel standard) and DB_SERVER (Legacy/Local)
    host: process.env.DB_HOST || process.env.DB_SERVER || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 4000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
        servername: 'gateway01.us-east-1.prod.aws.tidbcloud.com'
    }
};

console.log('Connecting to DB Host:', dbConfig.host);

const pool = mysql.createPool(dbConfig);

export async function query(command, params) {
    try {
        const [results] = await pool.query(command, params);
        return results;
    } catch (error) {
        console.error('Database query failed', error);
        throw error;
    }
}
