interface Props {
  emoji?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ emoji = '📭', title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{emoji}</span>
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      {description && <p className="text-text-muted text-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}
