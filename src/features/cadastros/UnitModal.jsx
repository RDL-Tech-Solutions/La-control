import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { useUnits } from './useUnits'

export default function UnitModal({ isOpen, onClose, unit }) {
    const { createUnit, updateUnit } = useUnits()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({ name: '', abbreviation: '', default_value: 1 })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (unit) {
            setFormData({
                name: unit.name,
                abbreviation: unit.abbreviation,
                default_value: unit.default_value || 1
            })
        } else {
            setFormData({ name: '', abbreviation: '', default_value: 1 })
        }
        setErrors({})
    }, [unit, isOpen])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const newErrors = {}
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório'
        if (!formData.abbreviation.trim()) newErrors.abbreviation = 'Sigla é obrigatória'

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        setLoading(true)
        try {
            if (unit) {
                await updateUnit(unit.id, formData)
            } else {
                await createUnit(formData)
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
            title={unit ? 'Editar Unidade' : 'Nova Unidade'}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} loading={loading}>
                        {unit ? 'Salvar' : 'Criar'}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome da Unidade"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    placeholder="Ex: Mililitro"
                    required
                />
                <Input
                    label="Sigla / Abreviação"
                    name="abbreviation"
                    value={formData.abbreviation}
                    onChange={handleChange}
                    error={errors.abbreviation}
                    placeholder="Ex: ml"
                    required
                />
                <Input
                    label="Conversão (1 un = ?)"
                    name="default_value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.default_value}
                    onChange={handleChange}
                    error={errors.default_value}
                    placeholder="Ex: 5"
                    required
                />
                <p className="text-[10px] text-[var(--color-neutral-500)] mt-[-8px]">
                    Ex: Se você compra em frascos e cada um tem 5ml, coloque 5.
                    Ao registrar a entrada de 2 frascos, o sistema somará 10ml no estoque.
                </p>
            </form>
        </Modal>
    )
}
