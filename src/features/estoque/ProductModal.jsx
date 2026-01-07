import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Button from '../../components/Button'
import { useProducts } from './useProducts'
import { useBrands } from '../cadastros/useBrands'
import { useUnits } from '../cadastros/useUnits'
import { validateProduct } from '../../utils/validators'

export default function ProductModal({ isOpen, onClose, product }) {
    const { createProduct, updateProduct } = useProducts()
    const { brands } = useBrands()
    const { units } = useUnits()

    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        brand_id: '',
        current_quantity: '',
        min_quantity: '',
        unit: 'un',
        conversion_factor: 1,
    })

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                brand_id: product.brand_id || '',
                current_quantity: product.current_quantity || '',
                min_quantity: product.min_quantity || '',
                unit: product.unit || 'un',
                conversion_factor: product.conversion_factor || 1,
            })
        } else {
            setFormData({
                name: '',
                description: '',
                brand_id: '',
                current_quantity: '',
                min_quantity: '',
                unit: 'un',
                conversion_factor: 1,
            })
        }
        setErrors({})
    }, [product, isOpen])

    const brandOptions = brands.map(b => ({ value: b.id, label: b.name }))
    const unitOptions = units.map(u => ({ value: u.abbreviation, label: `${u.name} (${u.abbreviation})` }))

    const handleChange = (e) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : value) : value
        }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const validation = validateProduct(formData)
        if (!validation.valid) {
            setErrors(validation.errors)
            return
        }

        setLoading(true)
        try {
            const dataToSave = {
                ...formData,
                brand_id: formData.brand_id || null,
                current_quantity: parseFloat(formData.current_quantity) || 0,
                min_quantity: parseFloat(formData.min_quantity) || 0,
                conversion_factor: parseFloat(formData.conversion_factor) || 1,
            }

            if (product) {
                await updateProduct(product.id, dataToSave)
            } else {
                await createProduct(dataToSave)
            }
            onClose()
        } catch (error) {
            console.error('Error saving product:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={product ? 'Editar Produto' : 'Novo Produto'}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} loading={loading}>
                        {product ? 'Salvar Alterações' : 'Criar Produto'}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome do Produto"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: Esmalte Vermelho"
                    error={errors.name}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Marca"
                        name="brand_id"
                        value={formData.brand_id}
                        onChange={handleChange}
                        options={brandOptions}
                        placeholder="Selecione..."
                    />

                    <Input
                        label="Descrição"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Opcional"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Unidade de Medida"
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        options={unitOptions}
                        required
                    />

                    <Input
                        label="Qtd por Unidade"
                        name="conversion_factor"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.conversion_factor}
                        onChange={handleChange}
                        placeholder="Ex: 10 (se 1 un = 10ml)"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label={`Qtd Atual (${formData.unit})`}
                        name="current_quantity"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.current_quantity}
                        onChange={handleChange}
                        error={errors.current_quantity}
                        required
                    />

                    <Input
                        label={`Estoque Mínimo (${formData.unit})`}
                        name="min_quantity"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.min_quantity}
                        onChange={handleChange}
                        error={errors.min_quantity}
                        required
                    />
                </div>

                <div className="p-3 rounded-lg bg-[var(--color-neutral-800)] border border-[var(--color-neutral-700)]">
                    <p className="text-xs text-[var(--color-neutral-400)]">
                        💡 <strong>Dica:</strong> Se você compra em frascos mas usa em ml, coloque a unidade como <strong>ml</strong> e em "Qtd por Unidade" coloque quantos ml vem em 1 frasco (ex: 10).
                    </p>
                </div>
            </form>
        </Modal>
    )
}
