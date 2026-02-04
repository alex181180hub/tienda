import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST: Registrar Compra (Puede ser múltiples items)
export async function POST(request) {
    try {
        const body = await request.json();

        // Support both single item (legacy/new product) and bulk list
        let items = body.items || [];
        const supplier = body.supplier || 'General';

        // If single item payload (e.g. from "New Product" creation flow if reused, or direct call)
        if (!body.items && body.id) {
            items = [{
                id: body.id,
                quantity: body.quantity,
                cost: body.cost,
                price: body.price
            }];
        }

        if (items.length === 0) {
            return NextResponse.json({ error: 'No hay items en la compra' }, { status: 400 });
        }

        // 1. Calculate Grand Total
        let grandTotal = 0;
        items.forEach(item => {
            const qty = parseInt(item.quantity) || 0;
            const cost = parseFloat(item.cost) || 0;
            grandTotal += (qty * cost);
        });

        // 2. Create Purchase Header
        const insertCompra = `
            INSERT INTO Compras (Proveedor, Total, Fecha)
            VALUES ('${supplier}', ${grandTotal}, NOW())
        `;
        const compraRes = await query(insertCompra);
        const compraId = compraRes.insertId;

        // 3. Process Items
        for (const item of items) {
            const qty = parseInt(item.quantity);
            const cost = parseFloat(item.cost);
            const price = parseFloat(item.price);
            const subtotal = qty * cost;

            // Insert Detail
            await query(`
                INSERT INTO DetalleCompra (CompraId, ProductoId, Cantidad, CostoUnitario, Subtotal)
                VALUES (${compraId}, ${item.id}, ${qty}, ${cost}, ${subtotal})
            `);

            // Update Product Stock & Price
            let updateFields = [`StockActual = StockActual + ${qty}`];
            if (item.cost) updateFields.push(`Costo = ${cost}`);
            if (item.price) updateFields.push(`PrecioVenta = ${price}`);

            await query(`
                UPDATE Productos 
                SET ${updateFields.join(', ')}
                WHERE Id = ${item.id}
            `);

            // Log Movement
            await query(`
                INSERT INTO MovimientosStock (ProductoId, TipoMovimiento, Cantidad, Notas)
                VALUES (${item.id}, 'COMPRA', ${qty}, 'Compra #${compraId}')
            `);
        }

        return NextResponse.json({ message: 'Compra registrada con éxito', purchaseId: compraId });

    } catch (error) {
        console.error('Error updating inventory:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
