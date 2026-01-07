export default function LoadingSpinner({ size = 'md', className = '' }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12',
    }

    return (
        <div
            className={`loading-spinner ${sizeClasses[size]} ${className}`}
            role="status"
            aria-label="Carregando"
        />
    )
}

export function LoadingPage() {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="xl" />
                <p className="text-[var(--color-neutral-400)] text-sm">Carregando...</p>
            </div>
        </div>
    )
}

export function LoadingOverlay() {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[var(--color-neutral-900)] rounded-2xl p-8 flex flex-col items-center gap-4">
                <LoadingSpinner size="xl" />
                <p className="text-[var(--color-neutral-200)]">Processando...</p>
            </div>
        </div>
    )
}
