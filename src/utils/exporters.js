import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { formatCurrency } from './formatters'

/**
 * Exporta dados para PDF
 * @param {string} title - Título do relatório
 * @param {string[]} columns - Nomes das colunas
 * @param {any[][]} data - Dados em formato de array de arrays
 * @param {object} summaryInfo - Informações de resumo (opcional)
 */
export async function exportToPdf(title, columns, data, summaryInfo = null) {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.setTextColor(190, 24, 93) // Primary color
    doc.text('LA Control', 14, 20)

    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(title, 14, 30)

    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 38)

    // Summary if provided (for financial reports)
    let startY = 45
    if (summaryInfo) {
        doc.setFillColor(248, 248, 248)
        doc.rect(14, startY, 182, 25, 'F')

        doc.setFontSize(10)
        doc.setTextColor(50, 50, 50)

        doc.text('Resumo Financeiro', 18, startY + 8)

        doc.setFontSize(9)
        doc.setTextColor(34, 197, 94) // Green
        doc.text(`Receitas: ${formatCurrency(summaryInfo.totalIncome)}`, 18, startY + 16)

        doc.setTextColor(239, 68, 68) // Red
        doc.text(`Despesas: ${formatCurrency(summaryInfo.totalExpense)}`, 80, startY + 16)

        if (summaryInfo.profit >= 0) {
            doc.setTextColor(34, 197, 94) // Green
        } else {
            doc.setTextColor(239, 68, 68) // Red
        }
        doc.text(`Lucro: ${formatCurrency(summaryInfo.profit)}`, 140, startY + 16)

        startY += 30
    }

    // Table
    autoTable(doc, {
        head: [columns],
        body: data,
        startY: startY,
        styles: {
            fontSize: 9,
            cellPadding: 4,
        },
        headStyles: {
            fillColor: [190, 24, 93],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: [248, 248, 248],
        },
        margin: { top: 10 },
    })

    // Footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
            `Página ${i} de ${pageCount} - LA Control`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        )
    }

    // Save
    const filename = `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
}

/**
 * Exporta dados para Excel (XLSX)
 * @param {object[]} data - Array de objetos com os dados
 * @param {string} filename - Nome do arquivo (sem extensão)
 * @param {string[]} headers - Headers customizados (opcional)
 */
export async function exportToExcel(data, filename, headers = null) {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(data, {
        header: headers,
    })

    // Set column widths
    const colWidths = headers
        ? headers.map(h => ({ wch: Math.max(h.length + 2, 15) }))
        : Object.keys(data[0] || {}).map(k => ({ wch: Math.max(k.length + 2, 15) }))

    worksheet['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados')

    // Generate filename with date
    const fullFilename = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`

    // Save file
    XLSX.writeFile(workbook, fullFilename)
}
