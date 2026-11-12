export default function Panel({ children, className = '', narrow = false }) {
  return (
    <section className={['panel', className, narrow ? 'narrow-panel' : ''].filter(Boolean).join(' ')}>
      {children}
    </section>
  )
}
