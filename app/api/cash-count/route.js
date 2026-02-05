import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: Get expected system total for Today
export async function GET() {
    try {
        // Calculate total valid sales for today
        const sqlTotal = `
            SELECT 
                IFNULL(SUM(CASE WHEN MetodoPago = 'EFECTIVO' THEN Total ELSE 0 END), 0) as TotalEfectivo,
                IFNULL(SUM(CASE WHEN MetodoPago = 'QR' THEN Total ELSE 0 END), 0) as TotalQR,
                IFNULL(SUM(Total), 0) as TotalGeneral
            FROM Ventas
            WHERE DATE(Fecha) = CURDATE()
            AND (Estado != 'ANULADA' OR Estado IS NULL) 
        `;
        const resTotal = await query(sqlTotal);

        // Fetch details
        const sqlSales = `
            SELECT Id, DATE_FORMAT(Fecha, '%H:%i') as Hora, Total, MetodoPago
            FROM Ventas
            WHERE DATE(Fecha) = CURDATE()
            AND (Estado != 'ANULADA' OR Estado IS NULL)
            ORDER BY Fecha ASC
        `;
        const resSales = await query(sqlSales);

        // Fetch purchases
        const sqlPurchases = `
            SELECT Id, DATE_FORMAT(Fecha, '%H:%i') as Hora, Proveedor, Total
            FROM Compras
            WHERE DATE(Fecha) = CURDATE()
            ORDER BY Fecha ASC
        `;
        const resPurchases = await query(sqlPurchases);

        return NextResponse.json({
            expected: Number(resTotal[0]?.TotalEfectivo || 0),
            expectedQR: Number(resTotal[0]?.TotalQR || 0),
            sales: resSales,
            purchases: resPurchases
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Register Cash Count (Cierre)
export async function POST(request) {
    try {
        const body = await request.json();
        const { systemTotal, realTotal, notes } = body;

        const difference = parseFloat(realTotal) - parseFloat(systemTotal);

        await query(`
            INSERT INTO CierresCaja (TotalSistema, TotalReal, Diferencia, Notas)
            VALUES (?, ?, ?, ?)
        `, [systemTotal, realTotal, difference, notes || '']);

        return NextResponse.json({ message: 'Caja Cerrada Correctamente' });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
