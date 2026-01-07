import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { useBrands } from './useBrands'

export default function BrandModal({ isOpen, onClose, brand }) {
    const { createBrand, updateBrand } = useBrands()
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState('')
    const [error, setError] = useState(null)

    useEffect(() => {
        if (brand) {
            setName(brand.name)
        } else {
            setName('')
        }
        setError(null)
    }, [brand, isOpen])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name.trim()) {
            setError('Nome é obrigatório')
            return
        }

        setLoading(true)
        try {
            if (brand) {
                await updateBrand(brand.id, { name })
            } else {
                await createBrand({ name })
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
            title={brand ? 'Editar Marca' : 'Nova Marca'}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} loading={loading}>
                        {brand ? 'Salvar' : 'Criar'}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit}>
                <Input
                    label="Nome da Marca"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value)
                        setError(null)
                    }}
                    error={error}
                    placeholder="Ex: Risqué"
                    required
                />
            </form>
        </Modal>
    )
}
