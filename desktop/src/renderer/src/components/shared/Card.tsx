interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className = '', hover = false }: CardProps): JSX.Element {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  )
}
