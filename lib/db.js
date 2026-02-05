import mysql from 'mysql2/promise';

const dbConfig = {
    // Check both DB_HOST and DB_SERVER, trimming to remove potential newlines from copy-paste or echo commands
    host: (process.env.DB_HOST || process.env.DB_SERVER || '127.0.0.1').trim(),
    user: (process.env.DB_USER || '').trim(),
    password: (process.env.DB_PASSWORD || '').trim(),
    database: (process.env.DB_NAME || '').trim(),
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 4000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
        // servername: 'gateway01.us-east-1.prod.aws.tidbcloud.com' 
    },
    decimalNumbers: true
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
