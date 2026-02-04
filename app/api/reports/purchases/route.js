import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const period = searchParams.get('period') || 'today';

        let dateCondition = "";

        if (startDate && endDate) {
            dateCondition = `DATE(c.Fecha) BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (period === 'today') {
            dateCondition = `DATE(c.Fecha) = CURDATE()`;
        } else if (period === 'week') {
            dateCondition = `c.Fecha >= DATE_SUB(NOW(), INTERVAL 1 WEEK)`;
        } else if (period === 'month') {
            dateCondition = `c.Fecha >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`;
        }

        // 1. Stats Generales
        const statsQuery = `
            SELECT 
                IFNULL(SUM(Total), 0) as TotalGastado,
                COUNT(*) as TotalCompras
            FROM Compras c
            WHERE ${dateCondition}
        `;
        const statsRes = await query(statsQuery);
        const stats = statsRes[0];

        // 2. Chart Data (Gasto por día)
        const chartQuery = `
            SELECT 
                DATE_FORMAT(c.Fecha, '%d/%m') as date,
                SUM(c.Total) as spend
            FROM Compras c
            WHERE ${dateCondition}
            GROUP BY DATE_FORMAT(c.Fecha, '%d/%m'), DATE(c.Fecha)
            ORDER BY DATE(c.Fecha) ASC
        `;
        const chartData = await query(chartQuery);

        // 3. Top Productos Comprados
        const topProductsQuery = `
            SELECT 
                p.Nombre,
                SUM(dc.Cantidad) as CantidadComprada,
                SUM(dc.Subtotal) as TotalGastado
            FROM DetalleCompra dc
            JOIN Compras c ON dc.CompraId = c.Id
            JOIN Productos p ON dc.ProductoId = p.Id
            WHERE ${dateCondition}
            GROUP BY p.Nombre
            ORDER BY TotalGastado DESC
            LIMIT 5
        `;
        const topProducts = await query(topProductsQuery);

        return NextResponse.json({
            stats: {
                totalSpend: stats.TotalGastado,
                purchaseCount: stats.TotalCompras
            },
            chart: chartData,
            topProducts: topProducts
        });

    } catch (error) {
        console.error('Error fetching purchase reports:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
