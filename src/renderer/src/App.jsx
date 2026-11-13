import { useState } from 'react'
import PageHeader from './components/PageHeader'
import Toast from './components/Toast'
import { useInventoryData, emptyProductForm } from './hooks/useInventoryData'
import ComprasPage from './pages/ComprasPage'
import ConfiguracionPage from './pages/ConfiguracionPage'
import DashboardPage from './pages/DashboardPage'
import GastosPage from './pages/GastosPage'
import ProductosPage from './pages/ProductosPage'
import ReportesPage from './pages/ReportesPage'
import VentasPage from './pages/VentasPage'
import { monthLabel, thisMonth, looksLikeError } from './utils/format'

const PAGE_TITLES = {
  dashboard: { title: 'Resumen', subtitle: 'Cómo va tu negocio' },
  productos: { title: 'Productos', subtitle: 'Catálogo, precios y stock' },
  ventas: { title: 'Ventas', subtitle: 'Registra y consulta tus ventas' },
  compras: { title: 'Compras', subtitle: 'Entradas de mercancía y ajustes de stock' },
  gastos: { title: 'Gastos', subtitle: 'Gastos operativos del negocio' },
  reportes: { title: 'Reportes', subtitle: 'Balance mensual y productos más vendidos' },
  configuracion: { title: 'Configuración', subtitle: 'Nombre, logo y colores' }
}

const NAV_ITEMS = [
  ['dashboard', 'Resumen'],
  ['productos', 'Productos'],
  ['ventas', 'Ventas'],
  ['compras', 'Compras'],
  ['gastos', 'Gastos'],
  ['reportes', 'Reportes'],
  ['configuracion', 'Configuración']
]

function App() {
  const {
    tab,
    setTab,
    categorias,
    productos,
    ventas,
    ventasCategoryId,
    setVentasCategoryId,
    report,
    reportCategoryId,
    setReportCategoryId,
    status,
    categoryName,
    setCategoryName,
    setSelectedCategoryId,
    productSearch,
    setProductSearch,
    productSortBy,
    setProductSortBy,
    showInactiveProducts,
    setShowInactiveProducts,
    reportMonth,
    setReportMonth,
    productForm,
    setProductForm,
    saleForm,
    setSaleForm,
    purchaseForm,
    setPurchaseForm,
    expenseForm,
    setExpenseForm,
    gastos,
    adjustmentForm,
    setAdjustmentForm,
    recentAdjustments,
    pendingDelete,
    setPendingDelete,
    confirmation,
    setConfirmation,
    saleCart,
    purchaseCart,
    branding,
    setBranding,
    selectedCategoryForProducts,
    categoriaActual,
    productosActivos,
    productosStockBajo,
    productosPorCategoria,
    saleCartTotal,
    purchaseCartTotal,
    handleLogoUpload,
    handleResetBranding,
    handleCreateCategory,
    handleEditProduct,
    handleToggleProduct,
    handleDeleteProduct,
    handleDeleteCategory,
    handleProductSubmit,
    addToSaleCart,
    removeFromSaleCart,
    handleSaleSubmit,
    handleDeleteSale,
    addToPurchaseCart,
    removeFromPurchaseCart,
    handlePurchaseSubmit,
    handleExpenseSubmit,
    handleAdjustmentSubmit,
    formatMoneyInput,
    parseMoneyInput
  } = useInventoryData()

  const stockAlerts = productosStockBajo.map((producto) => ({
    ...producto,
    estado: Number(producto.stock ?? 0) === 0 ? 'agotado' : 'bajo'
  }))

  const page = PAGE_TITLES[tab] || PAGE_TITLES.dashboard
  const pageSubtitle =
    tab === 'dashboard' || tab === 'reportes'
      ? `${page.subtitle} · ${monthLabel(reportMonth)}`
      : page.subtitle
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          {branding.logoDataUrl ? (
            <img className="brand-logo" src={branding.logoDataUrl} alt="Logo de la empresa" />
          ) : (
            <div className="brand-logo placeholder">
              {branding.nombreEmpresa?.slice(0, 2).toUpperCase() || 'IN'}
            </div>
          )}
          <h2>{branding.nombreEmpresa || 'Inventario'}</h2>
        </div>

        <nav className="nav-tabs" aria-label="Navegación principal">
          {NAV_ITEMS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? 'tab-button active' : 'tab-button'}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <div className="content-inner">
          <div className="topbar-actions">
            <div className="notification-wrapper">
              <button
                type="button"
                className="notification-toggle"
                aria-label="Notificaciones de stock"
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9" />
                </svg>
                {stockAlerts.length > 0 && <span className="notification-dot" />}
              </button>

              {notificationsOpen && stockAlerts.length > 0 && (
                <div className="notification-panel" aria-live="polite">
                  {stockAlerts.map((producto) => (
                    <div
                      key={producto.id}
                      className={`notification-item ${
                        producto.estado === 'agotado' ? 'is-alert' : ''
                      }`}
                    >
                      <div>
                        <strong>{producto.nombre}</strong>
                        <small>{producto.stock} unidades</small>
                      </div>
                      <span>{producto.estado === 'agotado' ? 'Agotado' : 'Stock bajo'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <PageHeader title={page.title} subtitle={pageSubtitle}>
            {tab === 'reportes' && (
              <div className="header-actions">
                <label>
                  Mes
                  <input
                    type="month"
                    value={reportMonth}
                    onChange={(event) => setReportMonth(event.target.value || thisMonth())}
                  />
                </label>
                <label>
                  Categoría
                  <select
                    value={reportCategoryId}
                    onChange={(event) => setReportCategoryId(event.target.value)}
                  >
                    <option value="">General</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={String(categoria.id)}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </PageHeader>

          {tab === 'dashboard' && (
            <DashboardPage
              report={report}
              productosStockBajo={productosStockBajo}
              ventas={ventas}
              setTab={setTab}
            />
          )}

          {tab === 'productos' && (
            <ProductosPage
              categorias={categorias}
              selectedCategoryForProducts={selectedCategoryForProducts}
              setSelectedCategoryId={setSelectedCategoryId}
              categoryName={categoryName}
              setCategoryName={setCategoryName}
              handleCreateCategory={handleCreateCategory}
              productSearch={productSearch}
              setProductSearch={setProductSearch}
              productSortBy={productSortBy}
              setProductSortBy={setProductSortBy}
              showInactiveProducts={showInactiveProducts}
              setShowInactiveProducts={setShowInactiveProducts}
              categoriaActual={categoriaActual}
              productosPorCategoria={productosPorCategoria}
              pendingDelete={pendingDelete}
              setPendingDelete={setPendingDelete}
              handleDeleteCategory={handleDeleteCategory}
              handleEditProduct={handleEditProduct}
              handleToggleProduct={handleToggleProduct}
              handleDeleteProduct={handleDeleteProduct}
              productForm={productForm}
              setProductForm={setProductForm}
              emptyProductForm={emptyProductForm}
              handleProductSubmit={handleProductSubmit}
              formatMoneyInput={formatMoneyInput}
              parseMoneyInput={parseMoneyInput}
            />
          )}

          {tab === 'ventas' && (
            <VentasPage
              productos={productos}
              productosActivos={productosActivos}
              saleForm={saleForm}
              setSaleForm={setSaleForm}
              addToSaleCart={addToSaleCart}
              handleSaleSubmit={handleSaleSubmit}
              handleDeleteSale={handleDeleteSale}
              saleCart={saleCart}
              removeFromSaleCart={removeFromSaleCart}
              saleCartTotal={saleCartTotal}
              ventas={ventas}
              setVentasCategoryId={setVentasCategoryId}
              categorias={categorias}
              ventasCategoryId={ventasCategoryId}
            />
          )}

          {tab === 'compras' && (
            <ComprasPage
              productos={productos}
              productosActivos={productosActivos}
              purchaseForm={purchaseForm}
              setPurchaseForm={setPurchaseForm}
              addToPurchaseCart={addToPurchaseCart}
              handlePurchaseSubmit={handlePurchaseSubmit}
              purchaseCart={purchaseCart}
              removeFromPurchaseCart={removeFromPurchaseCart}
              purchaseCartTotal={purchaseCartTotal}
              adjustmentForm={adjustmentForm}
              setAdjustmentForm={setAdjustmentForm}
              handleAdjustmentSubmit={handleAdjustmentSubmit}
              recentAdjustments={recentAdjustments}
            />
          )}

          {tab === 'gastos' && (
            <GastosPage
              expenseForm={expenseForm}
              setExpenseForm={setExpenseForm}
              handleExpenseSubmit={handleExpenseSubmit}
              gastos={gastos}
            />
          )}

          {tab === 'reportes' && <ReportesPage report={report} />}

          {tab === 'configuracion' && (
            <ConfiguracionPage
              branding={branding}
              setBranding={setBranding}
              handleLogoUpload={handleLogoUpload}
              handleResetBranding={handleResetBranding}
            />
          )}
        </div>
      </main>

      {confirmation ? (
        <div className="modal-overlay" onClick={() => setConfirmation(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{confirmation.title || 'Confirmación'}</h3>
              <button type="button" className="modal-close" onClick={() => setConfirmation(null)}>
                ×
              </button>
            </div>
            <p className="modal-message">{confirmation.message}</p>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setConfirmation(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  if (confirmation.onConfirm) confirmation.onConfirm()
                }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {status ? <Toast message={status} isError={looksLikeError(status)} /> : null}
    </div>
  )
}

export default App
