import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

const Button = forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    iconPosition = 'left',
    className = '',
    type = 'button',
    ...props
}, ref) => {
    const baseClasses = 'btn'

    const variantClasses = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        accent: 'btn-accent',
        danger: 'btn-danger',
        ghost: 'btn-ghost',
    }

    const sizeClasses = {
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg',
        icon: 'btn-icon',
    }

    const classes = [
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className,
    ].filter(Boolean).join(' ')

    const isDisabled = disabled || loading

    return (
        <button
            ref={ref}
            type={type}
            className={classes}
            disabled={isDisabled}
            {...props}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : Icon && iconPosition === 'left' ? (
                <Icon className="w-4 h-4" />
            ) : null}

            {children && <span>{children}</span>}

            {!loading && Icon && iconPosition === 'right' && (
                <Icon className="w-4 h-4" />
            )}
        </button>
    )
})

Button.displayName = 'Button'

export default Button
