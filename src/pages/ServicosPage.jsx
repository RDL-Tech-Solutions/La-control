import { useState } from 'react'
import { Plus, Scissors, Settings, Calendar, Search, Trash2 } from 'lucide-react'
import { useServices } from '../features/servicos/useServices'
import { useServiceTypes } from '../features/servicos/useServiceTypes'
import { useProducts } from '../features/estoque/useProducts'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import { LoadingPage } from '../components/LoadingSpinner'
import ConfirmDialog from '../components/ConfirmDialog'
import ServiceTypeModal from '../features/servicos/ServiceTypeModal'
import NewServiceModal from '../features/servicos/NewServiceModal'
import { formatCurrency, formatDate } from '../utils/formatters'

export default function ServicosPage() {
    const { services, loading: servicesLoading, deleteService } = useServices()
    const { serviceTypes, loading: typesLoading } = useServiceTypes()
    const { products, loading: productsLoading } = useProducts()

    const [activeTab, setActiveTab] = useState('services') // 'services' | 'types'
    const [searchTerm, setSearchTerm] = useState('')
    const [serviceTypeModalOpen, setServiceTypeModalOpen] = useState(false)
    const [newServiceModalOpen, setNewServiceModalOpen] = useState(false)
    const [editingServiceType, setEditingServiceType] = useState(null)
    const [deletingService, setDeletingService] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const loading = servicesLoading || typesLoading || productsLoading

    if (loading) {
        return <LoadingPage />
    }

    const filteredServices = services.filter(s =>
        s.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.service_type?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredTypes = serviceTypes.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleDeleteService = async () => {
        if (!deletingService) return

        setDeleteLoading(true)
        try {
            await deleteService(deletingService.id, deletingService)
            setDeletingService(null)
        } catch (error) {
            console.error('Error deleting service:', error)
        } finally {
            setDeleteLoading(false)
        }
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Serviços</h1>
                    <p className="page-subtitle">
                        Registre serviços e gerencie tipos de atendimento
                    </p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'services' ? (
                        <Button
                            icon={Plus}
                            onClick={() => setNewServiceModalOpen(true)}
                            disabled={serviceTypes.length === 0}
                        >
                            <span className="hidden sm:inline">Novo Serviço</span>
                        </Button>
                    ) : (
                        <Button
                            icon={Plus}
                            onClick={() => {
                                setEditingServiceType(null)
                                setServiceTypeModalOpen(true)
                            }}
                        >
                            <span className="hidden sm:inline">Novo Tipo</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[var(--color-neutral-800)]">
                <button
                    onClick={() => setActiveTab('services')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'services'
                        ? 'border-[var(--color-primary-500)] text-[var(--color-primary-400)]'
                        : 'border-transparent text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-200)]'
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Serviços Realizados
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('types')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'types'
                        ? 'border-[var(--color-primary-500)] text-[var(--color-primary-400)]'
                        : 'border-transparent text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-200)]'
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Tipos de Serviço
                    </span>
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-neutral-400)]" />
                    <input
                        type="text"
                        placeholder={activeTab === 'services' ? 'Buscar por cliente ou serviço...' : 'Buscar tipos...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                    />
                </div>
            </div>

            {/* Services Tab */}
            {activeTab === 'services' && (
                <>
                    {serviceTypes.length === 0 ? (
                        <EmptyState
                            icon={Settings}
                            title="Configure os tipos de serviço primeiro"
                            description="Antes de registrar serviços, você precisa criar pelo menos um tipo de serviço"
                            action={() => {
                                setActiveTab('types')
                                setServiceTypeModalOpen(true)
                            }}
                            actionLabel="Criar Tipo de Serviço"
                            actionIcon={Plus}
                        />
                    ) : filteredServices.length === 0 ? (
                        <EmptyState
                            icon={Scissors}
                            title={searchTerm ? 'Nenhum serviço encontrado' : 'Nenhum serviço registrado'}
                            description={searchTerm
                                ? 'Tente buscar por outro termo'
                                : 'Registre seu primeiro atendimento'
                            }
                            action={!searchTerm ? () => setNewServiceModalOpen(true) : undefined}
                            actionLabel="Registrar Serviço"
                            actionIcon={Plus}
                        />
                    ) : (
                        <div className="space-y-3">
                            {filteredServices.map((service) => (
                                <div
                                    key={service.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-neutral-900)] border border-[var(--color-neutral-800)] hover:border-[var(--color-neutral-700)] transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-500)]/15 flex items-center justify-center">
                                            <Scissors className="w-6 h-6 text-[var(--color-primary-400)]" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-[var(--color-neutral-100)]">
                                                {service.client_name}
                                            </h3>
                                            <p className="text-sm text-[var(--color-neutral-400)]">
                                                {service.service_type?.name} • {formatDate(service.date)}
                                            </p>
                                            {service.notes && (
                                                <p className="text-xs text-[var(--color-neutral-500)] mt-1">
                                                    {service.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className="text-lg font-semibold text-[var(--color-success-400)]">
                                            {formatCurrency(service.price)}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            icon={Trash2}
                                            onClick={() => setDeletingService(service)}
                                            className="hover:text-[var(--color-error-400)]"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Service Types Tab */}
            {activeTab === 'types' && (
                <>
                    {filteredTypes.length === 0 ? (
                        <EmptyState
                            icon={Settings}
                            title={searchTerm ? 'Nenhum tipo encontrado' : 'Nenhum tipo de serviço'}
                            description={searchTerm
                                ? 'Tente buscar por outro termo'
                                : 'Crie tipos de serviço para começar a registrar atendimentos'
                            }
                            action={!searchTerm ? () => setServiceTypeModalOpen(true) : undefined}
                            actionLabel="Criar Tipo de Serviço"
                            actionIcon={Plus}
                        />
                    ) : (
                        <div className="grid-cards">
                            {filteredTypes.map((type) => (
                                <div key={type.id} className="item-card">
                                    <div className="item-card-header">
                                        <div>
                                            <h3 className="item-card-title">{type.name}</h3>
                                            <p className="item-card-subtitle">
                                                {type.service_products?.length || 0} produtos vinculados
                                            </p>
                                        </div>
                                        <span className="text-lg font-bold text-[var(--color-accent-400)]">
                                            {formatCurrency(type.price)}
                                        </span>
                                    </div>

                                    {type.service_products?.length > 0 && (
                                        <div className="item-card-body">
                                            <p className="text-xs font-medium text-[var(--color-neutral-400)] uppercase mb-2">
                                                Produtos utilizados:
                                            </p>
                                            <div className="space-y-1">
                                                {type.service_products.map((sp) => (
                                                    <div
                                                        key={sp.id}
                                                        className="flex items-center justify-between text-sm"
                                                    >
                                                        <span className="text-[var(--color-neutral-300)]">
                                                            {sp.product?.code ? `[${sp.product.code}] ` : ''}{sp.product?.name}
                                                        </span>
                                                        <span className="text-[var(--color-neutral-500)]">
                                                            {sp.default_quantity} un
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="item-card-actions">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setEditingServiceType(type)
                                                setServiceTypeModalOpen(true)
                                            }}
                                            className="flex-1"
                                        >
                                            Editar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            <ServiceTypeModal
                isOpen={serviceTypeModalOpen}
                onClose={() => {
                    setServiceTypeModalOpen(false)
                    setEditingServiceType(null)
                }}
                serviceType={editingServiceType}
                products={products}
            />

            <NewServiceModal
                isOpen={newServiceModalOpen}
                onClose={() => setNewServiceModalOpen(false)}
                serviceTypes={serviceTypes}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deletingService}
                onClose={() => setDeletingService(null)}
                onConfirm={handleDeleteService}
                title="Excluir Serviço"
                message={`Tem certeza que deseja excluir o serviço de "${deletingService?.client_name}"? O estoque será restaurado e a receita será removida.`}
                confirmLabel="Excluir"
                loading={deleteLoading}
            />
        </div>
    )
}
