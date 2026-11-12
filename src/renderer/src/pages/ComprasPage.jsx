import Panel from '../components/Panel'
import { formatMoney, normalizeInputValue } from '../utils/format'

export default function ComprasPage({
  productos,
  productosActivos,
  purchaseForm,
  setPurchaseForm,
  addToPurchaseCart,
  handlePurchaseSubmit,
  purchaseCart,
  removeFromPurchaseCart,
  purchaseCartTotal,
  adjustmentForm,
  setAdjustmentForm,
  handleAdjustmentSubmit
}) {
  return (
    <section className="grid-2">
      <Panel>
        <div className="panel-header">
          <h2>Carrito de compras</h2>
        </div>

        <form className="stack-form" onSubmit={handlePurchaseSubmit}>
          <label>
            Producto
            <select
              value={normalizeInputValue(purchaseForm.producto_id)}
              onChange={(event) => {
                const producto = productos.find((p) => String(p.id) === String(event.target.value))
                setPurchaseForm((current) => ({
                  ...current,
                  producto_id: event.target.value,
                  costo_unitario: producto ? producto.costo : ''
                }))
              }}
            >
              <option value="">Selecciona</option>
              {productosActivos.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre}
                </option>
              ))}
            </select>
          </label>

          <div className="field-row two-col">
            <label>
              Cantidad
              <input
                type="number"
                min="1"
                value={normalizeInputValue(purchaseForm.cantidad)}
                onChange={(event) =>
                  setPurchaseForm((current) => ({
                    ...current,
                    cantidad: event.target.value
                  }))
                }
              />
            </label>
            <label>
              Costo del lote
              <input
                type="number"
                min="0"
                value={normalizeInputValue(purchaseForm.costo_unitario)}
                onChange={(event) =>
                  setPurchaseForm((current) => ({
                    ...current,
                    costo_unitario: event.target.value
                  }))
                }
              />
            </label>
          </div>

          <div className="inline-actions">
            <button type="button" className="secondary-btn" onClick={addToPurchaseCart}>
              Agregar al carrito
            </button>
            <button type="submit" className="primary-btn">
              Registrar compra
            </button>
          </div>
        </form>

        <div className="cart-summary">
          <div className="cart-header">
            <strong>Resumen</strong>
            <span>{purchaseCart.length} producto(s)</span>
          </div>

          {purchaseCart.length ? (
            <div className="cart-list">
              {purchaseCart.map((item) => (
                <div key={item.producto_id} className="cart-row">
                  <div>
                    <span>{item.nombre}</span>
                    <small>
                      {item.cantidad} × {formatMoney(item.costo_unitario)}
                    </small>
                  </div>
                  <div className="cart-row-actions">
                    <strong>{formatMoney(item.cantidad * item.costo_unitario)}</strong>
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => removeFromPurchaseCart(item.producto_id)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-note">El carrito de compras está vacío.</p>
          )}

          <div className="cart-total">
            <span>Total</span>
            <strong>{formatMoney(purchaseCartTotal)}</strong>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="panel-header">
          <h2>Ajuste de inventario</h2>
        </div>

        <p className="muted panel-note">
          Solo se usa para corregir stock por merma, daño, regalo o conteo manual.
        </p>

        <form onSubmit={handleAdjustmentSubmit} className="stack-form">
          <label>
            Producto
            <select
              value={normalizeInputValue(adjustmentForm.producto_id)}
              onChange={(event) =>
                setAdjustmentForm((current) => ({
                  ...current,
                  producto_id: event.target.value
                }))
              }
            >
              <option value="">Selecciona</option>
              {productosActivos.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre} (stock: {producto.stock})
                </option>
              ))}
            </select>
          </label>

          <div className="field-row two-col">
            <label>
              Cantidad (+ suma, - resta)
              <input
                type="number"
                value={normalizeInputValue(adjustmentForm.cantidad)}
                onChange={(event) =>
                  setAdjustmentForm((current) => ({
                    ...current,
                    cantidad: event.target.value
                  }))
                }
              />
            </label>
            <label>
              Motivo
              <input
                value={normalizeInputValue(adjustmentForm.nota)}
                onChange={(event) =>
                  setAdjustmentForm((current) => ({ ...current, nota: event.target.value }))
                }
                placeholder="Merma, daño, regalo..."
              />
            </label>
          </div>

          <button type="submit" className="secondary-btn">
            Aplicar ajuste
          </button>
        </form>
      </Panel>
    </section>
  )
}
