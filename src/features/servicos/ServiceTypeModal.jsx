import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Button from '../../components/Button'
import { useServiceTypes } from './useServiceTypes'
import { validateServiceType } from '../../utils/validators'
import { Plus, X, Package } from 'lucide-react'

export default function ServiceTypeModal({ isOpen, onClose, serviceType, products }) {
    const { createServiceType, updateServiceType, deleteServiceType } = useServiceTypes()
    const [loading, setLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [errors, setErrors] = useState({})

    const [formData, setFormData] = useState({
        name: '',
        price: '',
    })

    const [selectedProducts, setSelectedProducts] = useState([])

    useEffect(() => {
        if (serviceType) {
            setFormData({
                name: serviceType.name || '',
                price: serviceType.price || '',
            })
            setSelectedProducts(
                serviceType.service_products?.map(sp => ({
                    product_id: sp.product_id,
                    default_quantity: sp.default_quantity,
                })) || []
            )
        } else {
            setFormData({ name: '', price: '' })
            setSelectedProducts([])
        }
        setErrors({})
    }, [serviceType, isOpen])

    const availableProducts = products.filter(
        p => !selectedProducts.find(sp => sp.product_id === p.id)
    )

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

    const addProduct = () => {
        if (availableProducts.length === 0) return
        setSelectedProducts(prev => [
            ...prev,
            { product_id: '', default_quantity: 1 }
        ])
    }

    const removeProduct = (index) => {
        setSelectedProducts(prev => prev.filter((_, i) => i !== index))
    }

    const updateSelectedProduct = (index, field, value) => {
        setSelectedProducts(prev =>
            prev.map((sp, i) =>
                i === index
                    ? { ...sp, [field]: field === 'default_quantity' ? (value === '' ? '' : value) : value }
                    : sp
            )
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const validation = validateServiceType(formData)
        if (!validation.valid) {
            setErrors(validation.errors)
            return
        }

        // Filter out empty product selections
        const validProducts = selectedProducts.filter(sp => sp.product_id)

        setLoading(true)
        try {
            const dataToSave = {
                ...formData,
                price: parseFloat(formData.price) || 0,
            }

            if (serviceType) {
                await updateServiceType(serviceType.id, dataToSave, validProducts)
            } else {
                await createServiceType(dataToSave, validProducts)
            }
            onClose()
        } catch (error) {
            console.error('Error saving service type:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!serviceType) return

        setDeleteLoading(true)
        try {
            await deleteServiceType(serviceType.id)
            onClose()
        } catch (error) {
            console.error('Error deleting service type:', error)
        } finally {
            setDeleteLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={serviceType ? 'Editar Tipo de Serviço' : 'Novo Tipo de Serviço'}
            size="lg"
            footer={
                <div className="flex w-full justify-between">
                    {serviceType ? (
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            loading={deleteLoading}
                            disabled={loading}
                        >
                            Excluir
                        </Button>
                    ) : (
                        <div />
                    )}
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose} disabled={loading || deleteLoading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} loading={loading} disabled={deleteLoading}>
                            {serviceType ? 'Salvar Alterações' : 'Criar Tipo'}
                        </Button>
                    </div>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Nome do Serviço"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ex: Alongamento em Gel"
                        error={errors.name}
                        required
                    />

                    <Input
                        label="Preço (R$)"
                        name="price"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0,00"
                        error={errors.price}
                        required
                    />
                </div>

                {/* Products Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="input-label">Produtos Utilizados</label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={Plus}
                            onClick={addProduct}
                            disabled={availableProducts.length === 0 && selectedProducts.every(sp => sp.product_id)}
                        >
                            Adicionar
                        </Button>
                    </div>

                    {selectedProducts.length === 0 ? (
                        <div className="p-4 rounded-lg bg-[var(--color-neutral-800)] border border-dashed border-[var(--color-neutral-700)] text-center">
                            <Package className="w-8 h-8 mx-auto text-[var(--color-neutral-500)] mb-2" />
                            <p className="text-sm text-[var(--color-neutral-400)]">
                                Nenhum produto vinculado
                            </p>
                            <p className="text-xs text-[var(--color-neutral-500)] mt-1">
                                Adicione produtos que serão descontados do estoque ao realizar este serviço
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {selectedProducts.map((sp, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-neutral-800)]"
                                >
                                    <div className="flex-1">
                                        <Select
                                            options={[
                                                ...products
                                                    .filter(p => p.id === sp.product_id || !selectedProducts.find(s => s.product_id === p.id))
                                                    .map(p => ({ value: p.id, label: p.name }))
                                            ]}
                                            value={sp.product_id}
                                            onChange={(e) => updateSelectedProduct(index, 'product_id', e.target.value)}
                                            placeholder="Selecione um produto"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={sp.default_quantity}
                                            onChange={(e) => updateSelectedProduct(index, 'default_quantity', e.target.value)}
                                            placeholder="Qtd"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeProduct(index)}
                                        className="p-2 rounded-lg hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-400)] hover:text-[var(--color-error-400)] transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </form>
        </Modal>
    )
}
