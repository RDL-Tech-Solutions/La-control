import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Formata um valor como moeda brasileira (BRL)
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado em BRL
 */
export function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return 'R$ 0,00'
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value)
}

/**
 * Formata uma data para exibição
 * @param {string|Date} date - Data a ser formatada
 * @param {string} formatStr - Formato de saída (padrão: 'dd/MM/yyyy')
 * @returns {string} Data formatada
 */
export function formatDate(date, formatStr = 'dd/MM/yyyy') {
    if (!date) return '-'

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        if (!isValid(dateObj)) return '-'
        return format(dateObj, formatStr, { locale: ptBR })
    } catch {
        return '-'
    }
}

/**
 * Formata data e hora para exibição
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data e hora formatadas
 */
export function formatDateTime(date) {
    return formatDate(date, "dd/MM/yyyy 'às' HH:mm")
}

/**
 * Formata data para input HTML (yyyy-MM-dd)
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data no formato para input
 */
export function formatDateForInput(date) {
    if (!date) return ''

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        if (!isValid(dateObj)) return ''
        return format(dateObj, 'yyyy-MM-dd')
    } catch {
        return ''
    }
}

/**
 * Formata número para exibição
 * @param {number} value - Valor a ser formatado
 * @param {number} decimals - Número de casas decimais
 * @returns {string} Número formatado
 */
export function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined || isNaN(value)) {
        return '0'
    }

    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value)
}

/**
 * Retorna o nome do mês por extenso
 * @param {number} month - Número do mês (1-12)
 * @returns {string} Nome do mês
 */
export function getMonthName(month) {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months[month - 1] || ''
}

/**
 * Trunca texto com ellipsis
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Comprimento máximo
 * @returns {string} Texto truncado
 */
export function truncateText(text, maxLength = 50) {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}
