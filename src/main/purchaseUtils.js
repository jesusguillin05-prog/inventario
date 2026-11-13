export function reconcilePurchaseTotal(dbRef, compraId) {
  const total = dbRef
    .prepare('SELECT COALESCE(SUM(costo_unitario), 0) AS total FROM compra_items WHERE compra_id = ?')
    .get(Number(compraId))?.total

  dbRef
    .prepare('UPDATE compras SET total = ? WHERE id = ?')
    .run(Number(total || 0), Number(compraId))

  return Number(total || 0)
}
