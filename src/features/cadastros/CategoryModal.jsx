import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { useCategories } from './useCategories'

export default function CategoryModal({ isOpen, onClose, category, onSuccess }) {
    const { createCategory, updateCategory } = useCategories()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({ name: '', prefix: '' })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (category) {
            setFormData({ name: category.name, prefix: category.prefix })
        } else {
            setFormData({ name: '', prefix: '' })
        }
        setErrors({})
    }, [category, isOpen])

    const handleChange = (e) => {
        const { name, value } = e.target
        // Force prefix to be uppercase
        const finalValue = name === 'prefix' ? value.toUpperCase() : value

        setFormData(prev => ({ ...prev, [name]: finalValue }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const newErrors = {}
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório'
        if (!formData.prefix.trim()) newErrors.prefix = 'Prefixo é obrigatório'
        if (formData.prefix.trim().length < 2) newErrors.prefix = 'Prefixo deve ter pelo menos 2 caracteres'

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        setLoading(true)
        try {
            if (category) {
                const updated = await updateCategory(category.id, formData)
                if (onSuccess) onSuccess(updated)
            } else {
                const created = await createCategory(formData)
                if (onSuccess) onSuccess(created)
            }
            onClose()
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={category ? 'Editar Categoria' : 'Nova Categoria'}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} loading={loading}>
                        {category ? 'Salvar' : 'Criar'}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome da Categoria"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    placeholder="Ex: Equipamento"
                    required
                />

                <div className="p-3 rounded-lg bg-[var(--color-neutral-800)] border border-[var(--color-neutral-700)] text-sm text-[var(--color-neutral-400)] mb-2">
                    O prefixo será usado para gerar o código dos produtos (ex: prefixo <strong>EQ</strong> gera <strong>EQ001</strong>).
                </div>

                <Input
                    label="Prefixo / Inicial do Código"
                    name="prefix"
                    value={formData.prefix}
                    onChange={handleChange}
                    error={errors.prefix}
                    placeholder="Ex: EQ"
                    maxLength={10}
                    required
                />
            </form>
        </Modal>
    )
}
