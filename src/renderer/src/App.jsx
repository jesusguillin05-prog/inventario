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
    selectedCategoryId,
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
    adjustmentForm,
    setAdjustmentForm,
    pendingDelete,
    setPendingDelete,
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
    addToPurchaseCart,
    removeFromPurchaseCart,
    handlePurchaseSubmit,
    handleExpenseSubmit,
    handleAdjustmentSubmit,
    formatMoneyInput,
    parseMoneyInput
  } = useInventoryData()

  const page = PAGE_TITLES[tab] || PAGE_TITLES.dashboard
  const pageSubtitle =
    tab === 'dashboard' || tab === 'reportes'
      ? `${page.subtitle} · ${monthLabel(reportMonth)}`
      : page.subtitle

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
              selectedCategoryId={selectedCategoryId}
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
            />
          )}

          {tab === 'gastos' && (
            <GastosPage
              expenseForm={expenseForm}
              setExpenseForm={setExpenseForm}
              handleExpenseSubmit={handleExpenseSubmit}
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

      {status ? <Toast message={status} isError={looksLikeError(status)} /> : null}
    </div>
  )
}

export default App
