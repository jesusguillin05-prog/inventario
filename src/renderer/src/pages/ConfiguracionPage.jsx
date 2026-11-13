import PropTypes from 'prop-types'
import Panel from '../components/Panel'
import { colorPresets } from '../utils/branding'

export default function ConfiguracionPage({
  branding,
  setBranding,
  handleLogoUpload,
  handleResetBranding
}) {
  return (
    <Panel>
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
                  setBranding((current) => ({ ...current, secondaryColor: event.target.value }))
                }
              />
              Secundario
            </label>

            <label className="color-field">
              <input
                type="color"
                value={branding.backgroundColor}
                onChange={(event) =>
                  setBranding((current) => ({ ...current, backgroundColor: event.target.value }))
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
    </Panel>
  )
}

ConfiguracionPage.propTypes = {
  branding: PropTypes.shape({
    nombreEmpresa: PropTypes.string,
    primaryColor: PropTypes.string,
    secondaryColor: PropTypes.string,
    backgroundColor: PropTypes.string,
    logoDataUrl: PropTypes.string
  }).isRequired,
  setBranding: PropTypes.func.isRequired,
  handleLogoUpload: PropTypes.func.isRequired,
  handleResetBranding: PropTypes.func.isRequired
}
