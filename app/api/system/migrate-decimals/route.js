
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        await query(`
            -- Alter columns to support decimals
            ALTER TABLE Productos ALTER COLUMN StockActual DECIMAL(10,3);
            ALTER TABLE Productos ALTER COLUMN StockMinimo DECIMAL(10,3);
            
            ALTER TABLE DetalleVenta ALTER COLUMN Cantidad DECIMAL(10,3);
            
            -- If MovimientosStock exists
            IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MovimientosStock]') AND type in (N'U'))
            BEGIN
                ALTER TABLE MovimientosStock ALTER COLUMN Cantidad DECIMAL(10,3);
            END
        `);

        return NextResponse.json({ message: 'Decimal Migration Applied' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
