import { useState } from 'react'
import PropTypes from 'prop-types'
import Panel from '../components/Panel'
import { formatMoney, normalizeInputValue } from '../utils/format'

export default function VentasPage({
  productosActivos,
  saleForm,
  setSaleForm,
  addToSaleCart,
  handleSaleSubmit,
  handleDeleteSale,
  saleCart,
  removeFromSaleCart,
  saleCartTotal,
  ventas,
  setVentasCategoryId,
  categorias,
  ventasCategoryId
}) {
  const [productSearchText, setProductSearchText] = useState('')
  const selectedProduct = productosActivos.find(
    (producto) => String(producto.id) === String(saleForm.producto_id)
  )
  const productInputValue = selectedProduct ? selectedProduct.nombre : productSearchText

  return (
    <section className="split-layout">
      <Panel>
        <div className="panel-header">
          <h2>Carrito de venta</h2>
        </div>

        <form
          className="stack-form"
          onSubmit={(event) => {
            handleSaleSubmit(event)
            setProductSearchText('')
          }}
        >
          <label>
            Producto
            <input
              list="productos-venta"
              value={productInputValue}
              onChange={(event) => {
                const nombre = event.target.value
                setProductSearchText(nombre)

                const producto = productosActivos.find(
                  (item) => item.nombre.toLowerCase() === nombre.trim().toLowerCase()
                )

                setSaleForm((current) => ({
                  ...current,
                  producto_id: producto ? String(producto.id) : '',
                  precio_unitario: producto ? producto.precio : current.precio_unitario
                }))
              }}
              placeholder="Escribe el nombre del producto"
            />
            <datalist id="productos-venta">
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
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                addToSaleCart()
                setProductSearchText('')
              }}
            >
              Agregar al carrito
            </button>
            <button type="submit" className="primary-btn">
              Registrar venta
            </button>
          </div>
        </form>

        {saleCart.length ? (
          <div className="cart-summary">
            <div className="cart-header">
              <strong>Resumen</strong>
              <span>{saleCart.length} producto(s)</span>
            </div>

            <div className="cart-list">
              {saleCart.map((item) => (
                <div key={item.cartId ?? item.producto_id} className="cart-row">
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
                      onClick={() => removeFromSaleCart(item)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-total">
              <span>Total</span>
              <strong>{formatMoney(saleCartTotal)}</strong>
            </div>
          </div>
        ) : (
          <div className="empty-note">El carrito está vacío. Agrega productos para comenzar la venta.</div>
        )}
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
                <th>Acción</th>
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
                    <td>
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => handleDeleteSale(venta.item_id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-row">
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

VentasPage.propTypes = {
  productos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      nombre: PropTypes.string,
      precio: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
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
  saleForm: PropTypes.shape({
    producto_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    precio_unitario: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }).isRequired,
  setSaleForm: PropTypes.func.isRequired,
  addToSaleCart: PropTypes.func.isRequired,
  handleSaleSubmit: PropTypes.func.isRequired,
  handleDeleteSale: PropTypes.func.isRequired,
  saleCart: PropTypes.arrayOf(
    PropTypes.shape({
      producto_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      nombre: PropTypes.string,
      cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      precio_unitario: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  ).isRequired,
  removeFromSaleCart: PropTypes.func.isRequired,
  saleCartTotal: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  ventas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      item_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      fecha: PropTypes.string,
      producto: PropTypes.string,
      cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      precio_unitario: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      total: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  ).isRequired,
  setVentasCategoryId: PropTypes.func.isRequired,
  categorias: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      nombre: PropTypes.string
    })
  ).isRequired,
  ventasCategoryId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}
