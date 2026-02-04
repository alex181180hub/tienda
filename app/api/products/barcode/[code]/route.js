import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: Buscar producto por Código de Barras (para escanear en Compras/Ventas)
export async function GET(request, { params }) {
    try {
        const { code } = await params;

        const sqlQuery = `SELECT * FROM Productos WHERE CodigoBarras = '${code}' AND Activo = 1`;
        const result = await query(sqlQuery);

        if (result.length === 0) {
            return NextResponse.json({ message: 'Producto no encontrado' }, { status: 404 });
        }

        return NextResponse.json(result[0]);
    } catch (error) {
        console.error('Error fetching product by barcode:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
