import { ipcMain } from 'electron'
import { getDb, transaction } from './db'
import { getProductList, normalizeSku, toggleProduct, updateProduct } from './inventoryQueries'
import { getMonthlyReport } from './reportQueries'

// Fecha LOCAL (toISOString usa UTC y en Colombia, después de las 7 pm, daría el día siguiente)
const hoy = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const validarItems = (items, campoPrecio) => {
  if (!Array.isArray(items) || !items.length) throw new Error('Agrega al menos un producto')
  for (const it of items) {
    if (!Number.isInteger(it.cantidad) || it.cantidad <= 0)
      throw new Error('La cantidad debe ser un número entero mayor a 0')
    if (!(it[campoPrecio] >= 0)) throw new Error('El precio no es válido')
  }
}

export function registerIpc() {
  const db = getDb()

  // ---------- Categorías ----------
  ipcMain.handle('categorias:listar', () =>
    db.prepare('SELECT * FROM categorias ORDER BY nombre ASC').all()
  )

  ipcMain.handle('categorias:crear', (_e, { nombre }) => {
    const cleanName = String(nombre || '').trim()
    if (!cleanName) throw new Error('La categoría requiere un nombre')

    const info = db.prepare('INSERT INTO categorias (nombre) VALUES (?)').run(cleanName)
    return info.lastInsertRowid
  })

  ipcMain.handle('categorias:eliminar', (_e, { id }) => {
    const catId = Number(id)
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM productos WHERE categoria_id = ?').get(catId)
    if (n > 0)
      throw new Error(`La categoría tiene ${n} producto(s). Elimínalos o desactívalos primero.`)
    const info = db.prepare('DELETE FROM categorias WHERE id = ?').run(catId)
    if (info.changes === 0) throw new Error('Categoría no encontrada')
    return catId
  })

  // ---------- Productos ----------
  ipcMain.handle('productos:listar', (_e, filters = {}) =>
    getProductList(db, filters)
  )

  const crearProducto = transaction((p) => {
    const payload = {
      sku: null,
      categoria_id: null,
      costo: 0,
      precio: 0,
      stock_minimo: 0,
      stock_inicial: 0,
      ...p
    }

    const nombre = String(payload.nombre ?? '').trim()
    if (!nombre) {
      throw new Error('El nombre del producto es obligatorio')
    }

    const skuNormalizado = normalizeSku(payload.sku)

    try {
      const info = db.prepare(
        `INSERT INTO productos (sku, nombre, categoria_id, costo, precio, stock_minimo, activo)
         VALUES (@sku, @nombre, @categoria_id, @costo, @precio, @stock_minimo, 1)`
      ).run({
        sku: skuNormalizado,
        nombre,
        categoria_id: payload.categoria_id ?? null,
        costo: Number(payload.costo || 0),
        precio: Number(payload.precio || 0),
        stock_minimo: Number(payload.stock_minimo || 0)
      })

      const stockInicial = Number(payload.stock_inicial || 0)
      if (stockInicial > 0) {
        db.prepare(`
          INSERT INTO movimientos (producto_id, tipo, cantidad, costo_unitario, fecha, referencia, nota)
          VALUES (?, 'entrada', ?, ?, ?, 'stock_inicial', 'Inventario inicial')
        `).run(info.lastInsertRowid, stockInicial, Number(payload.costo || 0), hoy())
      }

      return info.lastInsertRowid
    } catch (error) {
      if (String(error?.message || '').includes('UNIQUE constraint failed: productos.sku')) {
        throw new Error('Ya existe un producto con ese SKU')
      }
      throw error
    }
  })
  ipcMain.handle('productos:crear', (_e, p) => crearProducto(p))

  // Solo se puede eliminar un producto que nunca se vendió ni se compró.
  // Si ya tiene historial, hay que desactivarlo (así los reportes no se dañan).
  const eliminarProducto = transaction((id) => {
    const usos = db
      .prepare(
        `SELECT (SELECT COUNT(*) FROM venta_items WHERE producto_id = ?) AS ventas,
                (SELECT COUNT(*) FROM compra_items WHERE producto_id = ?) AS compras`
      )
      .get(id, id)
    if (usos.ventas || usos.compras)
      throw new Error('Este producto tiene ventas o compras registradas. Desactívalo en lugar de eliminarlo.')
    db.prepare('DELETE FROM movimientos WHERE producto_id = ?').run(id)
    const info = db.prepare('DELETE FROM productos WHERE id = ?').run(id)
    if (info.changes === 0) throw new Error('Producto no encontrado')
    return id
  })
  ipcMain.handle('productos:eliminar', (_e, { id }) => eliminarProducto(Number(id)))

  ipcMain.handle('productos:actualizar', (_e, payload) => updateProduct(db, payload))
  ipcMain.handle('productos:toggle', (_e, payload) => toggleProduct(db, payload?.id, payload?.activo))

  // ---------- Ventas (transacción: venta + items + movimientos) ----------
  const crearVenta = transaction(({ fecha = hoy(), metodo_pago = 'efectivo', items }) => {
    validarItems(items, 'precio_unitario')
    const getProd = db.prepare(`
      SELECT p.id, p.costo, s.stock
      FROM productos p
      LEFT JOIN stock_actual s ON s.producto_id = p.id
      WHERE p.id = ?
    `)
    const updCosto = db.prepare('UPDATE productos SET costo = ? WHERE id = ?')
    let total = 0

    for (const it of items) {
      const row = getProd.get(it.producto_id)
      if (!row) throw new Error('Producto no encontrado')
      if ((row.stock ?? 0) < it.cantidad) throw new Error(`Stock insuficiente (disponible: ${row.stock ?? 0})`)
      total += it.cantidad * it.precio_unitario
    }

    const ventaId = db.prepare('INSERT INTO ventas (fecha, metodo_pago, total) VALUES (?,?,?)')
      .run(fecha, metodo_pago, total).lastInsertRowid
    const insItem = db.prepare(`INSERT INTO venta_items
      (venta_id, producto_id, cantidad, precio_unitario, costo_unitario) VALUES (?,?,?,?,?)`)
    const insMov = db.prepare(`INSERT INTO movimientos
      (producto_id, tipo, cantidad, costo_unitario, fecha, referencia) VALUES (?,?,?,?,?,?)`)

    for (const it of items) {
      const row = getProd.get(it.producto_id)
      const stockActual = Number(row?.stock ?? 0)
      const costoActual = Number(row?.costo ?? 0)
      const costoUnitario = stockActual > 0 ? Math.round(costoActual / stockActual) : 0
      const costoVenta = costoUnitario * it.cantidad

      insItem.run(ventaId, it.producto_id, it.cantidad, it.precio_unitario, costoUnitario)
      insMov.run(it.producto_id, 'salida', -it.cantidad, costoUnitario, fecha, 'venta:' + ventaId)
      updCosto.run(Math.max(0, costoActual - costoVenta), it.producto_id)
    }

    return ventaId
  })
  ipcMain.handle('ventas:crear', (_e, data) => crearVenta(data))
  ipcMain.handle('ventas:listar', (_e, categoriaId = null) => {
    let sql = `
      SELECT v.id, v.fecha, v.total,
             vi.id AS item_id, vi.producto_id, p.nombre AS producto,
             p.categoria_id, c.nombre AS categoria,
             vi.cantidad, vi.precio_unitario, vi.costo_unitario
      FROM ventas v
      JOIN venta_items vi ON vi.venta_id = v.id
      JOIN productos p ON p.id = vi.producto_id
      LEFT JOIN categorias c ON c.id = p.categoria_id
    `
    const params = []

    if (categoriaId !== null && categoriaId !== '' && categoriaId !== undefined) {
      sql += ' WHERE p.categoria_id = ?'
      params.push(Number(categoriaId))
    }

    sql += ' ORDER BY v.fecha DESC, v.id DESC, vi.id DESC'
    return db.prepare(sql).all(...params)
  })

  // ---------- Compras (entra stock y actualiza el costo del producto) ----------
  const crearCompra = transaction(({ fecha = hoy(), proveedor_id = null, items }) => {
    validarItems(items, 'costo_unitario')

    const compraId = db.prepare('INSERT INTO compras (fecha, proveedor_id, total) VALUES (?,?,?)')
      .run(fecha, proveedor_id, 0).lastInsertRowid

    const insItem = db.prepare(`INSERT INTO compra_items
      (compra_id, producto_id, cantidad, costo_unitario) VALUES (?,?,?,?)`)
    const insMov = db.prepare(`INSERT INTO movimientos
      (producto_id, tipo, cantidad, costo_unitario, fecha, referencia) VALUES (?,?,?,?,?,?)`)
    const updCosto = db.prepare('UPDATE productos SET costo = ? WHERE id = ?')
    const getProducto = db.prepare('SELECT costo FROM productos WHERE id = ?')

    let totalCompra = 0

    for (const it of items) {
      const productoActual = getProducto.get(it.producto_id)
      if (!productoActual) throw new Error('Producto no encontrado')

      const cantidad = Number(it.cantidad)
      const costoLote = Number(it.costo_unitario || 0)

      totalCompra += costoLote
      insItem.run(compraId, it.producto_id, cantidad, costoLote)
      insMov.run(it.producto_id, 'entrada', cantidad, costoLote, fecha, 'compra:' + compraId)

      const nuevoCosto = Number(productoActual.costo || 0) + costoLote
      updCosto.run(nuevoCosto, it.producto_id)
    }

    db.prepare('UPDATE compras SET total = ? WHERE id = ?').run(totalCompra, compraId)
    return compraId
  })
  ipcMain.handle('compras:crear', (_e, data) => crearCompra(data))

  // ---------- Ajustes (mermas, daños, regalos) ----------
  ipcMain.handle('inventario:ajustar', (_e, { producto_id, cantidad, nota, fecha = hoy() }) => {
    if (!Number.isInteger(cantidad) || cantidad === 0)
      throw new Error('La cantidad del ajuste debe ser un entero distinto de 0')
    const row = db.prepare('SELECT stock FROM stock_actual WHERE producto_id = ?').get(producto_id)
    if (!row) throw new Error('Producto no encontrado')
    if (row.stock + cantidad < 0) throw new Error(`El stock no puede quedar negativo (actual: ${row.stock})`)
    return db
      .prepare(`INSERT INTO movimientos (producto_id, tipo, cantidad, fecha, nota)
                VALUES (?, 'ajuste', ?, ?, ?)`)
      .run(producto_id, cantidad, fecha, nota ?? null).lastInsertRowid
  })

  // ---------- Gastos ----------
  ipcMain.handle('gastos:crear', (_e, g) =>
    db.prepare('INSERT INTO gastos (fecha, categoria, descripcion, monto) VALUES (?,?,?,?)')
      .run(g.fecha || hoy(), g.categoria, g.descripcion || '', g.monto).lastInsertRowid
  )
  ipcMain.handle('gastos:listar', (_e, mes) =>
    db.prepare("SELECT * FROM gastos WHERE substr(fecha,1,7) = ? ORDER BY fecha DESC").all(mes)
  )

  // ---------- Reporte mensual (mes = 'YYYY-MM') ----------
  ipcMain.handle('reportes:mensual', (_e, mes, categoriaId = null) =>
    getMonthlyReport(db, mes, categoriaId)
  )
}