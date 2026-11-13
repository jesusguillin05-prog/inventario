import PropTypes from 'prop-types'
import Panel from '../components/Panel'
import { formatMoney } from '../utils/format'

export default function DashboardPage({ report, productosStockBajo, ventas, setTab }) {
  return (
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
        <Panel>
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
        </Panel>

        <Panel>
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
        </Panel>
      </section>
    </>
  )
}

DashboardPage.propTypes = {
  report: PropTypes.shape({
    ingresos: PropTypes.number,
    costoVendido: PropTypes.number,
    utilidadBruta: PropTypes.number,
    valorInventario: PropTypes.number
  }).isRequired,
  productosStockBajo: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      nombre: PropTypes.string,
      stock: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      stock_minimo: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  ).isRequired,
  ventas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      item_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      producto: PropTypes.string,
      cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      total: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  ).isRequired,
  setTab: PropTypes.func.isRequired
}
