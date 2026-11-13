import PropTypes from 'prop-types'
import Panel from '../components/Panel'
import { formatMoney, normalizeInputValue } from '../utils/format'

export default function ProductosPage({
  categorias,
  selectedCategoryForProducts,
  setSelectedCategoryId,
  categoryName,
  setCategoryName,
  handleCreateCategory,
  productSearch,
  setProductSearch,
  productSortBy,
  setProductSortBy,
  showInactiveProducts,
  setShowInactiveProducts,
  categoriaActual,
  productosPorCategoria,
  pendingDelete,
  setPendingDelete,
  handleDeleteCategory,
  handleEditProduct,
  handleToggleProduct,
  handleDeleteProduct,
  productForm,
  setProductForm,
  emptyProductForm,
  handleProductSubmit,
  formatMoneyInput,
  parseMoneyInput
}) {
  return (
    <Panel>
      <div className="panel-header products-header">
        <div className="category-selector">
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              type="button"
              className={
                selectedCategoryForProducts === String(categoria.id) ? 'chip active' : 'chip'
              }
              onClick={() => setSelectedCategoryId(String(categoria.id))}
            >
              {categoria.nombre}
            </button>
          ))}
        </div>

        <form className="inline-form" onSubmit={handleCreateCategory}>
          <input
            value={normalizeInputValue(categoryName)}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="Nueva categoría"
          />
          <button type="submit" className="primary-btn small-btn">
            + Categoría
          </button>
        </form>
      </div>

      {categoriaActual ? (
        <>
          <div className="toolbar">
            <label className="toolbar-grow">
              Buscar producto
              <input
                value={normalizeInputValue(productSearch)}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Nombre o categoría"
              />
            </label>
            <label className="toolbar-sort">
              Ordenar por
              <select value={productSortBy} onChange={(event) => setProductSortBy(event.target.value)}>
                <option value="nombre">Nombre</option>
                <option value="precio">Precio</option>
                <option value="stock">Stock</option>
                <option value="costo">Costo</option>
              </select>
            </label>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setShowInactiveProducts((actual) => !actual)}
            >
              {showInactiveProducts ? 'Ocultar inactivos' : 'Ver inactivos'}
            </button>
          </div>

          <div className="product-layout">
            <div className="list-panel">
              <div className="list-panel-header">
                <h3>{categoriaActual.nombre}</h3>
                {pendingDelete === `categoria:${categoriaActual.id}` ? (
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="secondary-btn danger-btn small-btn"
                      onClick={handleDeleteCategory}
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      className="secondary-btn small-btn"
                      onClick={() => setPendingDelete(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="secondary-btn danger-btn small-btn"
                    onClick={handleDeleteCategory}
                  >
                    Eliminar categoría
                  </button>
                )}
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Costo</th>
                    <th>Precio</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosPorCategoria.length ? (
                    productosPorCategoria.map((producto) => (
                      <tr key={producto.id}>
                        <td>
                          <div>
                            {producto.nombre}
                            {Number(producto.activo) !== 1 ? (
                              <span className="badge">Inactivo</span>
                            ) : null}
                          </div>
                        </td>
                        <td>{producto.stock}</td>
                        <td>{formatMoney(producto.costo)}</td>
                        <td>{formatMoney(producto.precio)}</td>
                        <td>
                          <div className="inline-actions nowrap">
                            <button
                              type="button"
                              className="secondary-btn small-btn"
                              onClick={() => handleEditProduct(producto)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="secondary-btn small-btn"
                              onClick={() =>
                                handleToggleProduct(
                                  producto.id,
                                  Number(producto.activo) === 1 ? 0 : 1
                                )
                              }
                            >
                              {Number(producto.activo) === 1 ? 'Desactivar' : 'Activar'}
                            </button>
                            {pendingDelete === `producto:${producto.id}` ? (
                              <>
                                <button
                                  type="button"
                                  className="secondary-btn danger-btn small-btn"
                                  onClick={() => handleDeleteProduct(producto)}
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  className="secondary-btn small-btn"
                                  onClick={() => setPendingDelete(null)}
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="secondary-btn danger-btn small-btn"
                                onClick={() => handleDeleteProduct(producto)}
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="empty-cell">
                        No hay productos para esta búsqueda o categoría.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <form className="stack-form side-form" onSubmit={handleProductSubmit}>
              <h3>{productForm.id ? 'Editar producto' : 'Agregar producto'}</h3>
              <label>
                Nombre
                <input
                  value={normalizeInputValue(productForm.nombre)}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, nombre: event.target.value }))
                  }
                  placeholder="Nombre"
                />
              </label>

              <div className="field-row two-col">
                <label>
                  Costo del lote
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatMoneyInput(productForm.costo)}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        costo: parseMoneyInput(event.target.value)
                      }))
                    }
                  />
                </label>
                <label>
                  Precio sugerido
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatMoneyInput(productForm.precio)}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        precio: parseMoneyInput(event.target.value)
                      }))
                    }
                  />
                </label>
              </div>

              {!productForm.id && (
                <div className="field-row two-col">
                  <label>
                    Stock mínimo
                    <input
                      type="number"
                      min="0"
                      value={normalizeInputValue(productForm.stock_minimo)}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          stock_minimo: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label>
                    Stock inicial
                    <input
                      type="number"
                      min="0"
                      value={normalizeInputValue(productForm.stock_inicial)}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          stock_inicial: event.target.value
                        }))
                      }
                      placeholder="0"
                    />
                  </label>
                </div>
              )}

              {productForm.id && (
                <small className="muted">
                  El stock real se actualiza con compras, ventas y ajustes de inventario, no
                  desde la edición del producto.
                </small>
              )}

              <div className="inline-actions">
                <button type="submit" className="primary-btn">
                  {productForm.id ? 'Actualizar producto' : 'Guardar producto'}
                </button>
                {productForm.id ? (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setProductForm(emptyProductForm)}
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </>
      ) : (
        <p className="empty-note">Crea una categoría para empezar a registrar productos.</p>
      )}
    </Panel>
  )
}

ProductosPage.propTypes = {
  categorias: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      nombre: PropTypes.string
    })
  ).isRequired,
  selectedCategoryForProducts: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  setSelectedCategoryId: PropTypes.func.isRequired,
  categoryName: PropTypes.string,
  setCategoryName: PropTypes.func.isRequired,
  handleCreateCategory: PropTypes.func.isRequired,
  productSearch: PropTypes.string,
  setProductSearch: PropTypes.func.isRequired,
  productSortBy: PropTypes.string,
  setProductSortBy: PropTypes.func.isRequired,
  showInactiveProducts: PropTypes.bool,
  setShowInactiveProducts: PropTypes.func.isRequired,
  categoriaActual: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    nombre: PropTypes.string
  }),
  productosPorCategoria: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      nombre: PropTypes.string,
      stock: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      costo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      precio: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      activo: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  ).isRequired,
  pendingDelete: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.bool]),
  setPendingDelete: PropTypes.func.isRequired,
  handleDeleteCategory: PropTypes.func.isRequired,
  handleEditProduct: PropTypes.func.isRequired,
  handleToggleProduct: PropTypes.func.isRequired,
  handleDeleteProduct: PropTypes.func.isRequired,
  productForm: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    nombre: PropTypes.string,
    costo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    precio: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    stock_minimo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    stock_inicial: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }).isRequired,
  setProductForm: PropTypes.func.isRequired,
  emptyProductForm: PropTypes.shape({
    nombre: PropTypes.string,
    costo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    precio: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    stock_minimo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    stock_inicial: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }).isRequired,
  handleProductSubmit: PropTypes.func.isRequired,
  formatMoneyInput: PropTypes.func.isRequired,
  parseMoneyInput: PropTypes.func.isRequired
}
