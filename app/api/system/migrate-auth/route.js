
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        await query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Usuarios]') AND type in (N'U'))
            BEGIN
                CREATE TABLE Usuarios (
                    Id INT PRIMARY KEY IDENTITY(1,1),
                    Nombre VARCHAR(100) NOT NULL UNIQUE,
                    Clave VARCHAR(100) NOT NULL,
                    Rol VARCHAR(20) NOT NULL,
                    Permisos NVARCHAR(MAX) -- JSON String e.g. ["/vender", "/caja"]
                );
                
                -- Create Default Admin
                INSERT INTO Usuarios (Nombre, Clave, Rol, Permisos)
                VALUES ('admin', '1234', 'ADMIN', '["*"]');
            END
        `);

        return NextResponse.json({ message: 'Auth Migration Applied' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
