import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: List recent sales or Get Sale Details
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            // Get Sale Details (Items)
            const details = await query(`
                SELECT 
                    dv.ProductoId as id, 
                    p.Nombre as name, 
                    dv.Cantidad as quantity, 
                    dv.PrecioUnitario as price 
                FROM DetalleVenta dv
                JOIN Productos p ON dv.ProductoId = p.Id
                WHERE dv.VentaId = ${id}
            `);
            return NextResponse.json(details);
        }

        // List History
        const sales = await query(`
            SELECT 
                Id, 
                DATE_FORMAT(Fecha, '%d/%m/%Y %H:%i') as FechaFormato, 
                Total, 
                Estado 
            FROM Ventas 
            ORDER BY Fecha DESC
            LIMIT 50
        `);
        return NextResponse.json(sales);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ... POST remains same ...

// PUT: Void/Cancel OR Update Sale
export async function PUT(request) {
    try {
        const body = await request.json();
        const { action, id } = body; // action: 'void' | 'update'

        // 1. Verify Sale
        const saleRes = await query(`SELECT * FROM Ventas WHERE Id = ${id}`);
        if (saleRes.length === 0) throw new Error("Venta no encontrada");
        const sale = saleRes[0];
        if (sale.Estado === 'ANULADA') throw new Error("La venta ya está anulada");

        if (action === 'update') {
            const { items, total } = body; // New items list

            // A. Restore Stock from OLD items
            const oldItems = await query(`SELECT * FROM DetalleVenta WHERE VentaId = ${id}`);
            for (const item of oldItems) {
                await query(`UPDATE Productos SET StockActual = StockActual + ${item.Cantidad} WHERE Id = ${item.ProductoId}`);
                // Optional: Log restoration? keeping it simple for now or log generic "Edit" note
            }

            // B. Delete Old Details
            await query(`DELETE FROM DetalleVenta WHERE VentaId = ${id}`);

            // C. Insert NEW Details & Deduct Stock
            for (const item of items) {
                const subtotal = item.quantity * item.price;
                await query(`
                    INSERT INTO DetalleVenta (VentaId, ProductoId, Cantidad, PrecioUnitario, Subtotal)
                    VALUES (${id}, ${item.id}, ${item.quantity}, ${item.price}, ${subtotal})
                `);

                await query(`UPDATE Productos SET StockActual = StockActual - ${item.quantity} WHERE Id = ${item.id}`);
            }

            // D. Update Sale Total
            await query(`UPDATE Ventas SET Total = ${total} WHERE Id = ${id}`);

            // Log Audit
            // We could be more granular, but for MVP grabbing the net change is complex. 
            // We'll just assume "Editado" status logic or just logging.
            // Let's Add a note to the first item movement or a dummy movement? 
            // Simplest: Don't pollute movement log too much, or valid log:
            // "Edición: Stock Reajustado" - hard to track per item without complex diffing.
            // Accepted trade-off: Stock is correct, history log might show "Venta" again? 
            // Better: No log on edit for now to avoid duplicate "Venta" entries confusing reports, 
            // OR explicit "AJUSTE" type. Let's skip extra logging for this speed iteration 
            // as long as StockActual is correct.

            return NextResponse.json({ message: 'Venta Actualizada Correctamente' });

        } else {
            // VOID (Existing Logic)
            const items = await query(`SELECT * FROM DetalleVenta WHERE VentaId = ${id}`);

            for (const item of items) {
                await query(`UPDATE Productos SET StockActual = StockActual + ${item.Cantidad} WHERE Id = ${item.ProductoId}`);
                await query(`
                    INSERT INTO MovimientosStock (ProductoId, TipoMovimiento, Cantidad, Notas)
                    VALUES (${item.ProductoId}, 'ANULACION', ${item.Cantidad}, 'Anulación Venta #${id}')
                `);
            }
            await query(`UPDATE Ventas SET Estado = 'ANULADA' WHERE Id = ${id}`);
            return NextResponse.json({ message: 'Venta Anulada Correctamente' });
        }

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Register Sale
// POST: Register Sale
export async function POST(request) {
    try {
        const body = await request.json();
        const { items, total } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
        }

        // 1. Insertar Venta
        // Added 'Estado' column usage
        const insertVentaSql = `
            INSERT INTO Ventas (Total, Fecha, Estado) 
            VALUES (?, NOW(), 'COMPLETADA');
        `;

        const ventaResult = await query(insertVentaSql, [total]);
        const ventaId = ventaResult.insertId;

        // 2. Insertar Detalles y Actualizar Stock
        for (const item of items) {
            const subtotal = item.quantity * item.price;

            await query(`
                INSERT INTO DetalleVenta (VentaId, ProductoId, Cantidad, PrecioUnitario, Subtotal)
                VALUES (?, ?, ?, ?, ?)
            `, [ventaId, item.id, item.quantity, item.price, subtotal]);

            await query(`
                UPDATE Productos 
                SET StockActual = StockActual - ?
                WHERE Id = ?
            `, [item.quantity, item.id]);

            await query(`
                INSERT INTO MovimientosStock (ProductoId, TipoMovimiento, Cantidad, Notas)
                VALUES (?, 'VENTA', ?, ?)
            `, [item.id, -item.quantity, `Venta #${ventaId}`]);
        }

        return NextResponse.json({ message: 'Venta registrada con éxito', ventaId }, { status: 201 });

    } catch (error) {
        console.error('Error processing sale:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Void/Cancel Sale

