import clsx from 'clsx'
import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: ReactNode
  color?: 'owner' | 'inputer' | 'chemist' | 'muted'
  trend?: 'up' | 'down' | 'neutral'
}

const colorMap = {
  owner:   { border: 'border-owner/25',   bg: 'bg-owner/8',   text: 'text-owner',   icon: 'bg-owner/10'   },
  inputer: { border: 'border-inputer/25', bg: 'bg-inputer/8', text: 'text-inputer', icon: 'bg-inputer/10' },
  chemist: { border: 'border-chemist/25', bg: 'bg-chemist/8', text: 'text-chemist', icon: 'bg-chemist/10' },
  muted:   { border: 'border-border',     bg: 'bg-panel',     text: 'text-primary',   icon: 'bg-layer'    },
}

export default function StatCard({ label, value, sub, icon, color = 'muted', trend }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={clsx('card border p-5 transition-all hover:scale-[1.01]', c.border)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="font-mono text-[10px] text-muted uppercase tracking-widest mb-2">{label}</div>
          <div className={clsx('font-display text-3xl font-bold', c.text)}>{value}</div>
          {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
        </div>
        {icon && (
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', c.icon, c.text)}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className={clsx('mt-3 text-xs font-mono',
          trend === 'up' ? 'text-chemist' : trend === 'down' ? 'text-red-400' : 'text-muted'
        )}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} vs last month
        </div>
      )}
    </div>
  )
}
