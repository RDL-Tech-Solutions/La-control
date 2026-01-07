import { useState } from 'react'
import { Plus, Package, Edit2, Trash2, Search, ArrowDownToLine } from 'lucide-react'
import { useProducts } from '../features/estoque/useProducts'
import Button from '../components/Button'
import Input from '../components/Input'
import EmptyState from '../components/EmptyState'
import { LoadingPage } from '../components/LoadingSpinner'
import ConfirmDialog from '../components/ConfirmDialog'
import ProductModal from '../features/estoque/ProductModal'
import StockEntryModal from '../features/estoque/StockEntryModal'

export default function EstoquePage() {
    const { products, loading, deleteProduct } = useProducts()
    const [searchTerm, setSearchTerm] = useState('')
    const [productModalOpen, setProductModalOpen] = useState(false)
    const [entryModalOpen, setEntryModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [deletingProduct, setDeletingProduct] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    if (loading) {
        return <LoadingPage />
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleEdit = (product) => {
        setEditingProduct(product)
        setProductModalOpen(true)
    }

    const handleDelete = async () => {
        if (!deletingProduct) return

        setDeleteLoading(true)
        try {
            await deleteProduct(deletingProduct.id)
            setDeletingProduct(null)
        } catch (error) {
            console.error('Error deleting product:', error)
        } finally {
            setDeleteLoading(false)
        }
    }

    const getStockStatus = (product) => {
        if (product.current_quantity === 0) return 'out'
        if (product.current_quantity <= product.min_quantity) return 'low'
        return 'ok'
    }

    const getStockLabel = (status) => {
        switch (status) {
            case 'out': return 'Sem estoque'
            case 'low': return 'Estoque baixo'
            default: return 'Em estoque'
        }
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Estoque</h1>
                    <p className="page-subtitle">
                        Gerencie seus produtos e controle de quantidade
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        icon={ArrowDownToLine}
                        onClick={() => setEntryModalOpen(true)}
                    >
                        <span className="hidden sm:inline">Entrada</span>
                    </Button>
                    <Button
                        icon={Plus}
                        onClick={() => {
                            setEditingProduct(null)
                            setProductModalOpen(true)
                        }}
                    >
                        <span className="hidden sm:inline">Novo Produto</span>
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-neutral-400)]" />
                    <input
                        type="text"
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                    />
                </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
                <EmptyState
                    icon={Package}
                    title={searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                    description={searchTerm
                        ? 'Tente buscar por outro termo'
                        : 'Comece adicionando seu primeiro produto ao estoque'
                    }
                    action={!searchTerm ? () => setProductModalOpen(true) : undefined}
                    actionLabel="Adicionar Produto"
                    actionIcon={Plus}
                />
            ) : (
                <div className="grid-cards">
                    {filteredProducts.map((product) => {
                        const status = getStockStatus(product)
                        return (
                            <div key={product.id} className="item-card">
                                <div className="item-card-header">
                                    <div>
                                        <h3 className="item-card-title">{product.name}</h3>
                                        {product.brand && (
                                            <p className="text-xs text-[var(--color-primary-400)] font-medium mb-0.5">
                                                {product.brand.name}
                                            </p>
                                        )}
                                        {product.description && (
                                            <p className="item-card-subtitle">{product.description}</p>
                                        )}
                                    </div>
                                    <span className={`stock-indicator ${status}`}>
                                        {getStockLabel(status)}
                                    </span>
                                </div>

                                <div className="item-card-body">
                                    <div className="item-card-row">
                                        <span className="item-card-label">Quantidade atual</span>
                                        <span className={`item-card-value ${status === 'out' ? 'text-[var(--color-error-400)]' :
                                            status === 'low' ? 'text-[var(--color-warning-400)]' :
                                                'text-[var(--color-success-400)]'
                                            }`}>
                                            {product.current_quantity} {product.unit || 'un'}
                                        </span>
                                    </div>
                                    <div className="item-card-row">
                                        <span className="item-card-label">Estoque mínimo</span>
                                        <span className="item-card-value">
                                            {product.min_quantity} {product.unit || 'un'}
                                        </span>
                                    </div>
                                </div>

                                <div className="item-card-actions">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={Edit2}
                                        onClick={() => handleEdit(product)}
                                        className="flex-1"
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={Trash2}
                                        onClick={() => setDeletingProduct(product)}
                                        className="flex-1 hover:text-[var(--color-error-400)]"
                                    >
                                        Excluir
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Product Modal */}
            <ProductModal
                isOpen={productModalOpen}
                onClose={() => {
                    setProductModalOpen(false)
                    setEditingProduct(null)
                }}
                product={editingProduct}
            />

            {/* Stock Entry Modal */}
            <StockEntryModal
                isOpen={entryModalOpen}
                onClose={() => setEntryModalOpen(false)}
                products={products}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deletingProduct}
                onClose={() => setDeletingProduct(null)}
                onConfirm={handleDelete}
                title="Excluir Produto"
                message={`Tem certeza que deseja excluir "${deletingProduct?.name}"? Esta ação não pode ser desfeita.`}
                confirmLabel="Excluir"
                loading={deleteLoading}
            />
        </div>
    )
}
