import PropTypes from 'prop-types'

export default function Toast({ message, isError = false }) {
  return (
    <div className={isError ? 'toast error' : 'toast'} role="status">
      {message}
    </div>
  )
}

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  isError: PropTypes.bool
}
