import { useCallback, useEffect, useMemo, useState } from 'react'

// Fecha LOCAL (toISOString usa UTC y en Colombia, después de las 7 pm, daría el día siguiente)
const pad = (n) => String(n).padStart(2, '0')
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const thisMonth = () => today().slice(0, 7)

const formatMoney = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const formatNumber = (value) => Number(value || 0).toLocaleString('es-CO')

const monthLabel = (month) => {
  const [y, m] = String(month).split('-').map(Number)
  if (!y || !m) return ''
  return new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
}

// Quita el prefijo "Error invoking remote method ..." que agrega Electron
const errorMessage = (error, fallback) =>
  (error?.message || fallback).replace(/^Error invoking remote method '[^']+': (Error: )?/, '')

const looksLikeError = (message) =>
  /no se pudo|error|insuficiente|obligatori|completa|primero|selecciona|escribe|debe|tiene ventas/i.test(
    message
  )

const PAGE_TITLES = {
  dashboard: { title: 'Resumen', subtitle: 'Cómo va tu negocio' },
  productos: { title: 'Productos', subtitle: 'Catálogo, precios y stock' },
  ventas: { title: 'Ventas', subtitle: 'Registra y consulta tus ventas' },
  compras: { title: 'Compras', subtitle: 'Entradas de mercancía y ajustes de stock' },
  gastos: { title: 'Gastos', subtitle: 'Gastos operativos del negocio' },
  reportes: { title: 'Reportes', subtitle: 'Balance mensual y productos más vendidos' },
  configuracion: { title: 'Configuración', subtitle: 'Nombre, logo y colores' }
}

const emptyProductForm = {
  sku: '',
  nombre: '',
  costo: '',
  precio: '',
  stock_minimo: '',
  stock_inicial: ''
}

const emptySaleForm = {
  producto_id: '',
  cantidad: 1,
  precio_unitario: ''
}

const emptyPurchaseForm = {
  producto_id: '',
  cantidad: 1,
  costo_unitario: ''
}

const emptyExpenseForm = {
  fecha: today(),
  categoria: 'transporte',
  descripcion: '',
  monto: ''
}

const emptyAdjustmentForm = {
  producto_id: '',
  cantidad: 1,
  nota: ''
}

const defaultReport = {
  ingresos: 0,
  costoVendido: 0,
  utilidadBruta: 0,
  gastosOperativos: 0,
  utilidadNeta: 0,
  comprasDelMes: 0,
  valorInventario: 0,
  masVendidos: []
}

const defaultBranding = {
  nombreEmpresa: 'Inventario',
  primaryColor: '#38bdf8',
  secondaryColor: '#2d7df6',
  backgroundColor: '#0d1b2a',
  textColor: '#e2e8f0',
  logoDataUrl: ''
}

const colorPresets = [
  { nombre: 'Azul tech', primaryColor: '#38bdf8', secondaryColor: '#2d7df6', backgroundColor: '#0d1b2a', textColor: '#e2e8f0' },
  { nombre: 'Verde luxe', primaryColor: '#34d399', secondaryColor: '#10b981', backgroundColor: '#0f172a', textColor: '#ecfeff' },
  { nombre: 'Violeta soft', primaryColor: '#a78bfa', secondaryColor: '#8b5cf6', backgroundColor: '#111827', textColor: '#f5f3ff' },
  { nombre: 'Rojo premium', primaryColor: '#f87171', secondaryColor: '#ef4444', backgroundColor: '#1f2937', textColor: '#fef2f2' }
]

const normalizeInputValue = (value) => (value === undefined || value === null ? '' : value)

const formatMoneyInput = (value) => {
  if (value === '' || value === null || value === undefined) return ''
  const digits = String(value).replace(/[^\d]/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('es-CO')
}

const parseMoneyInput = (value) => String(value ?? '').replace(/[^\d]/g, '')

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
  const [tab, setTab] = useState('dashboard')
  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [ventas, setVentas] = useState([])
  const [ventasCategoryId, setVentasCategoryId] = useState('')
  const [report, setReport] = useState(defaultReport)
  const [reportCategoryId, setReportCategoryId] = useState('')
  const [status, setStatus] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productSortBy, setProductSortBy] = useState('nombre')
  const [showInactiveProducts, setShowInactiveProducts] = useState(false)
  const [reportMonth, setReportMonth] = useState(thisMonth())
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [saleForm, setSaleForm] = useState(emptySaleForm)
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm)
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm)
  const [adjustmentForm, setAdjustmentForm] = useState(emptyAdjustmentForm)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [saleCart, setSaleCart] = useState([])
  const [purchaseCart, setPurchaseCart] = useState([])
  const [branding, setBranding] = useState(() => {
    if (typeof window === 'undefined') return defaultBranding

    try {
      const stored = JSON.parse(window.localStorage.getItem('inventario-branding') || 'null')
      return stored ? { ...defaultBranding, ...stored } : defaultBranding
    } catch {
      return defaultBranding
    }
  })

  const selectedCategoryForProducts = useMemo(() => {
    if (!categorias.length) return ''

    if (
      selectedCategoryId &&
      categorias.some((categoria) => String(categoria.id) === String(selectedCategoryId))
    ) {
      return selectedCategoryId
    }

    return String(categorias[0].id)
  }, [categorias, selectedCategoryId])

  const categoriaActual = useMemo(
    () =>
      categorias.find(
        (categoria) => String(categoria.id) === String(selectedCategoryForProducts)
      ) || null,
    [categorias, selectedCategoryForProducts]
  )

  // Todos los productos activos (para los selectores de ventas/compras y los conteos)
  const productosActivos = useMemo(
    () => productos.filter((producto) => Number(producto.activo) === 1),
    [productos]
  )

  // Productos que llegaron o bajaron del stock mínimo (solo si tienen un mínimo definido)
  const productosStockBajo = useMemo(
    () =>
      productosActivos.filter(
        (producto) =>
          Number(producto.stock_minimo) > 0 && Number(producto.stock) <= Number(producto.stock_minimo)
      ),
    [productosActivos]
  )

  // Lista que se muestra en la tabla de Productos (categoría + búsqueda + orden)
  const productosPorCategoria = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    const lista = productos.filter((producto) => {
      if (!showInactiveProducts && Number(producto.activo) !== 1) return false
      if (
        selectedCategoryForProducts &&
        String(producto.categoria_id) !== String(selectedCategoryForProducts)
      )
        return false
      if (!q) return true
      return [producto.nombre, producto.sku, producto.categoria].some((v) =>
        String(v ?? '')
          .toLowerCase()
          .includes(q)
      )
    })
    return lista.sort((x, y) =>
      productSortBy === 'nombre'
        ? String(x.nombre).localeCompare(String(y.nombre), 'es')
        : Number(x[productSortBy] ?? 0) - Number(y[productSortBy] ?? 0)
    )
  }, [productos, selectedCategoryForProducts, productSearch, productSortBy, showInactiveProducts])

  // Carga TODO una sola vez (y después de cada acción). Los filtros se aplican arriba, en memoria.
  const loadData = useCallback(async () => {
    try {
      const [categoriasData, productosData, ventasData, resumenData] = await Promise.all([
        window.api.categorias.listar(),
        window.api.productos.listar({ includeInactive: true }),
        window.api.ventas.listar(ventasCategoryId || null),
        window.api.reportes.mensual(reportMonth, reportCategoryId || null)
      ])

      setCategorias(categoriasData)
      setProductos(productosData)
      setVentas(ventasData)
      setReport(resumenData)
    } catch (error) {
      setStatus(errorMessage(error, 'Error al cargar los datos'))
    }
  }, [reportCategoryId, reportMonth, ventasCategoryId])

  useEffect(() => {
    window.localStorage.setItem('inventario-branding', JSON.stringify(branding))
  }, [branding])

  // Los colores se aplican en <html> (así también llegan al fondo del <body>)
  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--primary', branding.primaryColor)
    root.setProperty('--primary-strong', branding.secondaryColor)
    root.setProperty('--bg-1', branding.backgroundColor)
    root.setProperty('--bg-2', branding.backgroundColor)
    root.setProperty('--text', branding.textColor)
  }, [branding])

  // El aviso (toast) desaparece solo
  useEffect(() => {
    if (!status) return undefined
    const timeoutId = setTimeout(() => setStatus(''), 4000)
    return () => clearTimeout(timeoutId)
  }, [status])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadData()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [loadData])

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setBranding((current) => ({ ...current, logoDataUrl: String(reader.result || '') }))
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleResetBranding = () => {
    setBranding(defaultBranding)
  }

  const handleCreateCategory = async (event) => {
    event.preventDefault()

    if (!categoryName.trim()) {
      setStatus('Escribe un nombre para la categoría')
      return
    }

    try {
      const categoriaId = await window.api.categorias.crear({ nombre: categoryName.trim() })
      setCategoryName('')
      setStatus('Categoría creada correctamente')
      const categoriasActualizadas = await window.api.categorias.listar()
      setCategorias(categoriasActualizadas)
      setSelectedCategoryId(String(categoriaId))
      setTab('productos')
    } catch (error) {
      setStatus(errorMessage(error, 'No se pudo crear la categoría'))
    }
  }

  const handleEditProduct = (producto) => {
    setProductForm({
      id: String(producto.id),
      sku: producto.sku || '',
      nombre: producto.nombre || '',
      costo: producto.costo ?? '',
      precio: producto.precio ?? '',
      stock_minimo: producto.stock_minimo ?? '',
      stock_inicial: ''
    })
    setSelectedCategoryId(String(producto.categoria_id ?? selectedCategoryForProducts))
  }

  const handleToggleProduct = async (productoId, activo) => {
    try {
      await window.api.productos.toggle({ id: Number(productoId), activo: Number(activo) })
      setStatus(activo ? 'Producto reactivado' : 'Producto desactivado')
      setProductForm(emptyProductForm)
      await loadData()
    } catch (error) {
      setStatus(errorMessage(error, 'No se pudo cambiar el estado del producto'))
    }
  }

  // Eliminar con confirmación en pantalla, sin usar window.confirm
  // (en Windows confirm() deja los inputs de Electron bloqueados hasta cambiar de ventana)
  const askToDelete = (key) => {
    setPendingDelete(key)
    setTimeout(() => setPendingDelete((actual) => (actual === key ? null : actual)), 4000)
  }

  const handleDeleteProduct = async (producto) => {
    const key = `producto:${producto.id}`
    if (pendingDelete !== key) {
      askToDelete(key)
      return
    }

    try {
      await window.api.productos.eliminar({ id: producto.id })
      setStatus('Producto eliminado')
      if (String(productForm.id) === String(producto.id)) setProductForm(emptyProductForm)
    } catch (error) {
      setStatus(errorMessage(error, 'No se pudo eliminar el producto'))
    }
    setPendingDelete(null)
    await loadData()
  }

  const handleDeleteCategory = async () => {
    if (!categoriaActual) return
    const key = `categoria:${categoriaActual.id}`
    if (pendingDelete !== key) {
      askToDelete(key)
      return
    }

    try {
      await window.api.categorias.eliminar({ id: categoriaActual.id })
      setStatus('Categoría eliminada')
    } catch (error) {
      setStatus(errorMessage(error, 'No se pudo eliminar la categoría'))
    }
    setPendingDelete(null)
    await loadData()
  }

  const handleProductSubmit = async (event) => {
    event.preventDefault()

    if (!selectedCategoryId) {
      setStatus('Primero crea o selecciona una categoría')
      return
    }

    const stockInicial = Number(productForm.stock_inicial || 0)
    const costoLote = Number(productForm.costo || 0)
    const precioUnitario = Number(productForm.precio || 0)

    const payload = {
      id: productForm.id ? Number(productForm.id) : null,
      sku: productForm.sku.trim(),
      nombre: productForm.nombre.trim(),
      categoria_id: Number(selectedCategoryId),
      costo: costoLote,
      precio: precioUnitario,
      stock_minimo: Number(productForm.stock_minimo || 0),
      stock_inicial: productForm.id ? 0 : stockInicial
    }

    if (!payload.nombre) {
      setStatus('El nombre del producto es obligatorio')
      return
    }

    try {
      if (payload.id) {
        await window.api.productos.actualizar(payload)
        setStatus('Producto actualizado correctamente')
      } else {
        await window.api.productos.crear(payload)
        setStatus('Producto agregado correctamente')
      }

      setProductForm(emptyProductForm)
      await loadData()
    } catch (error) {
      setStatus(errorMessage(error, 'No se pudo guardar el producto'))
    }
  }

  const addToSaleCart = () => {
    if (!saleForm.producto_id || !saleForm.cantidad || !saleForm.precio_unitario) {
      setStatus('Completa producto, cantidad y precio de venta')
      return
    }

    const producto = productosActivos.find(
      (item) => String(item.id) === String(saleForm.producto_id)
    )
    if (!producto) {
      setStatus('Selecciona un producto válido')
      return
    }

    const cantidad = Number(saleForm.cantidad)
    const precio = Number(saleForm.precio_unitario)
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setStatus('La cantidad debe ser un número entero mayor a 0')
      return
    }
    if (precio <= 0) {
      setStatus('El precio de venta debe ser mayor a 0')
      return
    }

    setSaleCart((current) => {
      const existing = current.find((item) => String(item.producto_id) === String(producto.id))
      if (existing) {
        return current.map((item) =>
          String(item.producto_id) === String(producto.id)
            ? { ...item, cantidad: item.cantidad + cantidad, precio_unitario: precio }
            : item
        )
      }
      return [
        ...current,
        {
          producto_id: Number(producto.id),
          nombre: producto.nombre,
          cantidad,
          precio_unitario: precio,
          stock: Number(producto.stock ?? 0)
        }
      ]
    })

    setStatus('Producto agregado al carrito')
    setSaleForm(emptySaleForm)
  }

  const removeFromSaleCart = (productoId) => {
    setSaleCart((current) => current.filter((item) => String(item.producto_id) !== String(productoId)))
  }

  const saleCartTotal = useMemo(
    () =>
      saleCart.reduce(
        (sum, item) => sum + Number(item.cantidad || 0) * Number(item.precio_unitario || 0),
        0
      ),
    [saleCart]
  )

  const handleSaleSubmit = async (event) => {
    event.preventDefault()

    if (!saleCart.length) {
      setStatus('Agrega al menos un producto al carrito')
      return
    }

    try {
      await window.api.ventas.crear({
        fecha: today(),
        metodo_pago: 'efectivo',
        items: saleCart.map((item) => ({
          producto_id: Number(item.producto_id),
          cantidad: Number(item.cantidad),
          precio_unitario: Number(item.precio_unitario)
        }))
      })

      setStatus('Venta registrada con éxito')
      setSaleCart([])
      setSaleForm(emptySaleForm)
      await loadData()
    } catch (error) {
      setStatus(errorMessage(error, 'No se pudo registrar la venta'))
    }
  }

  const addToPurchaseCart = () => {
    if (!purchaseForm.producto_id || !purchaseForm.cantidad || !purchaseForm.costo_unitario) {
      setStatus('Completa producto, cantidad y costo del lote')
      return
    }

    const producto = productosActivos.find(
      (item) => String(item.id) === String(purchaseForm.producto_id)
    )
    if (!producto) {
      setStatus('Selecciona un producto válido')
      return
    }

    const cantidad = Number(purchaseForm.cantidad)
    const costoLote = Number(purchaseForm.costo_unitario || 0)
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setStatus('La cantidad debe ser un número entero mayor a 0')
      return
    }
    if (costoLote <= 0) {
      setStatus('El costo del lote debe ser mayor a cero')
      return
    }

    setPurchaseCart((current) => {
      const existing = current.find((item) => String(item.producto_id) === String(producto.id))
      if (existing) {
        return current.map((item) =>
          String(item.producto_id) === String(producto.id)
            ? { ...item, cantidad: item.cantidad + cantidad, costo_unitario: costoLote }
            : item
        )
      }
      return [
        ...current,
        {
          producto_id: Number(producto.id),
          nombre: producto.nombre,
          cantidad,
          costo_unitario: costoLote
        }
      ]
    })

    setStatus('Producto agregado al carrito de compras')
    setPurchaseForm(emptyPurchaseForm)
  }

  const removeFromPurchaseCart = (productoId) => {
    setPurchaseCart((current) =>
      current.filter((item) => String(item.producto_id) !== String(productoId))
    )
  }

  const purchaseCartTotal = useMemo(
    () =>
      purchaseCart.reduce(
        (sum, item) => sum + Number(item.cantidad || 0) * Number(item.costo_unitario || 0),
        0
      ),
    [purchaseCart]
  )

  const handlePurchaseSubmit = async (event) => {
    event.preventDefault()

    const items = purchaseCart.length
      ? purchaseCart.map((item) => ({
          producto_id: Number(item.producto_id),
          cantidad: Number(item.cantidad),
          costo_unitario: Number(item.costo_unitario)
        }))
      : [
          {
            producto_id: Number(purchaseForm.producto_id),
            cantidad: Number(purchaseForm.cantidad),
            costo_unitario: Number(purchaseForm.costo_unitario || 0)
          }
        ]

    if (!items.length || !items[0]?.producto_id || !items[0]?.cantidad || !items[0]?.costo_unitario) {
      setStatus('Completa producto, cantidad y costo del lote')
      return
    }

    try {
      await window.api.compras.crear({
        fecha: today(),
        proveedor_id: null,
        items
      })

      setStatus('Compra registrada correctamente')
      setPurchaseCart([])
      setPurchaseForm(emptyPurchaseForm)
      await loadData()
    } catch (error) {
      setStatus(errorMessage(error, 'No se pudo registrar la compra'))
    }
  }

  const handleExpenseSubmit = async (event) => {
    event.preventDefault()

    try {
      await window.api.gastos.crear({
        fecha: expenseForm.fecha,
        categoria: expenseForm.categoria,
        descripcion: expenseForm.descripcion,
        monto: Number(expenseForm.monto || 0)
      })

      setStatus('Gasto guardado')
      setExpenseForm({ ...emptyExpenseForm, fecha: today() })
      await loadData()
    } catch (error) {
      setStatus(errorMessage(error, 'No se pudo guardar el gasto'))
    }
  }

  const handleAdjustmentSubmit = async (event) => {
    event.preventDefault()

    if (!adjustmentForm.producto_id) {
      setStatus('Selecciona un producto para ajustar stock')
      return
    }

    try {
      await window.api.inventario.ajustar({
        producto_id: Number(adjustmentForm.producto_id),
        cantidad: Number(adjustmentForm.cantidad),
        nota: adjustmentForm.nota || 'Ajuste manual',
        fecha: today()
      })

      setStatus('Ajuste de inventario aplicado')
      setAdjustmentForm(emptyAdjustmentForm)
      await loadData()
    } catch (error) {
      setStatus(errorMessage(error, 'No se pudo ajustar el inventario'))
    }
  }

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
          <header className="page-header">
            <div>
              <h1>{page.title}</h1>
              <p>{pageSubtitle}</p>
            </div>

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
          </header>

          {tab === 'dashboard' && (
            <>
              <section className="stats-grid">
                <div className="stat-card accent">
                  <span>Ingresos</span>
                  <strong>{formatMoney(report.ingresos)}</strong>
                </div>
                <div className="stat-card">
                  <span>Costo vendido</span>
                  <strong>{formatMoney(report.costoVendido)}</strong>
                </div>
                <div className="stat-card">
                  <span>Utilidad bruta</span>
                  <strong>{formatMoney(report.utilidadBruta)}</strong>
                </div>
                <div className="stat-card">
                  <span>Valor del inventario</span>
                  <strong>{formatMoney(report.valorInventario)}</strong>
                </div>
              </section>

              <section className="grid-2">
                <div className="panel">
                  <div className="panel-header">
                    <h2>Stock bajo</h2>
                    <span className="muted">{productosStockBajo.length} producto(s)</span>
                  </div>

                  <ul className="simple-list">
                    {productosStockBajo.length ? (
                      productosStockBajo.slice(0, 8).map((producto) => (
                        <li key={producto.id}>
                          <span>{producto.nombre}</span>
                          <strong>
                            {producto.stock} / mín. {producto.stock_minimo}
                          </strong>
                        </li>
                      ))
                    ) : (
                      <li className="empty-row">Todo el stock está por encima del mínimo</li>
                    )}
                  </ul>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <h2>Últimas ventas</h2>
                    <button type="button" className="secondary-btn small-btn" onClick={() => setTab('ventas')}>
                      Ver todas
                    </button>
                  </div>

                  <ul className="simple-list">
                    {ventas.length ? (
                      ventas.slice(0, 6).map((venta) => (
                        <li key={`${venta.id}-${venta.item_id}`}>
                          <span>
                            {venta.producto} <small className="muted">× {venta.cantidad}</small>
                          </span>
                          <strong>{formatMoney(venta.total)}</strong>
                        </li>
                      ))
                    ) : (
                      <li className="empty-row">Aún no hay ventas registradas</li>
                    )}
                  </ul>
                </div>
              </section>
            </>
          )}

          {tab === 'configuracion' && (
            <section className="panel config-panel">
              <div className="settings-grid">
                <label>
                  Nombre de la empresa
                  <input
                    value={branding.nombreEmpresa}
                    onChange={(event) =>
                      setBranding((current) => ({ ...current, nombreEmpresa: event.target.value }))
                    }
                  />
                </label>

                <div>
                  <h3 className="section-label">Colores</h3>
                  <div className="color-row">
                    <label className="color-field">
                      <input
                        type="color"
                        value={branding.primaryColor}
                        onChange={(event) =>
                          setBranding((current) => ({ ...current, primaryColor: event.target.value }))
                        }
                      />
                      Principal
                    </label>

                    <label className="color-field">
                      <input
                        type="color"
                        value={branding.secondaryColor}
                        onChange={(event) =>
                          setBranding((current) => ({
                            ...current,
                            secondaryColor: event.target.value
                          }))
                        }
                      />
                      Secundario
                    </label>

                    <label className="color-field">
                      <input
                        type="color"
                        value={branding.backgroundColor}
                        onChange={(event) =>
                          setBranding((current) => ({
                            ...current,
                            backgroundColor: event.target.value
                          }))
                        }
                      />
                      Fondo
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="section-label">Paletas listas</h3>
                  <div className="palette-grid">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.nombre}
                        type="button"
                        className="palette-button"
                        onClick={() => setBranding((current) => ({ ...current, ...preset }))}
                      >
                        <span
                          className="palette-preview"
                          style={{
                            background: `linear-gradient(135deg, ${preset.primaryColor}, ${preset.secondaryColor})`
                          }}
                        />
                        {preset.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="section-label">Logo</h3>
                  <div className="logo-upload-box">
                    {branding.logoDataUrl ? (
                      <img
                        className="logo-preview"
                        src={branding.logoDataUrl}
                        alt="Previsualización del logo"
                      />
                    ) : (
                      <div className="logo-preview placeholder-logo">Sin logo</div>
                    )}

                    <label className="upload-button">
                      {branding.logoDataUrl ? 'Cambiar logo' : 'Subir logo'}
                      <input type="file" accept="image/*" hidden onChange={handleLogoUpload} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="settings-actions">
                <button type="button" className="secondary-btn" onClick={handleResetBranding}>
                  Restablecer colores
                </button>
              </div>
            </section>
          )}

          {tab === 'productos' && (
            <section className="panel">
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
                        placeholder="Nombre, SKU o categoría"
                      />
                    </label>
                    <label className="toolbar-sort">
                      Ordenar por
                      <select
                        value={productSortBy}
                        onChange={(event) => setProductSortBy(event.target.value)}
                      >
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
                                  {producto.sku ? <small className="muted">{producto.sku}</small> : null}
                                </td>
                                <td>
                                  {producto.stock}
                                  {Number(producto.stock_minimo) > 0 &&
                                  Number(producto.stock) <= Number(producto.stock_minimo) ? (
                                    <span className="badge warn">Bajo</span>
                                  ) : null}
                                </td>
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
                      <div className="field-row two-col">
                        <label>
                          SKU
                          <input
                            value={normalizeInputValue(productForm.sku)}
                            onChange={(event) =>
                              setProductForm((current) => ({ ...current, sku: event.target.value }))
                            }
                            placeholder="SKU"
                          />
                        </label>
                        <label>
                          Nombre
                          <input
                            value={normalizeInputValue(productForm.nombre)}
                            onChange={(event) =>
                              setProductForm((current) => ({
                                ...current,
                                nombre: event.target.value
                              }))
                            }
                            placeholder="Nombre"
                          />
                        </label>
                      </div>

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
            </section>
          )}

          {tab === 'ventas' && (
            <section className="split-layout">
              <div className="panel">
                <div className="panel-header">
                  <h2>Carrito de venta</h2>
                </div>

                <form className="stack-form" onSubmit={handleSaleSubmit}>
                  <label>
                    Producto
                    <select
                      value={normalizeInputValue(saleForm.producto_id)}
                      onChange={(event) => {
                        const producto = productos.find(
                          (p) => String(p.id) === String(event.target.value)
                        )
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
              </div>

              <div className="panel">
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
              </div>
            </section>
          )}

          {tab === 'compras' && (
            <section className="grid-2">
              <div className="panel">
                <div className="panel-header">
                  <h2>Carrito de compras</h2>
                </div>

                <form className="stack-form" onSubmit={handlePurchaseSubmit}>
                  <label>
                    Producto
                    <select
                      value={normalizeInputValue(purchaseForm.producto_id)}
                      onChange={(event) => {
                        const producto = productos.find(
                          (p) => String(p.id) === String(event.target.value)
                        )
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
              </div>

              <div className="panel">
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
              </div>
            </section>
          )}

          {tab === 'gastos' && (
            <section className="panel narrow-panel">
              <div className="panel-header">
                <h2>Nuevo gasto</h2>
              </div>

              <form onSubmit={handleExpenseSubmit} className="stack-form">
                <div className="field-row two-col">
                  <label>
                    Fecha
                    <input
                      type="date"
                      value={normalizeInputValue(expenseForm.fecha)}
                      onChange={(event) =>
                        setExpenseForm((current) => ({ ...current, fecha: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Categoría
                    <select
                      value={normalizeInputValue(expenseForm.categoria)}
                      onChange={(event) =>
                        setExpenseForm((current) => ({ ...current, categoria: event.target.value }))
                      }
                    >
                      <option value="transporte">Transporte</option>
                      <option value="envios">Envíos</option>
                      <option value="publicidad">Publicidad</option>
                      <option value="empaques">Embalaje</option>
                      <option value="otro">Otro</option>
                    </select>
                  </label>
                </div>

                <label>
                  Descripción
                  <input
                    value={normalizeInputValue(expenseForm.descripcion)}
                    onChange={(event) =>
                      setExpenseForm((current) => ({ ...current, descripcion: event.target.value }))
                    }
                    placeholder="Detalle del gasto"
                  />
                </label>

                <label>
                  Monto
                  <input
                    type="number"
                    min="0"
                    value={normalizeInputValue(expenseForm.monto)}
                    onChange={(event) =>
                      setExpenseForm((current) => ({ ...current, monto: event.target.value }))
                    }
                  />
                </label>

                <button type="submit" className="primary-btn">
                  Guardar gasto
                </button>
              </form>
            </section>
          )}

          {tab === 'reportes' && (
            <section className="grid-2 report-layout">
              <div className="panel">
                <div className="panel-header">
                  <h2>Balance del mes</h2>
                </div>

                <div className="mini-stats">
                  <div>
                    <span>Ingresos</span>
                    <strong>{formatMoney(report.ingresos)}</strong>
                  </div>
                  <div>
                    <span>Costo vendido</span>
                    <strong>{formatMoney(report.costoVendido)}</strong>
                  </div>
                  <div>
                    <span>Utilidad bruta</span>
                    <strong>{formatMoney(report.utilidadBruta)}</strong>
                  </div>
                  <div>
                    <span>Utilidad neta</span>
                    <strong>{formatMoney(report.utilidadNeta)}</strong>
                  </div>
                  <div>
                    <span>Compras del mes</span>
                    <strong>{formatMoney(report.comprasDelMes)}</strong>
                  </div>
                  <div>
                    <span>Gastos operativos</span>
                    <strong>{formatMoney(report.gastosOperativos)}</strong>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h2>Más vendidos</h2>
                </div>

                <ul className="ranking-list">
                  {report.masVendidos?.length ? (
                    report.masVendidos.map((item, index) => (
                      <li key={item.nombre || index}>
                        <span>
                          #{index + 1} {item.nombre}
                        </span>
                        <strong>{formatNumber(item.unidades)} uds</strong>
                      </li>
                    ))
                  ) : (
                    <li className="empty-row">Sin ventas este mes</li>
                  )}
                </ul>
              </div>
            </section>
          )}
        </div>
      </main>

      {status ? (
        <div className={looksLikeError(status) ? 'toast error' : 'toast'} role="status">
          {status}
        </div>
      ) : null}
    </div>
  )
}

export default App