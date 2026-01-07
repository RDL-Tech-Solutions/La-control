import { useEffect, useState } from 'react'
import {
    Package,
    Scissors,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    DollarSign,
    Calendar,
    ArrowUpRight
} from 'lucide-react'
import { useProducts } from '../features/estoque/useProducts'
import { useServices } from '../features/servicos/useServices'
import { useFinancial } from '../features/financeiro/useFinancial'
import StatCard from '../components/StatCard'
import { LoadingPage } from '../components/LoadingSpinner'
import { formatCurrency, formatDate, getMonthName } from '../utils/formatters'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
    const { products, loading: productsLoading, getLowStockProducts } = useProducts()
    const { services, loading: servicesLoading } = useServices()
    const { summary, loading: financialLoading, fetchRecords } = useFinancial()

    const [currentMonth] = useState(() => {
        const now = new Date()
        return { month: now.getMonth() + 1, year: now.getFullYear() }
    })

    useEffect(() => {
        // Fetch current month records
        const startDate = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-01`
        const endDate = new Date(currentMonth.year, currentMonth.month, 0).toISOString().split('T')[0]
        fetchRecords({ startDate, endDate })
    }, [currentMonth, fetchRecords])

    const loading = productsLoading || servicesLoading || financialLoading

    if (loading) {
        return <LoadingPage />
    }

    const lowStockProducts = getLowStockProducts()
    const todayServices = services.filter(s => {
        const serviceDate = new Date(s.date).toDateString()
        const today = new Date().toDateString()
        return serviceDate === today
    })

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">
                        {getMonthName(currentMonth.month)} de {currentMonth.year}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid-stats mb-6">
                <StatCard
                    icon={TrendingUp}
                    label="Receitas"
                    value={formatCurrency(summary.totalIncome)}
                    variant="success"
                />
                <StatCard
                    icon={TrendingDown}
                    label="Despesas"
                    value={formatCurrency(summary.totalExpense)}
                    variant="error"
                />
                <StatCard
                    icon={DollarSign}
                    label="Lucro"
                    value={formatCurrency(summary.profit)}
                    variant={summary.profit >= 0 ? 'accent' : 'error'}
                />
                <StatCard
                    icon={Scissors}
                    label="Serviços Hoje"
                    value={todayServices.length}
                    variant="primary"
                />
            </div>

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Low Stock Alert */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-[var(--color-warning-400)]" />
                            Estoque Baixo
                        </h2>
                        <Link to="/estoque" className="text-sm text-[var(--color-primary-400)] hover:text-[var(--color-primary-300)] flex items-center gap-1">
                            Ver tudo <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {lowStockProducts.length === 0 ? (
                        <p className="text-[var(--color-neutral-400)] text-sm py-4 text-center">
                            Todos os produtos estão com estoque adequado! 🎉
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {lowStockProducts.slice(0, 5).map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-neutral-800)]/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--color-warning-500)]/15 flex items-center justify-center">
                                            <Package className="w-5 h-5 text-[var(--color-warning-400)]" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--color-neutral-100)]">{product.name}</p>
                                            <p className="text-xs text-[var(--color-neutral-400)]">
                                                Mínimo: {product.min_quantity}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`stock-indicator ${product.current_quantity === 0 ? 'out' : 'low'}`}>
                                        {product.current_quantity} un
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Services */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-[var(--color-primary-400)]" />
                            Serviços Recentes
                        </h2>
                        <Link to="/servicos" className="text-sm text-[var(--color-primary-400)] hover:text-[var(--color-primary-300)] flex items-center gap-1">
                            Ver tudo <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {services.length === 0 ? (
                        <p className="text-[var(--color-neutral-400)] text-sm py-4 text-center">
                            Nenhum serviço registrado ainda.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {services.slice(0, 5).map((service) => (
                                <div
                                    key={service.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-neutral-800)]/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-500)]/15 flex items-center justify-center">
                                            <Scissors className="w-5 h-5 text-[var(--color-primary-400)]" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--color-neutral-100)]">{service.client_name}</p>
                                            <p className="text-xs text-[var(--color-neutral-400)]">
                                                {service.service_type?.name} • {formatDate(service.date)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[var(--color-success-400)] font-medium">
                                        {formatCurrency(service.price)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[var(--color-primary-600)]/20 to-[var(--color-accent-500)]/10 border border-[var(--color-primary-600)]/30">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-[var(--color-neutral-300)]">Resumo Geral</p>
                        <p className="text-lg font-semibold text-[var(--color-neutral-100)]">
                            {products.length} produtos • {services.length} serviços realizados
                        </p>
                    </div>
                    <Link to="/relatorios">
                        <button className="btn btn-accent btn-sm">
                            Ver Relatórios
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
