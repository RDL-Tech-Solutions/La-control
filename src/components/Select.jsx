import { forwardRef } from 'react'
import { AlertCircle, ChevronDown } from 'lucide-react'

const Select = forwardRef(({
    label,
    error,
    required = false,
    options = [],
    placeholder = 'Selecione...',
    className = '',
    containerClassName = '',
    ...props
}, ref) => {
    const selectClasses = [
        'input',
        'pr-10',
        'cursor-pointer',
        'appearance-none',
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

            <div className="relative">
                <select
                    ref={ref}
                    className={selectClasses}
                    {...props}
                >
                    <option value="">{placeholder}</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-400)] pointer-events-none" />
            </div>

            {error && (
                <span className="input-error">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </span>
            )}
        </div>
    )
})

Select.displayName = 'Select'

export default Select
