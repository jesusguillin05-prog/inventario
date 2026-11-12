export function getMonthlyReport(db, mes, categoriaId = null) {
  const hasCategory =
    categoriaId !== null && categoriaId !== undefined && categoriaId !== ''

  const ventasParams = hasCategory ? [mes, Number(categoriaId)] : [mes]
  const comprasParams = hasCategory ? [mes, Number(categoriaId)] : [mes]
  const rankingParams = hasCategory ? [mes, Number(categoriaId)] : [mes]
  const inventarioParams = hasCategory ? [Number(categoriaId)] : []

  const ingresos = db.prepare(`
    SELECT COALESCE(SUM(v.total), 0) AS v
    FROM ventas v
    JOIN venta_items vi ON vi.venta_id = v.id
    JOIN productos p ON p.id = vi.producto_id
    WHERE substr(v.fecha, 1, 7) = ?
      ${hasCategory ? 'AND p.categoria_id = ?' : ''}
  `).get(...ventasParams).v

  const costoVendido = db.prepare(`
    SELECT COALESCE(SUM(vi.cantidad * vi.costo_unitario), 0) AS v
    FROM venta_items vi
    JOIN ventas v ON v.id = vi.venta_id
    JOIN productos p ON p.id = vi.producto_id
    WHERE substr(v.fecha, 1, 7) = ?
      ${hasCategory ? 'AND p.categoria_id = ?' : ''}
  `).get(...ventasParams).v

  const gastos = db.prepare(
    'SELECT COALESCE(SUM(monto), 0) AS v FROM gastos WHERE substr(fecha, 1, 7) = ?'
  ).get(mes).v

  const compras = db.prepare(`
    SELECT COALESCE(SUM(c.total), 0) AS v
    FROM compras c
    JOIN compra_items ci ON ci.compra_id = c.id
    JOIN productos p ON p.id = ci.producto_id
    WHERE substr(c.fecha, 1, 7) = ?
      ${hasCategory ? 'AND p.categoria_id = ?' : ''}
  `).get(...comprasParams).v

  const masVendidos = db.prepare(`
    SELECT p.nombre, SUM(vi.cantidad) AS unidades,
           SUM(vi.cantidad * (vi.precio_unitario - vi.costo_unitario)) AS utilidad
    FROM venta_items vi
    JOIN ventas v ON v.id = vi.venta_id
    JOIN productos p ON p.id = vi.producto_id
    WHERE substr(v.fecha, 1, 7) = ?
      ${hasCategory ? 'AND p.categoria_id = ?' : ''}
    GROUP BY p.id
    ORDER BY unidades DESC, p.nombre ASC
    LIMIT 10
  `).all(...rankingParams)

  const valorInventario = db.prepare(`
    SELECT COALESCE(SUM(p.costo), 0) AS v
    FROM productos p
    WHERE p.activo = 1
      ${hasCategory ? 'AND p.categoria_id = ?' : ''}
  `).get(...inventarioParams).v

  const utilidadBruta = ingresos - costoVendido

  return {
    mes,
    ingresos,
    costoVendido,
    utilidadBruta,
    gastosOperativos: gastos,
    utilidadNeta: utilidadBruta - gastos,
    comprasDelMes: compras,
    valorInventario,
    masVendidos
  }
}
