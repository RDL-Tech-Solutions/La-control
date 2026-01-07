export default function StatCard({
    icon: Icon,
    label,
    value,
    variant = 'primary',
    trend,
    trendLabel,
    className = '',
}) {
    const variantClasses = {
        primary: 'primary',
        success: 'success',
        warning: 'warning',
        error: 'error',
        accent: 'accent',
    }

    const trendColors = {
        up: 'text-[var(--color-success-400)]',
        down: 'text-[var(--color-error-400)]',
        neutral: 'text-[var(--color-neutral-400)]',
    }

    return (
        <div className={`stat-card ${className}`}>
            <div className="stat-card-header">
                {Icon && (
                    <div className={`stat-card-icon ${variantClasses[variant]}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}

                {trend && (
                    <span className={`text-xs font-medium ${trendColors[trend]}`}>
                        {trendLabel}
                    </span>
                )}
            </div>

            <div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    )
}
