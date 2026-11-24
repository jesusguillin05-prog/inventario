import { useMemo } from 'react'

export function useProductCatalog({
  categorias,
  productos,
  selectedCategoryId,
  productSearch,
  productSortBy,
  showInactiveProducts
}) {
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
      productosActivos.filter((producto) => {
        const stock = Number(producto.stock ?? 0)
        return stock <= 3
      }),
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
      return [producto.nombre, producto.categoria].some((v) =>
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

  return {
    selectedCategoryForProducts,
    categoriaActual,
    productosActivos,
    productosStockBajo,
    productosPorCategoria
  }
}
