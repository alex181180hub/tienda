
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        await query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Productos]') AND name = 'Unidad')
            BEGIN
                ALTER TABLE Productos ADD Unidad VARCHAR(20) DEFAULT 'u';
            END
        `);

        return NextResponse.json({ message: 'Units Column Added' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
