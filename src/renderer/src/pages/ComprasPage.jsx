import { useState } from 'react'
import PropTypes from 'prop-types'
import Panel from '../components/Panel'
import { formatMoney, normalizeInputValue } from '../utils/format'

export default function ComprasPage({
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
  handleAdjustmentSubmit,
  recentAdjustments
}) {
  const [productSearchText, setProductSearchText] = useState('')
  const selectedProduct = productosActivos.find(
    (producto) => String(producto.id) === String(purchaseForm.producto_id)
  )
  const productInputValue = selectedProduct ? selectedProduct.nombre : productSearchText

  return (
    <section className="grid-2">
      <Panel>
        <div className="panel-header">
          <h2>Carrito de compras</h2>
        </div>

        <form
          className="stack-form"
          onSubmit={(event) => {
            handlePurchaseSubmit(event)
            setProductSearchText('')
          }}
        >
          <label>
            Producto
            <input
              list="productos-compra"
              value={productInputValue}
              onChange={(event) => {
                const nombre = event.target.value
                setProductSearchText(nombre)

                const producto = productosActivos.find(
                  (item) => item.nombre.toLowerCase() === nombre.trim().toLowerCase()
                )

                setPurchaseForm((current) => ({
                  ...current,
                  producto_id: producto ? String(producto.id) : '',
                  costo_unitario: producto ? producto.costo : current.costo_unitario
                }))
              }}
              placeholder="Escribe el nombre del producto"
            />
            <datalist id="productos-compra">
              {productosActivos.map((producto) => (
                <option key={producto.id} value={producto.nombre}>
                  {producto.nombre} (stock: {producto.stock})
                </option>
              ))}
            </datalist>
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
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                addToPurchaseCart()
                setProductSearchText('')
              }}
            >
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
                <div key={item.cartId ?? item.producto_id} className="cart-row">
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
                      onClick={() => removeFromPurchaseCart(item)}
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
            <input
              list="productos-ajuste"
              value={
                productosActivos.find(
                  (producto) => String(producto.id) === String(adjustmentForm.producto_id)
                )?.nombre ?? ''
              }
              onChange={(event) => {
                const nombre = event.target.value
                const producto = productosActivos.find(
                  (item) => item.nombre.toLowerCase() === nombre.trim().toLowerCase()
                )

                setAdjustmentForm((current) => ({
                  ...current,
                  producto_id: producto ? String(producto.id) : ''
                }))
              }}
              placeholder="Escribe el nombre del producto"
            />
            <datalist id="productos-ajuste">
              {productosActivos.map((producto) => (
                <option key={producto.id} value={producto.nombre}>
                  {producto.nombre} (stock: {producto.stock})
                </option>
              ))}
            </datalist>
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

        {recentAdjustments.length > 0 && (
          <div className="recent-adjustments">
            <div className="panel-header compact">
              <h3>Últimos ajustes</h3>
            </div>
            <ul className="simple-list">
              {recentAdjustments.map((ajuste) => (
                <li key={ajuste.id}>
                  <div>
                    <span>{ajuste.producto}</span>
                    <small>{ajuste.nota}</small>
                  </div>
                  <strong>
                    {ajuste.cantidad > 0 ? '+' : ''}
                    {ajuste.cantidad}
                  </strong>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>
    </section>
  )
}

ComprasPage.propTypes = {
  productos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      nombre: PropTypes.string,
      costo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      stock: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  ).isRequired,
  productosActivos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      nombre: PropTypes.string,
      stock: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  ).isRequired,
  purchaseForm: PropTypes.shape({
    producto_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    costo_unitario: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    nota: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }).isRequired,
  setPurchaseForm: PropTypes.func.isRequired,
  addToPurchaseCart: PropTypes.func.isRequired,
  handlePurchaseSubmit: PropTypes.func.isRequired,
  purchaseCart: PropTypes.arrayOf(
    PropTypes.shape({
      producto_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      nombre: PropTypes.string,
      cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      costo_unitario: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  ).isRequired,
  removeFromPurchaseCart: PropTypes.func.isRequired,
  purchaseCartTotal: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  adjustmentForm: PropTypes.shape({
    producto_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    nota: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }).isRequired,
  setAdjustmentForm: PropTypes.func.isRequired,
  handleAdjustmentSubmit: PropTypes.func.isRequired,
  recentAdjustments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      producto: PropTypes.string,
      cantidad: PropTypes.number,
      nota: PropTypes.string,
      fecha: PropTypes.string
    })
  ).isRequired
}
