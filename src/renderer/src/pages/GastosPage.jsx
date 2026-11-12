import Panel from '../components/Panel'
import { normalizeInputValue } from '../utils/format'

export default function GastosPage({ expenseForm, setExpenseForm, handleExpenseSubmit }) {
  return (
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
    </Panel>
  )
}
