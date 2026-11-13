import PropTypes from 'prop-types'

export default function Panel({ children, className = '', narrow = false }) {
  return (
    <section className={['panel', className, narrow ? 'narrow-panel' : ''].filter(Boolean).join(' ')}>
      {children}
    </section>
  )
}

Panel.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  narrow: PropTypes.bool
}
