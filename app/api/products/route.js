import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: Listar todos los productos
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        let sqlQuery = 'SELECT * FROM Productos WHERE Activo = 1';

        if (search) {
            sqlQuery += ` AND (Nombre LIKE '%${search}%' OR CodigoBarras LIKE '%${search}%' OR Categoria LIKE '%${search}%')`;
        }

        sqlQuery += ' ORDER BY Nombre ASC';

        const result = await query(sqlQuery);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Crear un nuevo producto
export async function POST(request) {
    try {
        const body = await request.json();
        const { codigoBarras, nombre, categoria, precioVenta, costo, stockActual, stockMinimo, unidad } = body;

        // Validación básica
        if (!nombre) {
            return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
        }

        // Sanitización y Valores por Defecto
        const cleanCodigo = (codigoBarras || '').replace(/'/g, "''");
        const cleanNombre = (nombre || '').replace(/'/g, "''");
        const cleanCategoria = (categoria || 'General').replace(/'/g, "''");
        const cleanUnidad = (unidad || 'u').replace(/'/g, "''");

        // Numeros: Asegurar que no sean null/undefined/NaN para columnas NOT NULL
        // JSON NaN se convierte en null.
        const safePrecio = Number(precioVenta) || 0;
        const safeCosto = Number(costo) || 0;
        const safeStock = Number(stockActual) || 0;
        const safeMinStock = Number(stockMinimo) || 0;

        const insertQuery = `
            INSERT INTO Productos (CodigoBarras, Nombre, Categoria, PrecioVenta, Costo, StockActual, StockMinimo, Unidad)
            VALUES ('${cleanCodigo}', '${cleanNombre}', '${cleanCategoria}', ${safePrecio}, ${safeCosto}, ${safeStock}, ${safeMinStock}, '${cleanUnidad}');
        `;

        const result = await query(insertQuery);

        return NextResponse.json({ message: 'Producto creado', id: result.insertId }, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        // Log query error details if possible, but keep response generic-ish or include details for debugging
        return NextResponse.json({ error: 'Error al crear producto: ' + error.message }, { status: 500 });
    }
}
