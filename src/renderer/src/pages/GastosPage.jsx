import PropTypes from 'prop-types'
import Panel from '../components/Panel'
import { formatMoney, normalizeInputValue } from '../utils/format'

export default function GastosPage({ expenseForm, setExpenseForm, handleExpenseSubmit, gastos }) {
  return (
    <section className="grid-2">
      <Panel className="narrow-panel">
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
              Motivo del gasto
              <input
                value={normalizeInputValue(expenseForm.descripcion)}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, descripcion: event.target.value }))
                }
                placeholder="Ej. transporte, pago de luz..."
              />
            </label>
          </div>

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
      </Panel>

      <Panel>
        <div className="panel-header">
          <h2>Gastos</h2>
        </div>

        {gastos.length ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Motivo</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((gasto) => (
                  <tr key={gasto.id}>
                    <td>{new Date(`${gasto.fecha}T00:00:00`).toLocaleDateString('es-CO')}</td>
                    <td>{gasto.descripcion || 'Sin motivo'}</td>
                    <td>{formatMoney(gasto.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-note">Todavía no hay gastos registrados en este mes.</p>
        )}
      </Panel>
    </section>
  )
}

GastosPage.propTypes = {
  expenseForm: PropTypes.shape({
    fecha: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    categoria: PropTypes.string,
    descripcion: PropTypes.string,
    monto: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }).isRequired,
  setExpenseForm: PropTypes.func.isRequired,
  handleExpenseSubmit: PropTypes.func.isRequired,
  gastos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      fecha: PropTypes.string,
      descripcion: PropTypes.string,
      monto: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  ).isRequired
}
