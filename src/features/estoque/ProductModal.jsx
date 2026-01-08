import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Button from '../../components/Button'
import { useProducts } from './useProducts'
import { useBrands } from '../cadastros/useBrands'
import { useUnits } from '../cadastros/useUnits'
import { useCategories } from '../cadastros/useCategories'
import { validateProduct } from '../../utils/validators'
import BrandModal from '../cadastros/BrandModal'
import CategoryModal from '../cadastros/CategoryModal'
import { Plus } from 'lucide-react'

export default function ProductModal({ isOpen, onClose, product }) {
    const { createProduct, updateProduct } = useProducts()
    const { brands } = useBrands()
    const { units } = useUnits()
    const { categories } = useCategories()

    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        brand_id: '',
        category_id: '',
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
                category_id: product.category_id || '',
                current_quantity: product.current_quantity || '',
                min_quantity: product.min_quantity || '',
                unit: product.unit || 'un',
                conversion_factor: product.conversion_factor || 1,
                code: product.code || ''
            })
        } else {
            setFormData({
                name: '',
                description: '',
                brand_id: '',
                category_id: '',
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
    const categoryOptions = categories.map(c => ({ value: c.id, label: `${c.name} (${c.prefix})` }))

    const handleChange = (e) => {
        const { name, value, type } = e.target

        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: type === 'number' ? (value === '' ? '' : value) : value
            }

            // Auto-fill conversion factor when unit changes
            if (name === 'unit') {
                const selectedUnit = units.find(u => u.abbreviation === value)
                if (selectedUnit && selectedUnit.default_value) {
                    newData.conversion_factor = selectedUnit.default_value
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

        // Prepare data for submission
        const dataToSubmit = {
            ...formData
        }

        // Clean up empty strings to null for optional foreign keys, but keep valid UUIDs
        if (!dataToSubmit.brand_id) dataToSubmit.brand_id = null
        if (!dataToSubmit.category_id) dataToSubmit.category_id = null

        // Remove unit_id from submission since we use unit (abbreviation) in the schema currently
        // Wait, checking schema... actually we use `unit` as string in products? 
        // Let's check validators.js or previous file view. 
        // Schema says: `unit VARCHAR(20) NOT NULL` (based on previous context, but let's double check logic)
        // validators.js checks `unit`.

        // Actually, looking at handleChange for units: `newData.unit = value`. 
        // So formData.unit_id is likely not used directly in insert if we map it to `unit`.
        // Let's re-verify lines 150+ in original file for Unit Select.

        // Re-reading code I can see `Select... name="unit" ... options={unitOptions}`.
        // So formData.unit matches the schema column `unit`. 
        // formData.unit_id was likely a mistake in my logical block above. 
        // I should remove `unit_id` from state if it's not used, or ignore it.
        // But let's stick to the target content.

        // We will just use `product` prop to set initial values correctly.

        console.log('Dados para validação:', dataToSubmit)
        const validData = validateProduct(dataToSubmit)
        console.log('Resultado da validação:', validData)

        if (!validData.valid) {
            setErrors(validData.errors)
            return
        }

        console.log('Tentando salvar no Supabase...')

        setLoading(true)
        try {
            // Se o usuário informou uma quantidade inicial, multiplicamos pelo fator de conversão
            const conversionFactor = parseFloat(formData.conversion_factor) || 1
            const initialQuantity = (parseFloat(formData.current_quantity) || 0) * conversionFactor

            const dataToSave = {
                name: formData.name,
                description: formData.description || null,
                brand_id: formData.brand_id || null,
                category_id: formData.category_id || null,
                unit: formData.unit,
                conversion_factor: conversionFactor,
                current_quantity: initialQuantity,
                min_quantity: parseFloat(formData.min_quantity) || 0,
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
                    error={errors.name}
                    placeholder="Ex: Esmalte Risqué Vermelho"
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <Select
                            label="Categoria"
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleChange}
                            options={categoryOptions}
                            placeholder="Selecione..."
                            className="pr-16" // Space for the code badge/button
                        />
                        <button
                            type="button"
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="absolute right-10 top-[38px] p-1 text-[var(--color-primary-400)] hover:text-[var(--color-primary-300)] transition-colors bg-[var(--color-neutral-900)]"
                            title="Nova Categoria"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="relative">
                        <Input
                            label="Código (Automático)"
                            name="code"
                            value={formData.code || 'Gerado ao salvar'}
                            readOnly
                            disabled
                            className="bg-[var(--color-neutral-800)] text-[var(--color-neutral-400)]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <Select
                            label="Marca"
                            name="brand_id"
                            value={formData.brand_id}
                            onChange={handleChange}
                            options={brandOptions}
                            placeholder="Selecione..."
                        />
                        <button
                            type="button"
                            onClick={() => setIsBrandModalOpen(true)}
                            className="absolute right-10 top-[38px] p-1 text-[var(--color-primary-400)] hover:text-[var(--color-primary-300)] transition-colors bg-[var(--color-neutral-900)]"
                            title="Nova Marca"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

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
                        label="Qtd Inicial (em unidades)"
                        name="current_quantity"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.current_quantity}
                        onChange={handleChange}
                        error={errors.current_quantity}
                        placeholder="Ex: 2 (frascos)"
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

            <BrandModal
                isOpen={isBrandModalOpen}
                onClose={() => setIsBrandModalOpen(false)}
                onSuccess={(newBrand) => {
                    setFormData(prev => ({ ...prev, brand_id: newBrand.id }))
                    setIsBrandModalOpen(false)
                }}
            />

            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSuccess={(newCategory) => {
                    setFormData(prev => ({ ...prev, category_id: newCategory.id }))
                    setIsCategoryModalOpen(false)
                }}
            />
        </Modal>
    )
}
