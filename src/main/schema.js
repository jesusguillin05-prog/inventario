// Dinero en enteros (pesos sin decimales). Fechas en formato ISO 'YYYY-MM-DD'.
export const schema = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS proveedores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  telefono TEXT
);

CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE,
  nombre TEXT NOT NULL,
  categoria_id INTEGER REFERENCES categorias(id),
  costo INTEGER NOT NULL DEFAULT 0,
  precio INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1
);

-- El stock se calcula sumando movimientos (nunca se edita a mano).
-- tipo: 'entrada' | 'salida' | 'ajuste' (cantidad con signo: + suma, - resta)
CREATE TABLE IF NOT EXISTS movimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada','salida','ajuste')),
  cantidad INTEGER NOT NULL,
  costo_unitario INTEGER NOT NULL DEFAULT 0,
  fecha TEXT NOT NULL,
  referencia TEXT,
  nota TEXT
);

CREATE TABLE IF NOT EXISTS ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
  total INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS venta_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario INTEGER NOT NULL,
  costo_unitario INTEGER NOT NULL  -- costo al momento de vender (para la utilidad)
);

CREATE TABLE IF NOT EXISTS compras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  proveedor_id INTEGER REFERENCES proveedores(id),
  total INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS compra_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  compra_id INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  costo_unitario INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS gastos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  categoria TEXT NOT NULL,   -- envios, empaques, publicidad, transporte...
  descripcion TEXT,
  monto INTEGER NOT NULL
);

CREATE VIEW IF NOT EXISTS stock_actual AS
  SELECT p.id AS producto_id,
         COALESCE(SUM(m.cantidad), 0) AS stock
  FROM productos p
  LEFT JOIN movimientos m ON m.producto_id = p.id
  GROUP BY p.id;

CREATE INDEX IF NOT EXISTS idx_mov_producto ON movimientos(producto_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
`
