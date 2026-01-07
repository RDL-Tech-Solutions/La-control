import Button from './Button'
import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar ação',
    message = 'Tem certeza que deseja continuar?',
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
    loading = false,
}) {
    if (!isOpen) return null

    return (
        <div
            className="modal-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget && !loading) onClose()
            }}
        >
            <div className="modal max-w-sm">
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${variant === 'danger'
                                ? 'bg-red-500/15 text-red-400'
                                : 'bg-amber-500/15 text-amber-400'
                            }`}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h2 className="modal-title">{title}</h2>
                    </div>
                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Fechar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="modal-body">
                    <p className="text-[var(--color-neutral-300)]">{message}</p>
                </div>

                <div className="modal-footer justify-end">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    )
}
