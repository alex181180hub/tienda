
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const users = await query('SELECT Id, Nombre, Rol, Permisos, Clave FROM Usuarios');
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { name, password, role, permissions } = await request.json();
        const permsString = JSON.stringify(permissions);

        await query(`
            INSERT INTO Usuarios (Nombre, Clave, Rol, Permisos)
            VALUES ('${name}', '${password}', '${role}', '${permsString}')
        `);

        return NextResponse.json({ message: 'Usuario creado' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { id, name, password, role, permissions } = await request.json();
        const permsString = JSON.stringify(permissions);

        // Update with or without password if it's changed? 
        // Assuming we always send password or keep it if empty?
        // Let's assume complete update for now.

        let sql = `
            UPDATE Usuarios 
            SET Nombre = '${name}', Rol = '${role}', Permisos = '${permsString}'
        `;

        if (password) {
            sql += `, Clave = '${password}'`;
        }

        sql += ` WHERE Id = ${id}`;

        await query(sql);

        return NextResponse.json({ message: 'Usuario actualizado' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id == 1) return NextResponse.json({ error: 'No se puede borrar al administrador principal' }, { status: 400 });

        await query(`DELETE FROM Usuarios WHERE Id = ${id}`);
        return NextResponse.json({ message: 'Usuario eliminado' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
