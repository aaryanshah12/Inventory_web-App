import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  accent?: 'owner' | 'inputer' | 'chemist'
}

const accentColors = {
  owner:   'text-owner',
  inputer: 'text-inputer',
  chemist: 'text-chemist',
}

export default function PageHeader({ title, subtitle, actions, accent = 'inputer' }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <div className="font-mono text-[10px] text-muted uppercase tracking-widest mb-1">
          {subtitle ?? 'Overview'}
        </div>
        <h1 className={`font-display text-3xl font-bold text-primary uppercase tracking-wide`}>
          {title}
        </h1>
        <div className={`h-0.5 w-16 mt-2 rounded-full bg-current ${accentColors[accent]}`} />
      </div>
      {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
    </div>
  )
}
