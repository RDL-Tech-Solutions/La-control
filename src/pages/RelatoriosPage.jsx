import { useState, useEffect } from 'react'
import {
    FileText,
    Download,
    Package,
    Scissors,
    DollarSign,
    FileSpreadsheet,
    Calendar
} from 'lucide-react'
import { useProducts } from '../features/estoque/useProducts'
import { useServices } from '../features/servicos/useServices'
import { useFinancial } from '../features/financeiro/useFinancial'
import Button from '../components/Button'
import { LoadingPage } from '../components/LoadingSpinner'
import { formatCurrency, formatDate, getMonthName } from '../utils/formatters'
import { exportToPdf, exportToExcel } from '../utils/exporters'
import toast from 'react-hot-toast'

export default function RelatoriosPage() {
    const { products, loading: productsLoading } = useProducts()
    const { services, loading: servicesLoading, fetchServices } = useServices()
    const { records, summary, loading: financialLoading, fetchRecords } = useFinancial()

    const [selectedReport, setSelectedReport] = useState('estoque')
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })
    const [exporting, setExporting] = useState(false)

    const loading = productsLoading || servicesLoading || financialLoading

    // Fetch data when month changes
    useEffect(() => {
        const [year, month] = selectedMonth.split('-')
        const startDate = `${year}-${month}-01`
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]

        fetchServices({ startDate, endDate })
        fetchRecords({ startDate, endDate })
    }, [selectedMonth, fetchServices, fetchRecords])

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

    const [year, month] = selectedMonth.split('-')
    const monthLabel = `${getMonthName(parseInt(month))} ${year}`

    const handleExportPdf = async () => {
        setExporting(true)
        try {
            let data, title, columns

            switch (selectedReport) {
                case 'estoque':
                    title = 'Relatório de Estoque'
                    columns = ['Código', 'Produto', 'Categoria', 'Saldo', 'Mínimo', 'Alerta', 'Custo Unit.', 'Valor Total']
                    data = products.map(p => {
                        const totalValue = (p.current_quantity || 0) * (p.last_unit_cost || 0)
                        const isLow = p.current_quantity <= (p.min_quantity || 0)
                        return [
                            p.code || '-',
                            p.name,
                            p.categories?.name || '-',
                            `${p.current_quantity} ${p.unit || 'un'}`,
                            `${p.min_quantity} ${p.unit || 'un'}`,
                            isLow ? 'ESTOQUE BAIXO' : 'OK',
                            formatCurrency(p.last_unit_cost || 0),
                            formatCurrency(totalValue)
                        ]
                    })
                    break

                case 'servicos':
                    title = `Relatório de Serviços - ${monthLabel}`
                    columns = ['Cliente', 'Serviço', 'Data', 'Valor', 'Custo Mat.', 'Lucro']
                    data = services.map(s => {
                        const profit = (s.price || 0) - (s.product_cost || 0)
                        return [
                            s.client_name,
                            s.service_type?.name || '-',
                            formatDate(s.date),
                            formatCurrency(s.price),
                            formatCurrency(s.product_cost || 0),
                            formatCurrency(profit)
                        ]
                    })
                    break

                case 'financeiro':
                    title = `Relatório Financeiro - ${monthLabel}`
                    columns = ['Tipo', 'Descrição', 'Data', 'Valor']
                    data = records.map(r => [
                        r.type === 'income' ? 'Receita' : 'Despesa',
                        r.description,
                        formatDate(r.date),
                        formatCurrency(r.amount)
                    ])
                    break

                default:
                    return
            }

            const summaryInfo = selectedReport === 'financeiro' ? {
                totalIncome: summary.totalIncome,
                totalExpense: summary.totalExpense,
                profit: summary.profit,
            } : null

            await exportToPdf(title, columns, data, summaryInfo)
            toast.success('PDF exportado com sucesso!')
        } catch (error) {
            console.error('Error exporting PDF:', error)
            toast.error('Erro ao exportar PDF')
        } finally {
            setExporting(false)
        }
    }

    const handleExportExcel = async () => {
        setExporting(true)
        try {
            let data, filename, headers

            switch (selectedReport) {
                case 'estoque':
                    filename = 'estoque'
                    headers = ['Código', 'Nome', 'Categoria', 'Descrição', 'Saldo', 'Mínimo', 'Unidade', 'Status', 'Custo Unit.', 'Valor Total']
                    data = products.map(p => {
                        const totalValue = (p.current_quantity || 0) * (p.last_unit_cost || 0)
                        const isLow = p.current_quantity <= (p.min_quantity || 0)
                        return {
                            'Código': p.code || '-',
                            'Nome': p.name,
                            'Categoria': p.categories?.name || '-',
                            'Descrição': p.description || '',
                            'Saldo': p.current_quantity,
                            'Mínimo': p.min_quantity || 0,
                            'Unidade': p.unit || 'un',
                            'Status': isLow ? 'ESTOQUE BAIXO' : 'OK',
                            'Custo Unit.': p.last_unit_cost || 0,
                            'Valor Total': totalValue,
                        }
                    })
                    break

                case 'servicos':
                    filename = `servicos_${selectedMonth}`
                    headers = ['Cliente', 'Serviço', 'Data', 'Valor', 'Custo Materiais', 'Lucro', 'Observações']
                    data = services.map(s => ({
                        'Cliente': s.client_name,
                        'Serviço': s.service_type?.name || '',
                        'Data': formatDate(s.date),
                        'Valor': s.price,
                        'Custo Materiais': s.product_cost || 0,
                        'Lucro': (s.price || 0) - (s.product_cost || 0),
                        'Observações': s.notes || '',
                    }))
                    break

                case 'financeiro':
                    filename = `financeiro_${selectedMonth}`
                    headers = ['Tipo', 'Descrição', 'Data', 'Valor']
                    data = records.map(r => ({
                        'Tipo': r.type === 'income' ? 'Receita' : 'Despesa',
                        'Descrição': r.description,
                        'Data': formatDate(r.date),
                        'Valor': r.amount,
                    }))
                    break

                default:
                    return
            }

            await exportToExcel(data, filename, headers)
            toast.success('Excel exportado com sucesso!')
        } catch (error) {
            console.error('Error exporting Excel:', error)
            toast.error('Erro ao exportar Excel')
        } finally {
            setExporting(false)
        }
    }

    const reports = [
        {
            id: 'estoque',
            title: 'Estoque',
            description: 'Relatório completo de todos os produtos',
            icon: Package,
            count: products.length,
            countLabel: 'produtos',
        },
        {
            id: 'servicos',
            title: 'Serviços',
            description: `Serviços realizados em ${monthLabel}`,
            icon: Scissors,
            count: services.length,
            countLabel: 'serviços',
        },
        {
            id: 'financeiro',
            title: 'Financeiro',
            description: `Receitas e despesas de ${monthLabel}`,
            icon: DollarSign,
            count: records.length,
            countLabel: 'registros',
        },
    ]

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Relatórios</h1>
                    <p className="page-subtitle">
                        Exporte seus dados em PDF ou Excel
                    </p>
                </div>
            </div>

            {/* Month Filter */}
            <div className="mb-6">
                <label className="input-label mb-2 block">Período</label>
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="filter-select"
                >
                    {monthOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Report Cards */}
            <div className="grid gap-4 mb-8">
                {reports.map((report) => (
                    <button
                        key={report.id}
                        onClick={() => setSelectedReport(report.id)}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${selectedReport === report.id
                            ? 'bg-[var(--color-primary-500)]/10 border-[var(--color-primary-500)] shadow-lg shadow-[var(--color-primary-500)]/10'
                            : 'bg-[var(--color-neutral-900)] border-[var(--color-neutral-800)] hover:border-[var(--color-neutral-700)]'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedReport === report.id
                                ? 'bg-[var(--color-primary-500)]/20 text-[var(--color-primary-400)]'
                                : 'bg-[var(--color-neutral-800)] text-[var(--color-neutral-400)]'
                                }`}>
                                <report.icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-[var(--color-neutral-100)]">
                                    {report.title}
                                </h3>
                                <p className="text-sm text-[var(--color-neutral-400)]">
                                    {report.description}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-[var(--color-neutral-100)]">
                                    {report.count}
                                </span>
                                <p className="text-xs text-[var(--color-neutral-500)]">
                                    {report.countLabel}
                                </p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Export Actions */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title flex items-center gap-2">
                        <Download className="w-5 h-5 text-[var(--color-primary-400)]" />
                        Exportar Relatório
                    </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <button
                        onClick={handleExportPdf}
                        disabled={exporting}
                        className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-neutral-800)] border border-[var(--color-neutral-700)] hover:border-[var(--color-primary-500)] transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-red-400" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-[var(--color-neutral-100)] group-hover:text-[var(--color-primary-400)] transition-colors">
                                Exportar PDF
                            </h3>
                            <p className="text-sm text-[var(--color-neutral-400)]">
                                Relatório formatado para impressão
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={handleExportExcel}
                        disabled={exporting}
                        className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-neutral-800)] border border-[var(--color-neutral-700)] hover:border-[var(--color-primary-500)] transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center">
                            <FileSpreadsheet className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-[var(--color-neutral-100)] group-hover:text-[var(--color-primary-400)] transition-colors">
                                Exportar Excel
                            </h3>
                            <p className="text-sm text-[var(--color-neutral-400)]">
                                Dados brutos em planilha
                            </p>
                        </div>
                    </button>
                </div>

                {exporting && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-[var(--color-neutral-300)]">
                        <div className="loading-spinner w-4 h-4" />
                        <span>Gerando arquivo...</span>
                    </div>
                )}
            </div>

            {/* Preview Section */}
            <div className="mt-6 card">
                <div className="card-header">
                    <h2 className="card-title">Prévia do Relatório</h2>
                    <span className="badge badge-primary">
                        {reports.find(r => r.id === selectedReport)?.title}
                    </span>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            {selectedReport === 'estoque' && (
                                <tr>
                                    <th>Código</th>
                                    <th>Produto</th>
                                    <th>Saldo</th>
                                    <th>Mínimo</th>
                                    <th>Status</th>
                                    <th>Valor Total</th>
                                </tr>
                            )}
                            {selectedReport === 'servicos' && (
                                <tr>
                                    <th>Cliente</th>
                                    <th>Serviço</th>
                                    <th>Valor</th>
                                    <th>Lucro</th>
                                </tr>
                            )}
                            {selectedReport === 'financeiro' && (
                                <tr>
                                    <th>Tipo</th>
                                    <th>Descrição</th>
                                    <th>Data</th>
                                    <th>Valor</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {selectedReport === 'estoque' && products.slice(0, 5).map((p) => {
                                const isLow = p.current_quantity <= (p.min_quantity || 0)
                                return (
                                    <tr key={p.id}>
                                        <td>
                                            {p.code ? (
                                                <span className="font-mono text-xs">{p.code}</span>
                                            ) : '-'}
                                        </td>
                                        <td>{p.name}</td>
                                        <td>{p.current_quantity} {p.unit || 'un'}</td>
                                        <td>{p.min_quantity} {p.unit || 'un'}</td>
                                        <td>
                                            <span className={`badge ${isLow ? 'badge-error' : 'badge-success'} text-[10px]`}>
                                                {isLow ? 'ESTOQUE BAIXO' : 'OK'}
                                            </span>
                                        </td>
                                        <td>{formatCurrency((p.current_quantity || 0) * (p.last_unit_cost || 0))}</td>
                                    </tr>
                                )
                            })}
                            {selectedReport === 'servicos' && services.slice(0, 5).map((s) => (
                                <tr key={s.id}>
                                    <td>{s.client_name}</td>
                                    <td>{s.service_type?.name || '-'}</td>
                                    <td>{formatCurrency(s.price)}</td>
                                    <td className="text-[var(--color-success-400)] font-medium">
                                        {formatCurrency((s.price || 0) - (s.product_cost || 0))}
                                    </td>
                                </tr>
                            ))}
                            {selectedReport === 'financeiro' && records.slice(0, 5).map((r) => (
                                <tr key={r.id}>
                                    <td>
                                        <span className={`badge ${r.type === 'income' ? 'badge-success' : 'badge-error'}`}>
                                            {r.type === 'income' ? 'Receita' : 'Despesa'}
                                        </span>
                                    </td>
                                    <td>{r.description}</td>
                                    <td>{formatDate(r.date)}</td>
                                    <td className={r.type === 'income' ? 'text-[var(--color-success-400)]' : 'text-[var(--color-error-400)]'}>
                                        {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {((selectedReport === 'estoque' && products.length > 5) ||
                    (selectedReport === 'servicos' && services.length > 5) ||
                    (selectedReport === 'financeiro' && records.length > 5)) && (
                        <p className="text-center text-sm text-[var(--color-neutral-400)] mt-4">
                            Mostrando 5 de {
                                selectedReport === 'estoque' ? products.length :
                                    selectedReport === 'servicos' ? services.length :
                                        records.length
                            } registros. Exporte para ver todos.
                        </p>
                    )}
            </div>
        </div>
    )
}
