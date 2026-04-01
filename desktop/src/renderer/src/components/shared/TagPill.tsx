interface TagPillProps {
  children: React.ReactNode
  color?: 'blue' | 'purple' | 'amber' | 'green' | 'red' | 'orange' | 'pink' | 'slate'
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  amber: 'bg-amber-100 text-amber-600',
  green: 'bg-emerald-100 text-emerald-600',
  red: 'bg-red-100 text-red-600',
  orange: 'bg-orange-100 text-orange-600',
  pink: 'bg-pink-100 text-pink-600',
  slate: 'bg-slate-100 text-slate-500'
}

export function TagPill({ children, color = 'blue' }: TagPillProps): JSX.Element {
  return (
    <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-medium ${colorMap[color]}`}>
      {children}
    </span>
  )
}
