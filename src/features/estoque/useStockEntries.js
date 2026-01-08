import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { useProducts } from './useProducts'

// Shared state for all instances of useStockEntries
let globalEntries = []
let globalLoading = true
let globalError = null
let listeners = []

const notifyListeners = () => {
    listeners.forEach(listener => {
        listener({
            entries: [...globalEntries],
            loading: globalLoading,
            error: globalError
        })
    })
}

export function useStockEntries() {
    const { fetchProducts } = useProducts()

    const [state, setState] = useState({
        entries: globalEntries,
        loading: globalLoading,
        error: globalError
    })

    const fetchEntries = useCallback(async (filters = {}) => {
        try {
            globalLoading = true
            notifyListeners()

            let query = supabase
                .from('stock_entries')
                .select(`
          *,
          product:products(id, name)
        `)
                .order('date', { ascending: false })

            // Apply filters
            if (filters.productId) {
                query = query.eq('product_id', filters.productId)
            }
            if (filters.startDate) {
                query = query.gte('date', filters.startDate)
            }
            if (filters.endDate) {
                query = query.lte('date', filters.endDate)
            }

            const { data, error } = await query

            if (error) throw error

            globalEntries = data || []
            globalError = null
        } catch (err) {
            console.error('Error fetching stock entries:', err)
            globalError = err.message
            toast.error('Erro ao carregar entradas de estoque')
        } finally {
            globalLoading = false
            notifyListeners()
        }
    }, [])

    useEffect(() => {
        const listener = (newState) => setState(newState)
        listeners.push(listener)

        // If it's the first time or we have no data, fetch
        if (globalEntries.length === 0 && globalLoading) {
            fetchEntries()
        }

        return () => {
            listeners = listeners.filter(l => l !== listener)
        }
    }, [fetchEntries])

    const createEntry = async (entry) => {
        try {
            // Start a transaction-like operation
            // 1. Get product data for conversion factor
            const { data: productData, error: productError } = await supabase
                .from('products')
                .select('current_quantity, conversion_factor')
                .eq('id', entry.product_id)
                .single()

            if (productError) throw productError

            // 2. Create the stock entry
            const { data: entryData, error: entryError } = await supabase
                .from('stock_entries')
                .insert([entry])
                .select(`
          *,
          product:products(id, name)
        `)
                .single()

            if (entryError) throw entryError

            // 3. Calculate stock increase and unit cost
            const conversionFactor = productData.conversion_factor || 1
            const stockIncrease = entry.quantity * conversionFactor
            const newQuantity = (productData.current_quantity || 0) + stockIncrease

            // Unit cost is the cost per base unit (e.g., cost per ml)
            const unitCost = entry.cost / stockIncrease

            // 4. Update product quantity and last unit cost
            const { error: updateError } = await supabase
                .from('products')
                .update({
                    current_quantity: newQuantity,
                    last_unit_cost: unitCost
                })
                .eq('id', entry.product_id)

            if (updateError) throw updateError

            // 5. Create expense record
            const { error: financeError } = await supabase
                .from('financial_records')
                .insert([{
                    type: 'expense',
                    amount: entry.cost,
                    description: `Entrada de estoque: ${entryData.product?.name || 'Produto'} (${entry.quantity} un)`,
                    reference_type: 'stock_entry',
                    reference_id: entryData.id,
                    date: entry.date,
                }])

            if (financeError) throw financeError

            globalEntries = [entryData, ...globalEntries]
            notifyListeners()

            // Força a atualização da lista de produtos para refletir o novo saldo
            await fetchProducts()

            toast.success('Entrada registrada com sucesso!')
            return entryData
        } catch (err) {
            console.error('Error creating stock entry:', err)
            toast.error('Erro ao registrar entrada')
            throw err
        }
    }

    const deleteEntry = async (id, entry) => {
        try {
            // 1. Subtract quantity from product
            const { data: productData, error: productError } = await supabase
                .from('products')
                .select('current_quantity')
                .eq('id', entry.product_id)
                .single()

            if (productError) throw productError

            const newQuantity = Math.max(0, (productData.current_quantity || 0) - entry.quantity)

            const { error: updateError } = await supabase
                .from('products')
                .update({ current_quantity: newQuantity })
                .eq('id', entry.product_id)

            if (updateError) throw updateError

            // 2. Delete related financial record
            const { error: financeError } = await supabase
                .from('financial_records')
                .delete()
                .eq('reference_type', 'stock_entry')
                .eq('reference_id', id)

            if (financeError) console.warn('Could not delete financial record:', financeError)

            // 3. Delete the entry
            const { error } = await supabase
                .from('stock_entries')
                .delete()
                .eq('id', id)

            if (error) throw error

            globalEntries = globalEntries.filter(e => e.id !== id)
            notifyListeners()
            toast.success('Entrada excluída com sucesso!')
        } catch (err) {
            console.error('Error deleting stock entry:', err)
            toast.error('Erro ao excluir entrada')
            throw err
        }
    }

    return {
        entries: state.entries,
        loading: state.loading,
        error: state.error,
        fetchEntries,
        createEntry,
        deleteEntry,
    }
}
