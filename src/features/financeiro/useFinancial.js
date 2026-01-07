import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

// Shared state for all instances of useFinancial
let globalRecords = []
let globalSummary = {
    totalIncome: 0,
    totalExpense: 0,
    profit: 0,
}
let globalLoading = true
let globalError = null
let listeners = []

const notifyListeners = () => {
    listeners.forEach(listener => {
        listener({
            records: [...globalRecords],
            summary: { ...globalSummary },
            loading: globalLoading,
            error: globalError
        })
    })
}

export function useFinancial() {
    const [state, setState] = useState({
        records: globalRecords,
        summary: globalSummary,
        loading: globalLoading,
        error: globalError
    })

    const fetchRecords = useCallback(async (filters = {}) => {
        try {
            globalLoading = true
            notifyListeners()

            let query = supabase
                .from('financial_records')
                .select('*')
                .order('date', { ascending: false })

            // Apply filters
            if (filters.type) {
                query = query.eq('type', filters.type)
            }
            if (filters.startDate) {
                query = query.gte('date', filters.startDate)
            }
            if (filters.endDate) {
                query = query.lte('date', filters.endDate)
            }

            const { data, error } = await query

            if (error) throw error

            globalRecords = data || []

            // Calculate summary
            const totalIncome = globalRecords
                ?.filter(r => r.type === 'income')
                .reduce((sum, r) => sum + (r.amount || 0), 0) || 0

            const totalExpense = globalRecords
                ?.filter(r => r.type === 'expense')
                .reduce((sum, r) => sum + (r.amount || 0), 0) || 0

            globalSummary = {
                totalIncome,
                totalExpense,
                profit: totalIncome - totalExpense,
            }

            globalError = null
        } catch (err) {
            console.error('Error fetching financial records:', err)
            globalError = err.message
            toast.error('Erro ao carregar registros financeiros')
        } finally {
            globalLoading = false
            notifyListeners()
        }
    }, [])

    useEffect(() => {
        const listener = (newState) => setState(newState)
        listeners.push(listener)

        // If it's the first time or we have no data, fetch
        if (globalRecords.length === 0 && globalLoading) {
            fetchRecords()
        }

        return () => {
            listeners = listeners.filter(l => l !== listener)
        }
    }, [fetchRecords])

    const fetchMonthlySummary = useCallback(async (year, month) => {
        try {
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`
            const endDate = new Date(year, month, 0).toISOString().split('T')[0]

            const { data, error } = await supabase
                .from('financial_records')
                .select('type, amount')
                .gte('date', startDate)
                .lte('date', endDate)

            if (error) throw error

            const totalIncome = data
                ?.filter(r => r.type === 'income')
                .reduce((sum, r) => sum + (r.amount || 0), 0) || 0

            const totalExpense = data
                ?.filter(r => r.type === 'expense')
                .reduce((sum, r) => sum + (r.amount || 0), 0) || 0

            return {
                totalIncome,
                totalExpense,
                profit: totalIncome - totalExpense,
            }
        } catch (err) {
            console.error('Error fetching monthly summary:', err)
            throw err
        }
    }, [])

    const getMonthlyTrend = useCallback(async (months = 6) => {
        try {
            const today = new Date()
            const trends = []

            for (let i = months - 1; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
                const year = date.getFullYear()
                const month = date.getMonth() + 1

                const summary = await fetchMonthlySummary(year, month)
                trends.push({
                    year,
                    month,
                    ...summary,
                })
            }

            return trends
        } catch (err) {
            console.error('Error fetching monthly trend:', err)
            throw err
        }
    }, [fetchMonthlySummary])

    return {
        records: state.records,
        summary: state.summary,
        loading: state.loading,
        error: state.error,
        fetchRecords,
        fetchMonthlySummary,
        getMonthlyTrend,
    }
}
