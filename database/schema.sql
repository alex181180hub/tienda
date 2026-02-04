-- Crear la base de datos si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'TiendaPOS')
BEGIN
    CREATE DATABASE TiendaPOS;
END
GO

USE TiendaPOS;
GO

-- Tabla: Productos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Productos]') AND type in (N'U'))
BEGIN
    CREATE TABLE Productos (
        Id INT PRIMARY KEY IDENTITY(1,1),
        CodigoBarras VARCHAR(50) UNIQUE,
        Nombre VARCHAR(100) NOT NULL,
        Categoria VARCHAR(50),
        PrecioVenta DECIMAL(10, 2) NOT NULL,
        Costo DECIMAL(10, 2) NOT NULL DEFAULT 0,
        StockActual DECIMAL(10, 3) NOT NULL DEFAULT 0,
        StockMinimo DECIMAL(10, 3) NOT NULL DEFAULT 5,
        Unidad VARCHAR(20) DEFAULT 'u',
        FechaCreacion DATETIME DEFAULT GETDATE(),
        Activo BIT DEFAULT 1
    );
END
GO

-- Tabla: Usuarios
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Usuarios]') AND type in (N'U'))
BEGIN
    CREATE TABLE Usuarios (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Nombre VARCHAR(100) NOT NULL UNIQUE,
        Clave VARCHAR(100) NOT NULL,
        Rol VARCHAR(50) NOT NULL DEFAULT 'VENDEDOR',
        Permisos NVARCHAR(MAX) -- JSON string
    );
    -- Insert Default Admin
    INSERT INTO Usuarios (Nombre, Clave, Rol, Permisos) VALUES ('admin', '1234', 'ADMIN', '["*"]');
END
GO

-- Tabla: Ventas
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Ventas]') AND type in (N'U'))
BEGIN
    CREATE TABLE Ventas (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Fecha DATETIME DEFAULT GETDATE(),
        Total DECIMAL(10, 2) NOT NULL,
        MetodoPago VARCHAR(50) DEFAULT 'EFECTIVO'
    );
END
GO

-- Tabla: DetalleVenta
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DetalleVenta]') AND type in (N'U'))
BEGIN
    CREATE TABLE DetalleVenta (
        Id INT PRIMARY KEY IDENTITY(1,1),
        VentaId INT NOT NULL,
        ProductoId INT NOT NULL,
        Cantidad DECIMAL(10, 3) NOT NULL,
        PrecioUnitario DECIMAL(10, 2) NOT NULL,
        Subtotal DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (VentaId) REFERENCES Ventas(Id),
        FOREIGN KEY (ProductoId) REFERENCES Productos(Id)
    );
END
GO

-- Tabla: MovimientosStock (Para auditoría de entradas y salidas)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MovimientosStock]') AND type in (N'U'))
BEGIN
    CREATE TABLE MovimientosStock (
        Id INT PRIMARY KEY IDENTITY(1,1),
        ProductoId INT NOT NULL,
        TipoMovimiento VARCHAR(20) NOT NULL, -- 'VENTA', 'COMPRA', 'AJUSTE', 'INICIAL'
        Cantidad DECIMAL(10, 3) NOT NULL, -- Positivo para entrada, Negativo para salida
        Fecha DATETIME DEFAULT GETDATE(),
        Notas VARCHAR(255),
        FOREIGN KEY (ProductoId) REFERENCES Productos(Id)
    );
END
GO

-- Insertar datos de prueba (Solo si la tabla Productos está vacía)
IF NOT EXISTS (SELECT TOP 1 * FROM Productos)
BEGIN
    INSERT INTO Productos (CodigoBarras, Nombre, Categoria, PrecioVenta, Costo, StockActual, StockMinimo, Unidad)
    VALUES 
    ('779001', 'Coca Cola 500ml', 'Bebidas', 1500.00, 1000.00, 50, 10, 'u'),
    ('779002', 'Papas Fritas Lays', 'Snacks', 2500.00, 1800.00, 20, 5, 'u'),
    ('779003', 'Agua Mineral 1L', 'Bebidas', 1200.00, 600.00, 100, 20, 'u'),
    ('779004', 'Galletas Oreo', 'Snacks', 1800.00, 1100.00, 30, 10, 'u'),
    ('779005', 'Cerveza Quilmes', 'Bebidas', 3000.00, 2100.00, 60, 24, 'u'),
    ('999001', 'Queso Criollo', 'Lácteos', 50.00, 35.00, 10.500, 2.000, 'kg');
END
GO
