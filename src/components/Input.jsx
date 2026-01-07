import { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'

const Input = forwardRef(({
    label,
    error,
    required = false,
    type = 'text',
    className = '',
    containerClassName = '',
    ...props
}, ref) => {
    const inputClasses = [
        'input',
        error ? 'error' : '',
        className,
    ].filter(Boolean).join(' ')

    return (
        <div className={`input-group ${containerClassName}`}>
            {label && (
                <label className={`input-label ${required ? 'required' : ''}`}>
                    {label}
                </label>
            )}

            <input
                ref={ref}
                type={type}
                className={inputClasses}
                {...props}
            />

            {error && (
                <span className="input-error">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </span>
            )}
        </div>
    )
})

Input.displayName = 'Input'

export default Input
