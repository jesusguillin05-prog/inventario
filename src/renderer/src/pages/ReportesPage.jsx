import PropTypes from 'prop-types'
import Panel from '../components/Panel'
import { formatMoney, formatNumber } from '../utils/format'

export default function ReportesPage({ report }) {
  return (
    <section className="grid-2 report-layout">
      <Panel>
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
      </Panel>

      <Panel>
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
      </Panel>
    </section>
  )
}

ReportesPage.propTypes = {
  report: PropTypes.shape({
    ingresos: PropTypes.number,
    costoVendido: PropTypes.number,
    utilidadBruta: PropTypes.number,
    utilidadNeta: PropTypes.number,
    comprasDelMes: PropTypes.number,
    gastosOperativos: PropTypes.number,
    masVendidos: PropTypes.arrayOf(
      PropTypes.shape({
        nombre: PropTypes.string,
        unidades: PropTypes.number
      })
    )
  }).isRequired
}
