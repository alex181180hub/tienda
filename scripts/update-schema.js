import { query } from '../lib/db.js';

async function updateSchema() {
    try {
        console.log('Checking Schema...');

        // Check if 'Estado' column exists in Ventas
        const checkColumn = `
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Ventas' AND COLUMN_NAME = 'Estado'
        `;
        const result = await query(checkColumn);

        if (result.length === 0) {
            console.log('Adding Estado column to Ventas...');
            await query("ALTER TABLE Ventas ADD Estado VARCHAR(20) DEFAULT 'COMPLETADA'");
            await query("UPDATE Ventas SET Estado = 'COMPLETADA' WHERE Estado IS NULL");
            console.log('Column added successfully.');
        } else {
            console.log('Column Estado already exists.');
        }

    } catch (err) {
        console.error('Error updating schema:', err);
    }
}

updateSchema();
