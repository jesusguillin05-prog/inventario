import Panel from '../components/Panel'
import { formatMoney, normalizeInputValue } from '../utils/format'

export default function VentasPage({
  productos,
  productosActivos,
  saleForm,
  setSaleForm,
  addToSaleCart,
  handleSaleSubmit,
  saleCart,
  removeFromSaleCart,
  saleCartTotal,
  ventas,
  setVentasCategoryId,
  categorias,
  ventasCategoryId
}) {
  return (
    <section className="split-layout">
      <Panel>
        <div className="panel-header">
          <h2>Carrito de venta</h2>
        </div>

        <form className="stack-form" onSubmit={handleSaleSubmit}>
          <label>
            Producto
            <select
              value={normalizeInputValue(saleForm.producto_id)}
              onChange={(event) => {
                const producto = productos.find((p) => String(p.id) === String(event.target.value))
                setSaleForm((current) => ({
                  ...current,
                  producto_id: event.target.value,
                  precio_unitario: producto ? producto.precio : ''
                }))
              }}
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
              Cantidad
              <input
                type="number"
                min="1"
                value={normalizeInputValue(saleForm.cantidad)}
                onChange={(event) =>
                  setSaleForm((current) => ({ ...current, cantidad: event.target.value }))
                }
              />
            </label>
            <label>
              Precio de venta
              <input
                type="number"
                min="0"
                value={normalizeInputValue(saleForm.precio_unitario)}
                onChange={(event) =>
                  setSaleForm((current) => ({
                    ...current,
                    precio_unitario: event.target.value
                  }))
                }
              />
            </label>
          </div>

          <div className="inline-actions">
            <button type="button" className="secondary-btn" onClick={addToSaleCart}>
              Agregar al carrito
            </button>
            <button type="submit" className="primary-btn">
              Registrar venta
            </button>
          </div>
        </form>

        <div className="cart-summary">
          <div className="cart-header">
            <strong>Resumen</strong>
            <span>{saleCart.length} producto(s)</span>
          </div>

          {saleCart.length ? (
            <div className="cart-list">
              {saleCart.map((item) => (
                <div key={item.producto_id} className="cart-row">
                  <div>
                    <span>{item.nombre}</span>
                    <small>
                      {item.cantidad} × {formatMoney(item.precio_unitario)}
                    </small>
                  </div>
                  <div className="cart-row-actions">
                    <strong>{formatMoney(item.cantidad * item.precio_unitario)}</strong>
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => removeFromSaleCart(item.producto_id)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-note">El carrito está vacío.</p>
          )}

          <div className="cart-total">
            <span>Total</span>
            <strong>{formatMoney(saleCartTotal)}</strong>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="panel-header">
          <h2>Historial de ventas</h2>
          <select
            className="header-select"
            value={ventasCategoryId}
            onChange={(event) => setVentasCategoryId(event.target.value)}
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={String(categoria.id)}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {ventas.length ? (
                ventas.map((venta) => (
                  <tr key={`${venta.id}-${venta.item_id}`}>
                    <td>{venta.fecha}</td>
                    <td>{venta.producto}</td>
                    <td>{venta.cantidad}</td>
                    <td>{formatMoney(venta.precio_unitario)}</td>
                    <td>{formatMoney(venta.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-row">
                    Sin ventas registradas aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  )
}
