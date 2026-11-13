export function reconcileSaleTotal(dbRef, ventaId) {
  const total = dbRef
    .prepare(`
      SELECT COALESCE(SUM(vi.cantidad * vi.precio_unitario), 0) AS total
      FROM venta_items vi
      WHERE vi.venta_id = ?
    `)
    .get(Number(ventaId))?.total

  dbRef
    .prepare('UPDATE ventas SET total = ? WHERE id = ?')
    .run(Number(total || 0), Number(ventaId))

  return Number(total || 0)
}
