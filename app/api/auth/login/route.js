
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
    try {
        const { username, password } = await request.json();

        const users = await query(`
            SELECT Id, Nombre, Rol, Permisos 
            FROM Usuarios 
            WHERE Nombre = '${username}' AND Clave = '${password}'
        `);

        if (users.length > 0) {
            const user = users[0];
            return NextResponse.json({
                user: {
                    id: user.Id,
                    name: user.Nombre,
                    role: user.Rol,
                    permissions: JSON.parse(user.Permisos || '[]')
                }
            });
        } else {
            return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
