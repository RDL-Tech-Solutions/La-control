import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Button from '../../components/Button'
import { useStockEntries } from './useStockEntries'
import { validateStockEntry } from '../../utils/validators'
import { formatDateForInput, formatCurrency } from '../../utils/formatters'

export default function StockEntryModal({ isOpen, onClose, products }) {
    const { createEntry } = useStockEntries()
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})

    const [formData, setFormData] = useState({
        product_id: '',
        quantity: '',
        unit_price: '',
        cost: '',
        date: formatDateForInput(new Date()),
        notes: '',
    })

    useEffect(() => {
        if (isOpen) {
            setFormData({
                product_id: '',
                quantity: '',
                unit_price: '',
                cost: '',
                date: formatDateForInput(new Date()),
                notes: '',
            })
            setErrors({})
        }
    }, [isOpen])

    const productOptions = products.map(p => ({
        value: p.id,
        label: p.code ? `[${p.code}] ${p.name}` : p.name,
    }))

    const selectedProduct = products.find(p => p.id === formData.product_id)

    const handleChange = (e) => {
        const { name, value, type } = e.target

        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: type === 'number' ? (value === '' ? '' : value) : value
            }

            // Auto-calculate total cost if quantity or unit_price changes
            if (name === 'quantity' || name === 'unit_price') {
                const q = parseFloat(name === 'quantity' ? value : prev.quantity) || 0
                const p = parseFloat(name === 'unit_price' ? value : prev.unit_price) || 0
                newData.cost = (q * p).toFixed(2)
            }

            // Auto-calculate unit price if cost changes manually
            if (name === 'cost') {
                const q = parseFloat(prev.quantity) || 0
                const c = parseFloat(value) || 0
                if (q > 0) {
                    newData.unit_price = (c / q).toFixed(2)
                }
            }

            return newData
        })

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const validation = validateStockEntry(formData)
        if (!validation.valid) {
            setErrors(validation.errors)
            return
        }

        setLoading(true)
        try {
            await createEntry({
                product_id: formData.product_id,
                quantity: parseFloat(formData.quantity),
                unit_price: parseFloat(formData.unit_price),
                cost: parseFloat(formData.cost),
                date: formData.date,
                notes: formData.notes,
            })
            onClose()
        } catch (error) {
            console.error('Error creating entry:', error)
        } finally {
            setLoading(false)
        }
    }

    const resultingQuantity = selectedProduct
        ? (parseFloat(formData.quantity) || 0) * (selectedProduct.conversion_factor || 1)
        : 0

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Entrada de Estoque"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} loading={loading}>
                        Registrar Entrada
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                    label="Produto"
                    name="product_id"
                    value={formData.product_id}
                    onChange={handleChange}
                    options={productOptions}
                    placeholder="Selecione um produto"
                    error={errors.product_id}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Quantidade (unidades)"
                        name="quantity"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.quantity}
                        onChange={handleChange}
                        placeholder="Ex: 2"
                        error={errors.quantity}
                        required
                    />

                    <Input
                        label="Preço Unitário (R$)"
                        name="unit_price"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={handleChange}
                        placeholder="0,00"
                        error={errors.unit_price}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Custo Total (R$)"
                        name="cost"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.cost}
                        onChange={handleChange}
                        placeholder="0,00"
                        error={errors.cost}
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
                </div>

                {selectedProduct && formData.quantity && (
                    <div className="p-3 rounded-lg bg-[var(--color-accent-500)]/10 border border-[var(--color-accent-500)]/30">
                        <p className="text-sm text-[var(--color-accent-400)] font-medium">
                            📈 Resultado no Estoque:
                        </p>
                        <p className="text-xs text-[var(--color-neutral-400)] mt-1">
                            {formData.quantity} un × {selectedProduct.conversion_factor} {selectedProduct.unit} =
                            <span className="text-[var(--color-neutral-200)] font-bold ml-1">
                                {resultingQuantity} {selectedProduct.unit}
                            </span>
                        </p>
                    </div>
                )}

                <Input
                    label="Observações"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Observações opcionais"
                />
            </form>
        </Modal>
    )
}
