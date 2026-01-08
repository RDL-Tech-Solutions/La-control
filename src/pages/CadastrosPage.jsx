import { useState } from 'react'
import { Tag, Scale, Plus, Pencil, Trash2, FolderTree } from 'lucide-react'
import Button from '../components/Button'
import { useBrands } from '../features/cadastros/useBrands'
import { useUnits } from '../features/cadastros/useUnits'
import BrandModal from '../features/cadastros/BrandModal'
import UnitModal from '../features/cadastros/UnitModal'
import { useCategories } from '../features/cadastros/useCategories'
import CategoryModal from '../features/cadastros/CategoryModal'
import { LoadingPage } from '../components/LoadingSpinner'
import { RefreshCcw } from 'lucide-react'

export default function CadastrosPage() {
    const [activeTab, setActiveTab] = useState('brands')
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState(null)

    const { brands, loading: brandsLoading, deleteBrand } = useBrands()
    const { units, loading: unitsLoading, deleteUnit, resetToDefaults: resetUnits } = useUnits()
    const { categories, loading: categoriesLoading, deleteCategory, resetToDefaults: resetCategories } = useCategories()

    const loading = brandsLoading || unitsLoading || categoriesLoading
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

    if (loading) return <LoadingPage />

    const handleDeleteBrand = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta marca?')) {
            await deleteBrand(id)
        }
    }

    const handleDeleteUnit = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta unidade?')) {
            await deleteUnit(id)
        }
    }

    const handleDeleteCategory = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
            await deleteCategory(id)
        }
    }

    const handleResetDefaults = async () => {
        const type = activeTab === 'units' ? 'unidades' : 'categorias'
        if (window.confirm(`Deseja carregar os modelos padrão de ${type}? Isso não apagará seus dados existentes, apenas adicionará os que faltam.`)) {
            if (activeTab === 'units') await resetUnits()
            else await resetCategories()
        }
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Cadastros</h1>
                    <p className="page-subtitle">Gerencie marcas e unidades de medida</p>
                </div>
                <div className="flex gap-2">
                    {activeTab !== 'brands' && (
                        <Button
                            variant="secondary"
                            onClick={handleResetDefaults}
                            title="Carregar modelos padrão"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Padrões</span>
                        </Button>
                    )}
                    <Button onClick={() => {
                        setEditingItem(null)
                        if (activeTab === 'brands') setIsBrandModalOpen(true)
                        else if (activeTab === 'units') setIsUnitModalOpen(true)
                        else setIsCategoryModalOpen(true)
                    }}>
                        <Plus className="w-4 h-4 mr-2" />
                        {activeTab === 'brands' ? 'Nova Marca' : (activeTab === 'units' ? 'Nova Unidade' : 'Nova Categoria')}
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-[var(--color-neutral-800)] mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('brands')}
                    className={`pb-3 px-1 flex items-center gap-2 transition-colors relative whitespace-nowrap ${activeTab === 'brands'
                        ? 'text-[var(--color-primary-400)]'
                        : 'text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-200)]'
                        }`}
                >
                    <Tag className="w-4 h-4" />
                    Marcas
                    {activeTab === 'brands' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-primary-400)]" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('units')}
                    className={`pb-3 px-1 flex items-center gap-2 transition-colors relative whitespace-nowrap ${activeTab === 'units'
                        ? 'text-[var(--color-primary-400)]'
                        : 'text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-200)]'
                        }`}
                >
                    <Scale className="w-4 h-4" />
                    Unidades
                    {activeTab === 'units' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-primary-400)]" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`pb-3 px-1 flex items-center gap-2 transition-colors relative whitespace-nowrap ${activeTab === 'categories'
                        ? 'text-[var(--color-primary-400)]'
                        : 'text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-200)]'
                        }`}
                >
                    <FolderTree className="w-4 h-4" />
                    Categorias
                    {activeTab === 'categories' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-primary-400)]" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                {activeTab === 'brands' && (
                                    <>
                                        <th>Nome</th>
                                        <th className="w-24 text-right">Ações</th>
                                    </>
                                )}
                                {activeTab === 'units' && (
                                    <>
                                        <th>Nome</th>
                                        <th>Sigla</th>
                                        <th>Conversão (1 un = x)</th>
                                        <th className="w-24 text-right">Ações</th>
                                    </>
                                )}
                                {activeTab === 'categories' && (
                                    <>
                                        <th>Nome</th>
                                        <th>Prefixo</th>
                                        <th className="w-24 text-right">Ações</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {activeTab === 'brands' && (
                                brands.length === 0 ? (
                                    <tr>
                                        <td colSpan="2" className="text-center py-8 text-[var(--color-neutral-500)]">
                                            Nenhuma marca cadastrada
                                        </td>
                                    </tr>
                                ) : (
                                    brands.map(brand => (
                                        <tr key={brand.id}>
                                            <td>{brand.name}</td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingItem(brand)
                                                            setIsBrandModalOpen(true)
                                                        }}
                                                        className="p-1 hover:text-[var(--color-primary-400)] transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBrand(brand.id)}
                                                        className="p-1 hover:text-[var(--color-error-400)] transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )
                            )}

                            {activeTab === 'units' && (
                                units.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 text-[var(--color-neutral-500)]">
                                            Nenhuma unidade cadastrada
                                        </td>
                                    </tr>
                                ) : (
                                    units.map(unit => (
                                        <tr key={unit.id}>
                                            <td>{unit.name}</td>
                                            <td>
                                                <span className="badge badge-neutral">{unit.abbreviation}</span>
                                            </td>
                                            <td>{unit.default_value}</td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingItem(unit)
                                                            setIsUnitModalOpen(true)
                                                        }}
                                                        className="p-1 hover:text-[var(--color-primary-400)] transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUnit(unit.id)}
                                                        className="p-1 hover:text-[var(--color-error-400)] transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )
                            )}

                            {activeTab === 'categories' && (
                                categories.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center py-8 text-[var(--color-neutral-500)]">
                                            Nenhuma categoria cadastrada
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map(category => (
                                        <tr key={category.id}>
                                            <td>{category.name}</td>
                                            <td>
                                                <span className="badge badge-primary font-mono">{category.prefix}</span>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingItem(category)
                                                            setIsCategoryModalOpen(true)
                                                        }}
                                                        className="p-1 hover:text-[var(--color-primary-400)] transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(category.id)}
                                                        className="p-1 hover:text-[var(--color-error-400)] transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <BrandModal
                isOpen={isBrandModalOpen}
                onClose={() => {
                    setIsBrandModalOpen(false)
                    setEditingItem(null)
                }}
                brand={editingItem}
            />

            <UnitModal
                isOpen={isUnitModalOpen}
                onClose={() => {
                    setIsUnitModalOpen(false)
                    setEditingItem(null)
                }}
                unit={editingItem}
            />

            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => {
                    setIsCategoryModalOpen(false)
                    setEditingItem(null)
                }}
                category={editingItem}
            />
        </div>
    )
}
