import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const period = searchParams.get('period') || 'today';

        // Determine date filter logic
        let dateCondition = "";
        let chartDateCondition = "";

        // Simple logic: if startDate/endDate provided, use them. Else use period shortcuts.
        if (startDate && endDate) {
            dateCondition = `DATE(Fecha) BETWEEN '${startDate}' AND '${endDate}'`;
            chartDateCondition = `DATE(Fecha) BETWEEN '${startDate}' AND '${endDate}'`;
        } else {
            // Shortcuts
            if (period === 'today') {
                dateCondition = `DATE(Fecha) = CURDATE()`;
                chartDateCondition = `Fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
            } else if (period === 'week') {
                dateCondition = `Fecha >= DATE_SUB(NOW(), INTERVAL 1 WEEK)`;
                chartDateCondition = dateCondition;
            } else if (period === 'month') {
                dateCondition = `Fecha >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`;
                chartDateCondition = dateCondition;
            }
        }

        const statsQuery = `
            SELECT 
                SUM(Total) as TotalVentas,
                COUNT(*) as Transacciones,
                IFNULL(AVG(Total), 0) as TicketPromedio
            FROM Ventas
            WHERE ${dateCondition}
        `;
        const statsRes = await query(statsQuery);
        const stats = statsRes[0];

        // 2. Gráfico de Ventas
        const chartQuery = `
            SELECT 
                DATE_FORMAT(Fecha, '%d/%m') as date,
                SUM(Total) as sales
            FROM Ventas
            WHERE ${chartDateCondition}
            GROUP BY DATE_FORMAT(Fecha, '%d/%m'), DATE(Fecha)
            ORDER BY DATE(Fecha) ASC
        `;
        const chartData = await query(chartQuery);

        // 3. Top Productos vendidos (Filtrado por el mismo rango de fecha)
        // Need to join with Ventas to filter by date
        const topProductsQuery = `
            SELECT 
                p.Nombre,
                SUM(dv.Cantidad) as CantidadVendida,
                SUM(dv.Subtotal) as TotalGenerado
            FROM DetalleVenta dv
            JOIN Productos p ON dv.ProductoId = p.Id
            JOIN Ventas v ON dv.VentaId = v.Id
            WHERE ${dateCondition.replace(/Fecha/g, 'v.Fecha')}
            GROUP BY p.Nombre
            ORDER BY TotalGenerado DESC
            LIMIT 5
        `;
        const topProducts = await query(topProductsQuery);

        return NextResponse.json({
            stats: {
                totalSales: stats.TotalVentas || 0,
                transactions: stats.Transacciones || 0,
                avgTicket: stats.TicketPromedio || 0
            },
            salesChart: chartData,
            topProducts: topProducts
        });

    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
