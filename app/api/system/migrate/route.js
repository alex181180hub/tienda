import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        // Check Ventas.Estado
        const checkColumn = `
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Ventas' AND COLUMN_NAME = 'Estado'
        `;
        const result = await query(checkColumn);

        if (result.length === 0) {
            await query("ALTER TABLE Ventas ADD Estado VARCHAR(20) DEFAULT 'COMPLETADA'");
            // UPDATE existing using standard syntax works for both generally, but ensuring not null
            await query("UPDATE Ventas SET Estado = 'COMPLETADA' WHERE Estado IS NULL");
        }

        // Check CierresCaja
        const checkTable = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CierresCaja'`;
        const tableRes = await query(checkTable);

        if (tableRes.length === 0) {
            await query(`
                CREATE TABLE CierresCaja (
                    Id INT PRIMARY KEY AUTO_INCREMENT,
                    Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                    TotalSistema DECIMAL(10, 2) NOT NULL,
                    TotalReal DECIMAL(10, 2) NOT NULL,
                    Diferencia DECIMAL(10, 2) NOT NULL,
                    Notas VARCHAR(255)
                )
            `);
        }

        // Check Compras
        const checkCompras = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Compras'`;
        const comprasRes = await query(checkCompras);

        if (comprasRes.length === 0) {
            await query(`
                CREATE TABLE Compras (
                    Id INT PRIMARY KEY AUTO_INCREMENT,
                    Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                    Proveedor VARCHAR(100),
                    Total DECIMAL(10, 2) NOT NULL,
                    Notas VARCHAR(255)
                )
            `);

            await query(`
                CREATE TABLE DetalleCompra (
                    Id INT PRIMARY KEY AUTO_INCREMENT,
                    CompraId INT NOT NULL,
                    ProductoId INT NOT NULL,
                    Cantidad INT NOT NULL,
                    CostoUnitario DECIMAL(10, 2) NOT NULL,
                    Subtotal DECIMAL(10, 2) NOT NULL,
                    FOREIGN KEY (CompraId) REFERENCES Compras(Id),
                    FOREIGN KEY (ProductoId) REFERENCES Productos(Id)
                )
            `);
        }

        return NextResponse.json({ message: 'Migration checked/applied (MySQL).' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
