import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Button from '../../components/Button'
import { useServices } from './useServices'
import { validateService } from '../../utils/validators'
import { formatDateForInput, formatCurrency } from '../../utils/formatters'
import { AlertTriangle, Package, Check } from 'lucide-react'

export default function NewServiceModal({ isOpen, onClose, serviceTypes }) {
    const { createService, checkStockAvailability } = useServices()
    const [loading, setLoading] = useState(false)
    const [checkingStock, setCheckingStock] = useState(false)
    const [stockStatus, setStockStatus] = useState(null)
    const [errors, setErrors] = useState({})

    const [formData, setFormData] = useState({
        client_name: '',
        service_type_id: '',
        date: formatDateForInput(new Date()),
        notes: '',
    })

    useEffect(() => {
        if (isOpen) {
            setFormData({
                client_name: '',
                service_type_id: '',
                date: formatDateForInput(new Date()),
                notes: '',
            })
            setErrors({})
            setStockStatus(null)
        }
    }, [isOpen])

    // Check stock when service type changes
    useEffect(() => {
        const checkStock = async () => {
            if (!formData.service_type_id) {
                setStockStatus(null)
                return
            }

            setCheckingStock(true)
            try {
                const status = await checkStockAvailability(formData.service_type_id)
                setStockStatus(status)
            } catch (error) {
                console.error('Error checking stock:', error)
            } finally {
                setCheckingStock(false)
            }
        }

        checkStock()
    }, [formData.service_type_id, checkStockAvailability])

    const serviceTypeOptions = serviceTypes.map(t => ({
        value: t.id,
        label: `${t.name} - ${formatCurrency(t.price)}`,
    }))

    const selectedServiceType = serviceTypes.find(t => t.id === formData.service_type_id)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const validation = validateService(formData)
        if (!validation.valid) {
            setErrors(validation.errors)
            return
        }

        if (!stockStatus?.available) {
            return
        }

        setLoading(true)
        try {
            await createService(formData)
            onClose()
        } catch (error) {
            console.error('Error creating service:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Registrar Serviço"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        loading={loading}
                        disabled={checkingStock || (stockStatus && !stockStatus.available)}
                    >
                        Registrar Serviço
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome do Cliente"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleChange}
                    placeholder="Nome da cliente"
                    error={errors.client_name}
                    required
                />

                <Select
                    label="Tipo de Serviço"
                    name="service_type_id"
                    value={formData.service_type_id}
                    onChange={handleChange}
                    options={serviceTypeOptions}
                    placeholder="Selecione o serviço"
                    error={errors.service_type_id}
                    required
                />

                <Input
                    label="Data"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    error={errors.date}
                    required
                />

                <Input
                    label="Observações"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Observações opcionais"
                />

                {/* Stock Status */}
                {formData.service_type_id && (
                    <div className={`p-4 rounded-lg border ${checkingStock
                        ? 'bg-[var(--color-neutral-800)] border-[var(--color-neutral-700)]'
                        : stockStatus?.available
                            ? 'bg-[var(--color-success-500)]/10 border-[var(--color-success-500)]/30'
                            : 'bg-[var(--color-error-500)]/10 border-[var(--color-error-500)]/30'
                        }`}>
                        {checkingStock ? (
                            <div className="flex items-center gap-2 text-[var(--color-neutral-300)]">
                                <div className="loading-spinner w-4 h-4" />
                                <span className="text-sm">Verificando estoque...</span>
                            </div>
                        ) : stockStatus?.available ? (
                            <div>
                                <div className="flex items-center gap-2 text-[var(--color-success-400)] mb-2">
                                    <Check className="w-5 h-5" />
                                    <span className="font-medium">Estoque disponível</span>
                                </div>
                                {stockStatus.products?.length > 0 && (
                                    <div className="space-y-1">
                                        {stockStatus.products.map((sp, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm">
                                                <span className="text-[var(--color-neutral-400)]">
                                                    <Package className="w-3 h-3 inline mr-1" />
                                                    {sp.product?.name}
                                                </span>
                                                <span className="text-[var(--color-neutral-500)]">
                                                    -{sp.default_quantity} (restará {sp.product.current_quantity - sp.default_quantity})
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2 text-[var(--color-error-400)] mb-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span className="font-medium">Estoque insuficiente</span>
                                </div>
                                <div className="space-y-1">
                                    {stockStatus?.insufficientProducts?.map((p, index) => (
                                        <div key={index} className="text-sm text-[var(--color-neutral-400)]">
                                            <span className="font-medium text-[var(--color-error-400)]">{p.name}:</span>
                                            {' '}necessário {p.required}, disponível {p.available}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Price & Cost Summary */}
                {selectedServiceType && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-neutral-800)]">
                            <span className="text-[var(--color-neutral-300)]">Valor do Serviço</span>
                            <span className="text-xl font-bold text-[var(--color-accent-400)]">
                                {formatCurrency(selectedServiceType.price)}
                            </span>
                        </div>

                        {stockStatus?.available && (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 rounded-lg bg-[var(--color-neutral-800)] border border-[var(--color-neutral-700)]">
                                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-neutral-500)] mb-1">
                                        Custo de Materiais
                                    </p>
                                    <p className="text-lg font-semibold text-[var(--color-error-400)]">
                                        {formatCurrency(stockStatus.products.reduce((sum, sp) =>
                                            sum + (sp.default_quantity * (sp.product.last_unit_cost || 0)), 0
                                        ))}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-[var(--color-neutral-800)] border border-[var(--color-neutral-700)]">
                                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-neutral-500)] mb-1">
                                        Lucro Estimado
                                    </p>
                                    <p className="text-lg font-semibold text-[var(--color-success-400)]">
                                        {formatCurrency(selectedServiceType.price - stockStatus.products.reduce((sum, sp) =>
                                            sum + (sp.default_quantity * (sp.product.last_unit_cost || 0)), 0
                                        ))}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </form>
        </Modal>
    )
}
