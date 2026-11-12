import test from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { getMonthlyReport } from '../src/main/reportQueries.js'

const schema = `
  CREATE TABLE categorias (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL UNIQUE);
  CREATE TABLE productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT,
    nombre TEXT NOT NULL,
    categoria_id INTEGER REFERENCES categorias(id),
    costo INTEGER NOT NULL DEFAULT 0,
    precio INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 0,
    activo INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    costo_unitario INTEGER NOT NULL DEFAULT 0,
    fecha TEXT NOT NULL,
    referencia TEXT,
    nota TEXT
  );
  CREATE TABLE ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
    total INTEGER NOT NULL
  );
  CREATE TABLE compras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    proveedor_id INTEGER,
    total INTEGER NOT NULL
  );
  CREATE TABLE compra_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    compra_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    costo_unitario INTEGER NOT NULL
  );
  CREATE TABLE venta_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario INTEGER NOT NULL,
    costo_unitario INTEGER NOT NULL
  );
  CREATE TABLE gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    categoria TEXT NOT NULL,
    descripcion TEXT,
    monto INTEGER NOT NULL
  );
  CREATE VIEW stock_actual AS
    SELECT p.id AS producto_id, COALESCE(SUM(m.cantidad), 0) AS stock
    FROM productos p LEFT JOIN movimientos m ON m.producto_id = p.id
    GROUP BY p.id;
`

test('report by category filters totals for selected category', () => {
  const db = new Database(':memory:')
  db.exec(schema)

  const labialId = db.prepare('INSERT INTO categorias (nombre) VALUES (?)').run('Labial').lastInsertRowid
  const skincareId = db.prepare('INSERT INTO categorias (nombre) VALUES (?)').run('Skincare').lastInsertRowid

  const productoLabial = db.prepare(
    'INSERT INTO productos (nombre, categoria_id, costo, precio, stock_minimo, activo) VALUES (?, ?, ?, ?, ?, 1)'
  ).run('Labial Rojo', labialId, 500, 1200, 2)

  const productoSkincare = db.prepare(
    'INSERT INTO productos (nombre, categoria_id, costo, precio, stock_minimo, activo) VALUES (?, ?, ?, ?, ?, 1)'
  ).run('Serum', skincareId, 800, 2200, 2)

  db.prepare('INSERT INTO movimientos (producto_id, tipo, cantidad, costo_unitario, fecha, referencia) VALUES (?, ?, ?, ?, ?, ?)')
    .run(productoLabial.lastInsertRowid, 'entrada', 10, 500, '2026-11-03', 'stock_inicial')
  db.prepare('INSERT INTO movimientos (producto_id, tipo, cantidad, costo_unitario, fecha, referencia) VALUES (?, ?, ?, ?, ?, ?)')
    .run(productoSkincare.lastInsertRowid, 'entrada', 4, 800, '2026-11-03', 'stock_inicial')

  const venta1Id = db.prepare('INSERT INTO ventas (fecha, metodo_pago, total) VALUES (?, ?, ?)').run('2026-11-04', 'efectivo', 2400).lastInsertRowid
  db.prepare('INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario, costo_unitario) VALUES (?, ?, ?, ?, ?)')
    .run(venta1Id, productoLabial.lastInsertRowid, 2, 1200, 500)

  const venta2Id = db.prepare('INSERT INTO ventas (fecha, metodo_pago, total) VALUES (?, ?, ?)').run('2026-11-05', 'efectivo', 2200).lastInsertRowid
  db.prepare('INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario, costo_unitario) VALUES (?, ?, ?, ?, ?)')
    .run(venta2Id, productoSkincare.lastInsertRowid, 1, 2200, 800)

  const general = getMonthlyReport(db, '2026-11')
  const byCategory = getMonthlyReport(db, '2026-11', labialId)

  assert.equal(general.ingresos, 4600)
  assert.equal(byCategory.ingresos, 2400)
  assert.equal(byCategory.valorInventario, 500)
  assert.equal(byCategory.masVendidos.length, 1)
  assert.equal(byCategory.masVendidos[0].nombre, 'Labial Rojo')
})
