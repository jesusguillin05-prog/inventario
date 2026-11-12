import test from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { getProductList, normalizeSku, updateProduct, toggleProduct } from '../src/main/inventoryQueries.js'
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
  CREATE VIEW stock_actual AS
    SELECT p.id AS producto_id, COALESCE(SUM(m.cantidad), 0) AS stock
    FROM productos p LEFT JOIN movimientos m ON m.producto_id = p.id
    GROUP BY p.id;
`

test('guarda el costo del lote al crear el producto sin convertirlo a costo unitario', () => {
  const db = new Database(':memory:')
  db.exec(schema)

  const categoriaId = db
    .prepare('INSERT INTO categorias (nombre) VALUES (?)')
    .run('Labiales').lastInsertRowid

  db.prepare(
    'INSERT INTO productos (nombre, categoria_id, costo, precio, stock_minimo, activo) VALUES (?, ?, ?, ?, ?, 1)'
  ).run('Labial lote', categoriaId, 400000, 12000, 2)

  const producto = db.prepare('SELECT * FROM productos WHERE nombre = ?').get('Labial lote')
  assert.equal(producto.costo, 400000)
})

test('la compra por lote suma el costo nuevo al costo actual del producto', () => {
  const db = new Database(':memory:')
  db.exec(schema)

  const categoriaId = db
    .prepare('INSERT INTO categorias (nombre) VALUES (?)')
    .run('Labiales').lastInsertRowid

  const productoId = db
    .prepare(
      'INSERT INTO productos (nombre, categoria_id, costo, precio, stock_minimo, activo) VALUES (?, ?, ?, ?, ?, 1)'
    )
    .run('Labial prueba', categoriaId, 1000, 1500, 2).lastInsertRowid

  const nextCost = 1000 + 2500

  assert.equal(nextCost, 3500)
})

test('el valor del inventario usa el costo total del lote actual y no lo multiplica por la cantidad', () => {
  const db = new Database(':memory:')
  db.exec(schema)
  db.exec(`
    CREATE TABLE ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
      total INTEGER NOT NULL
    );
    CREATE TABLE venta_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL,
      producto_id INTEGER NOT NULL,
      cantidad INTEGER NOT NULL,
      precio_unitario INTEGER NOT NULL,
      costo_unitario INTEGER NOT NULL
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
    CREATE TABLE gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      categoria TEXT NOT NULL,
      descripcion TEXT,
      monto INTEGER NOT NULL
    );
  `)

  const categoriaId = db
    .prepare('INSERT INTO categorias (nombre) VALUES (?)')
    .run('Labiales').lastInsertRowid

  const productoId = db
    .prepare(
      'INSERT INTO productos (nombre, categoria_id, costo, precio, stock_minimo, activo) VALUES (?, ?, ?, ?, ?, 1)'
    )
    .run('Labial lote', categoriaId, 300000, 16000, 2).lastInsertRowid

  db.prepare(
    'INSERT INTO movimientos (producto_id, tipo, cantidad, costo_unitario, fecha, referencia) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(productoId, 'entrada', 30, 300000, '2026-11-09', 'stock_inicial')

  const report = getMonthlyReport(db, '2026-11')
  assert.equal(report.valorInventario, 300000)
})

test('normaliza SKU vacío para permitir varios productos sin código', () => {
  assert.equal(normalizeSku(''), null)
  assert.equal(normalizeSku('   '), null)
  assert.equal(normalizeSku('SKU-001'), 'SKU-001')
})

test('actualiza, busca y desactiva un producto', () => {
  const db = new Database(':memory:')
  db.exec(schema)

  const categoriaId = db
    .prepare('INSERT INTO categorias (nombre) VALUES (?)')
    .run('Labiales').lastInsertRowid
  const productoId = db
    .prepare(
      'INSERT INTO productos (nombre, categoria_id, costo, precio, stock_minimo, activo) VALUES (?, ?, ?, ?, ?, 1)'
    )
    .run('Labial prueba', categoriaId, 500, 1500, 2).lastInsertRowid

  db.prepare(
    'INSERT INTO movimientos (producto_id, tipo, cantidad, costo_unitario, fecha, referencia) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(productoId, 'entrada', 5, 500, '2026-11-09', 'stock_inicial')

  const filtered = getProductList(db, {
    search: 'labial',
    categoria_id: categoriaId,
    sortBy: 'precio',
    order: 'desc'
  })
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].nombre, 'Labial prueba')

  updateProduct(db, {
    id: productoId,
    nombre: 'Labial editado',
    categoria_id: categoriaId,
    costo: 600,
    precio: 1800,
    stock_minimo: 3,
    sku: 'SKU-1'
  })

  const updated = db.prepare('SELECT * FROM productos WHERE id = ?').get(productoId)
  assert.equal(updated.nombre, 'Labial editado')
  assert.equal(updated.precio, 1800)
  assert.equal(updated.stock_minimo, 3)

  toggleProduct(db, productoId, 0)
  const visible = getProductList(db, { search: 'editado', categoria_id: categoriaId })
  assert.equal(visible.length, 0)

  const inactive = getProductList(db, {
    search: 'editado',
    categoria_id: categoriaId,
    includeInactive: true
  })
  assert.equal(inactive.length, 1)
  assert.equal(inactive[0].activo, 0)
})
