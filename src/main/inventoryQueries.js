const normalizeSearch = (value = '') => String(value ?? '').trim()

export function normalizeSku(value) {
  const trimmed = String(value ?? '').trim()
  return trimmed ? trimmed : null
}

export function getProductList(db, filters = {}) {
  const {
    categoria_id: categoriaId = null,
    search = '',
    includeInactive = false,
    sortBy = 'nombre',
    order = 'asc'
  } = filters

  const query = normalizeSearch(search)
  const params = []

  let sql = `
    SELECT p.*, c.nombre AS categoria, s.stock,
           (s.stock <= p.stock_minimo) AS stock_bajo
    FROM productos p
    LEFT JOIN categorias c ON c.id = p.categoria_id
    LEFT JOIN stock_actual s ON s.producto_id = p.id
    WHERE 1 = 1`

  if (!includeInactive) {
    sql += ' AND p.activo = 1'
  }

  if (categoriaId !== null && categoriaId !== '' && categoriaId !== undefined) {
    sql += ' AND p.categoria_id = ?'
    params.push(Number(categoriaId))
  }

  if (query) {
    sql += ' AND (p.nombre LIKE ? OR p.sku LIKE ? OR c.nombre LIKE ?)'
    const pattern = `%${query}%`
    params.push(pattern, pattern, pattern)
  }

  const validSorts = {
    nombre: 'p.nombre',
    precio: 'p.precio',
    stock: 's.stock',
    costo: 'p.costo'
  }

  const sortKey = validSorts[sortBy] || 'p.nombre'
  const direction = String(order).toLowerCase() === 'desc' ? 'DESC' : 'ASC'

  sql += ` ORDER BY ${sortKey} ${direction}, p.id ASC`

  return db.prepare(sql).all(...params)
}

export function updateProduct(db, payload = {}) {
  const productId = Number(payload.id)
  if (!productId) {
    throw new Error('Falta el id del producto')
  }

  const current = db.prepare('SELECT * FROM productos WHERE id = ?').get(productId)
  if (!current) {
    throw new Error('Producto no encontrado')
  }

  const nombre = String(payload.nombre ?? current.nombre ?? '').trim()
  if (!nombre) {
    throw new Error('El nombre del producto es obligatorio')
  }

  const sku = normalizeSku(payload.sku ?? current.sku)
  const categoriaId =
    payload.categoria_id === null ||
    payload.categoria_id === '' ||
    payload.categoria_id === undefined
      ? null
      : Number(payload.categoria_id)

  const costo = Number(payload.costo ?? current.costo ?? 0)
  const precio = Number(payload.precio ?? current.precio ?? 0)
  const stockMinimo = Number(payload.stock_minimo ?? current.stock_minimo ?? 0)

  try {
    db.prepare(
      `
      UPDATE productos
         SET sku = ?,
             nombre = ?,
             categoria_id = ?,
             costo = ?,
             precio = ?,
             stock_minimo = ?
       WHERE id = ?
    `
    ).run(sku, nombre, categoriaId, costo, precio, stockMinimo, productId)
  } catch (error) {
    if (String(error?.message || '').includes('UNIQUE constraint failed: productos.sku')) {
      throw new Error('Ya existe un producto con ese SKU')
    }
    throw error
  }

  return db
    .prepare(
      `
    SELECT p.*, c.nombre AS categoria, s.stock,
           (s.stock <= p.stock_minimo) AS stock_bajo
    FROM productos p
    LEFT JOIN categorias c ON c.id = p.categoria_id
    LEFT JOIN stock_actual s ON s.producto_id = p.id
    WHERE p.id = ?
  `
    )
    .get(productId)
}

export function toggleProduct(db, id, activo) {
  const productId = Number(id)
  if (!productId) {
    throw new Error('Selecciona un producto válido')
  }

  const nextValue = Number(activo ?? 1)
  const info = db.prepare('UPDATE productos SET activo = ? WHERE id = ?').run(nextValue, productId)

  if (info.changes === 0) {
    throw new Error('No se encontró el producto')
  }

  return productId
}
