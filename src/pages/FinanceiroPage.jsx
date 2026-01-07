import { useState, useEffect } from 'react'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Filter
} from 'lucide-react'
import { useFinancial } from '../features/financeiro/useFinancial'
import StatCard from '../components/StatCard'
import { LoadingPage } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { formatCurrency, formatDate, getMonthName } from '../utils/formatters'

export default function FinanceiroPage() {
    const { records, summary, loading, fetchRecords } = useFinancial()
    const [filter, setFilter] = useState('all') // 'all' | 'income' | 'expense'
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })

    useEffect(() => {
        const [year, month] = selectedMonth.split('-')
        const startDate = `${year}-${month}-01`
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]

        fetchRecords({
            startDate,
            endDate,
            type: filter === 'all' ? undefined : filter,
        })
    }, [selectedMonth, filter, fetchRecords])

    if (loading) {
        return <LoadingPage />
    }

    // Generate month options (last 12 months)
    const monthOptions = []
    const today = new Date()
    for (let i = 0; i < 12; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const label = `${getMonthName(date.getMonth() + 1)} ${date.getFullYear()}`
        monthOptions.push({ value, label })
    }

    const filteredRecords = records.filter(r => {
        if (filter === 'all') return true
        return r.type === filter
    })

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Financeiro</h1>
                    <p className="page-subtitle">
                        Acompanhe suas receitas e despesas
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="filter-select"
                >
                    {monthOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">Todos</option>
                    <option value="income">Receitas</option>
                    <option value="expense">Despesas</option>
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard
                    icon={TrendingUp}
                    label="Total Receitas"
                    value={formatCurrency(summary.totalIncome)}
                    variant="success"
                />
                <StatCard
                    icon={TrendingDown}
                    label="Total Despesas"
                    value={formatCurrency(summary.totalExpense)}
                    variant="error"
                />
                <StatCard
                    icon={DollarSign}
                    label="Lucro do Mês"
                    value={formatCurrency(summary.profit)}
                    variant={summary.profit >= 0 ? 'accent' : 'error'}
                />
            </div>

            {/* Profit Bar */}
            <div className="mb-6 p-4 rounded-xl bg-[var(--color-neutral-900)] border border-[var(--color-neutral-800)]">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-[var(--color-neutral-400)]">
                        Proporção Receitas vs Despesas
                    </span>
                    <span className={`text-sm font-medium ${summary.profit >= 0 ? 'text-[var(--color-success-400)]' : 'text-[var(--color-error-400)]'
                        }`}>
                        {summary.totalIncome > 0
                            ? `${Math.round((summary.profit / summary.totalIncome) * 100)}% de lucro`
                            : 'Sem receitas'
                        }
                    </span>
                </div>

                <div className="h-3 bg-[var(--color-neutral-800)] rounded-full overflow-hidden flex">
                    {summary.totalIncome > 0 && (
                        <div
                            className="h-full bg-gradient-to-r from-[var(--color-success-500)] to-[var(--color-success-400)]"
                            style={{
                                width: `${(summary.totalIncome / (summary.totalIncome + summary.totalExpense)) * 100}%`
                            }}
                        />
                    )}
                    {summary.totalExpense > 0 && (
                        <div
                            className="h-full bg-gradient-to-r from-[var(--color-error-500)] to-[var(--color-error-400)]"
                            style={{
                                width: `${(summary.totalExpense / (summary.totalIncome + summary.totalExpense)) * 100}%`
                            }}
                        />
                    )}
                </div>

                <div className="flex justify-between mt-2 text-xs">
                    <span className="text-[var(--color-success-400)]">
                        Receitas: {formatCurrency(summary.totalIncome)}
                    </span>
                    <span className="text-[var(--color-error-400)]">
                        Despesas: {formatCurrency(summary.totalExpense)}
                    </span>
                </div>
            </div>

            {/* Records List */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[var(--color-primary-400)]" />
                        Registros do Mês
                    </h2>
                    <span className="text-sm text-[var(--color-neutral-400)]">
                        {filteredRecords.length} registros
                    </span>
                </div>

                {filteredRecords.length === 0 ? (
                    <EmptyState
                        icon={DollarSign}
                        title="Nenhum registro encontrado"
                        description="Não há registros financeiros para o período selecionado"
                    />
                ) : (
                    <div className="space-y-2">
                        {filteredRecords.map((record) => (
                            <div
                                key={record.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-neutral-800)]/50 hover:bg-[var(--color-neutral-800)] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${record.type === 'income'
                                            ? 'bg-[var(--color-success-500)]/15'
                                            : 'bg-[var(--color-error-500)]/15'
                                        }`}>
                                        {record.type === 'income' ? (
                                            <ArrowUpRight className="w-5 h-5 text-[var(--color-success-400)]" />
                                        ) : (
                                            <ArrowDownRight className="w-5 h-5 text-[var(--color-error-400)]" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--color-neutral-100)]">
                                            {record.description}
                                        </p>
                                        <p className="text-xs text-[var(--color-neutral-400)]">
                                            {formatDate(record.date)}
                                        </p>
                                    </div>
                                </div>

                                <span className={`text-lg font-semibold ${record.type === 'income'
                                        ? 'text-[var(--color-success-400)]'
                                        : 'text-[var(--color-error-400)]'
                                    }`}>
                                    {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
