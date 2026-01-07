import Button from './Button'

export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    actionLabel,
    actionIcon,
}) {
    return (
        <div className="empty-state">
            {Icon && (
                <div className="empty-state-icon">
                    <Icon className="w-8 h-8" />
                </div>
            )}

            <h3 className="empty-state-title">{title}</h3>

            {description && (
                <p className="empty-state-text">{description}</p>
            )}

            {action && actionLabel && (
                <Button onClick={action} icon={actionIcon}>
                    {actionLabel}
                </Button>
            )}
        </div>
    )
}
