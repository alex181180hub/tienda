-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS TiendaPOS;
USE TiendaPOS;

-- Tabla: Productos
CREATE TABLE IF NOT EXISTS Productos (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    CodigoBarras VARCHAR(50) UNIQUE,
    Nombre VARCHAR(100) NOT NULL,
    Categoria VARCHAR(50),
    PrecioVenta DECIMAL(10, 2) NOT NULL,
    Costo DECIMAL(10, 2) NOT NULL DEFAULT 0,
    StockActual DECIMAL(10, 3) NOT NULL DEFAULT 0,
    StockMinimo DECIMAL(10, 3) NOT NULL DEFAULT 5,
    Unidad VARCHAR(20) DEFAULT 'u',
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    Activo BOOLEAN DEFAULT TRUE
);

-- Tabla: Usuarios
CREATE TABLE IF NOT EXISTS Usuarios (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Nombre VARCHAR(100) NOT NULL UNIQUE,
    Clave VARCHAR(100) NOT NULL,
    Rol VARCHAR(50) NOT NULL DEFAULT 'VENDEDOR',
    Permisos TEXT -- JSON string
);

-- Insert Default Admin (checking existence to avoid duplicates if run multiple times)
INSERT IGNORE INTO Usuarios (Nombre, Clave, Rol, Permisos) VALUES ('admin', '1234', 'ADMIN', '["*"]');

-- Tabla: Ventas
CREATE TABLE IF NOT EXISTS Ventas (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    Total DECIMAL(10, 2) NOT NULL,
    MetodoPago VARCHAR(50) DEFAULT 'EFECTIVO',
    Estado VARCHAR(20) DEFAULT 'COMPLETADA'
);

-- Tabla: DetalleVenta
CREATE TABLE IF NOT EXISTS DetalleVenta (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    VentaId INT NOT NULL,
    ProductoId INT NOT NULL,
    Cantidad DECIMAL(10, 3) NOT NULL,
    PrecioUnitario DECIMAL(10, 2) NOT NULL,
    Subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (VentaId) REFERENCES Ventas(Id),
    FOREIGN KEY (ProductoId) REFERENCES Productos(Id)
);

-- Tabla: MovimientosStock
CREATE TABLE IF NOT EXISTS MovimientosStock (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    ProductoId INT NOT NULL,
    TipoMovimiento VARCHAR(20) NOT NULL, -- 'VENTA', 'COMPRA', 'AJUSTE', 'INICIAL'
    Cantidad DECIMAL(10, 3) NOT NULL, -- Positivo para entrada, Negativo para salida
    Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    Notas VARCHAR(255),
    FOREIGN KEY (ProductoId) REFERENCES Productos(Id)
);

-- Tabla: CierresCaja
CREATE TABLE IF NOT EXISTS CierresCaja (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    TotalSistema DECIMAL(10, 2) NOT NULL,
    TotalReal DECIMAL(10, 2) NOT NULL,
    Diferencia DECIMAL(10, 2) NOT NULL,
    Notas VARCHAR(255)
);

-- Tabla: Compras
CREATE TABLE IF NOT EXISTS Compras (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    Proveedor VARCHAR(100),
    Total DECIMAL(10, 2) NOT NULL,
    Notas VARCHAR(255)
);

-- Tabla: DetalleCompra
CREATE TABLE IF NOT EXISTS DetalleCompra (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    CompraId INT NOT NULL,
    ProductoId INT NOT NULL,
    Cantidad INT NOT NULL,
    CostoUnitario DECIMAL(10, 2) NOT NULL,
    Subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (CompraId) REFERENCES Compras(Id),
    FOREIGN KEY (ProductoId) REFERENCES Productos(Id)
);

-- Insertar datos de prueba (Solo si la tabla Productos está vacía)
INSERT IGNORE INTO Productos (CodigoBarras, Nombre, Categoria, PrecioVenta, Costo, StockActual, StockMinimo, Unidad)
VALUES 
('779001', 'Coca Cola 500ml', 'Bebidas', 1500.00, 1000.00, 50, 10, 'u'),
('779002', 'Papas Fritas Lays', 'Snacks', 2500.00, 1800.00, 20, 5, 'u'),
('779003', 'Agua Mineral 1L', 'Bebidas', 1200.00, 600.00, 100, 20, 'u'),
('779004', 'Galletas Oreo', 'Snacks', 1800.00, 1100.00, 30, 10, 'u'),
('779005', 'Cerveza Quilmes', 'Bebidas', 3000.00, 2100.00, 60, 24, 'u'),
('999001', 'Queso Criollo', 'Lácteos', 50.00, 35.00, 10.500, 2.000, 'kg');
