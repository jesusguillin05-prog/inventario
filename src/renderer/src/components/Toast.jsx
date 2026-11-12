export default function Toast({ message, isError = false }) {
  return (
    <div className={isError ? 'toast error' : 'toast'} role="status">
      {message}
    </div>
  )
}
