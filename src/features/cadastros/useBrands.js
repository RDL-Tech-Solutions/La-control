import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

// Shared state for all instances of useBrands
let globalBrands = []
let globalLoading = true
let globalError = null
let listeners = []

const notifyListeners = () => {
    listeners.forEach(listener => {
        listener({
            brands: [...globalBrands],
            loading: globalLoading,
            error: globalError
        })
    })
}

export function useBrands() {
    const [state, setState] = useState({
        brands: globalBrands,
        loading: globalLoading,
        error: globalError
    })

    const fetchBrands = useCallback(async () => {
        try {
            globalLoading = true
            notifyListeners()

            const { data, error } = await supabase
                .from('brands')
                .select('*')
                .order('name')

            if (error) throw error

            globalBrands = data || []
            globalError = null
        } catch (err) {
            console.error('Error fetching brands:', err)
            globalError = err.message
            toast.error('Erro ao carregar marcas')
        } finally {
            globalLoading = false
            notifyListeners()
        }
    }, [])

    useEffect(() => {
        const listener = (newState) => setState(newState)
        listeners.push(listener)

        // If it's the first time or we have no data, fetch
        if (globalBrands.length === 0 && globalLoading) {
            fetchBrands()
        }

        return () => {
            listeners = listeners.filter(l => l !== listener)
        }
    }, [fetchBrands])

    const createBrand = async (brand) => {
        try {
            const { data, error } = await supabase
                .from('brands')
                .insert([brand])
                .select()
                .single()

            if (error) throw error

            globalBrands = [...globalBrands, data].sort((a, b) => a.name.localeCompare(b.name))
            notifyListeners()
            toast.success('Marca criada com sucesso!')
            return data
        } catch (err) {
            console.error('Error creating brand:', err)
            toast.error('Erro ao criar marca')
            throw err
        }
    }

    const updateBrand = async (id, updates) => {
        try {
            const { data, error } = await supabase
                .from('brands')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            globalBrands = globalBrands.map(b => b.id === id ? data : b).sort((a, b) => a.name.localeCompare(b.name))
            notifyListeners()
            toast.success('Marca atualizada com sucesso!')
            return data
        } catch (err) {
            console.error('Error updating brand:', err)
            toast.error('Erro ao atualizar marca')
            throw err
        }
    }

    const deleteBrand = async (id) => {
        try {
            const { error } = await supabase
                .from('brands')
                .delete()
                .eq('id', id)

            if (error) throw error

            globalBrands = globalBrands.filter(b => b.id !== id)
            notifyListeners()
            toast.success('Marca excluída com sucesso!')
        } catch (err) {
            console.error('Error deleting brand:', err)
            toast.error('Erro ao excluir marca')
            throw err
        }
    }

    return {
        brands: state.brands,
        loading: state.loading,
        error: state.error,
        fetchBrands,
        createBrand,
        updateBrand,
        deleteBrand,
    }
}
