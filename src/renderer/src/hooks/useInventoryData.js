import { useCallback, useEffect, useMemo, useState } from 'react'
import { defaultBranding } from '../utils/branding'
import {
  errorMessage,
  formatMoneyInput,
  normalizeInputValue,
  parseMoneyInput,
  thisMonth,
  today
} from '../utils/format'

export const emptyProductForm = {
  sku: '',
  nombre: '',
  costo: '',
  precio: '',
  stock_minimo: '',
  stock_inicial: ''
}

export const emptySaleForm = {
  producto_id: '',
  cantidad: 1,
  precio_unitario: ''
}

export const emptyPurchaseForm = {
  producto_id: '',
  cantidad: 1,
  costo_unitario: ''
}

export const emptyExpenseForm = {
  fecha: today(),
  categoria: 'transporte',
  descripcion: '',
  monto: ''
}

export const emptyAdjustmentForm = {
  producto_id: '',
  cantidad: 1,
  nota: ''
}

export const defaultReport = {
  ingresos: 0,
  costoVendido: 0,
  utilidadBruta: 0,
  gastosOperativos: 0,
  utilidadNeta: 0,
  comprasDelMes: 0,
  valorInventario: 0,
  masVendidos: []
}

export function useInventoryData() {
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

  const productosActivos = useMemo(
    () => productos.filter((producto) => Number(producto.activo) === 1),
    [productos]
  )

  const productosStockBajo = useMemo(
    () =>
      productosActivos.filter(
        (producto) =>
          Number(producto.stock_minimo) > 0 && Number(producto.stock) <= Number(producto.stock_minimo)
      ),
    [productosActivos]
  )

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

  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--primary', branding.primaryColor)
    root.setProperty('--primary-strong', branding.secondaryColor)
    root.setProperty('--bg-1', branding.backgroundColor)
    root.setProperty('--bg-2', branding.backgroundColor)
    root.setProperty('--text', branding.textColor)
  }, [branding])

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

  return {
    tab,
    setTab,
    categorias,
    setCategorias,
    productos,
    setProductos,
    ventas,
    setVentas,
    ventasCategoryId,
    setVentasCategoryId,
    report,
    setReport,
    reportCategoryId,
    setReportCategoryId,
    status,
    setStatus,
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
    setSaleCart,
    purchaseCart,
    setPurchaseCart,
    branding,
    setBranding,
    selectedCategoryForProducts,
    categoriaActual,
    productosActivos,
    productosStockBajo,
    productosPorCategoria,
    saleCartTotal,
    purchaseCartTotal,
    loadData,
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
    normalizeInputValue,
    parseMoneyInput
  }
}
