import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

// Shared state for all instances of useUnits
let globalUnits = []
let globalLoading = true
let globalError = null
let listeners = []

const notifyListeners = () => {
    listeners.forEach(listener => {
        listener({
            units: [...globalUnits],
            loading: globalLoading,
            error: globalError
        })
    })
}

export function useUnits() {
    const [state, setState] = useState({
        units: globalUnits,
        loading: globalLoading,
        error: globalError
    })

    const fetchUnits = useCallback(async () => {
        try {
            globalLoading = true
            notifyListeners()

            const { data, error } = await supabase
                .from('units')
                .select('*')
                .order('name')

            if (error) throw error

            globalUnits = data || []
            globalError = null
        } catch (err) {
            console.error('Error fetching units:', err)
            globalError = err.message
            toast.error('Erro ao carregar unidades')
        } finally {
            globalLoading = false
            notifyListeners()
        }
    }, [])

    useEffect(() => {
        const listener = (newState) => setState(newState)
        listeners.push(listener)

        // If it's the first time or we have no data, fetch
        if (globalUnits.length === 0 && globalLoading) {
            fetchUnits()
        }

        return () => {
            listeners = listeners.filter(l => l !== listener)
        }
    }, [fetchUnits])

    const createUnit = async (unit) => {
        try {
            const { data, error } = await supabase
                .from('units')
                .insert([unit])
                .select()
                .single()

            if (error) throw error

            globalUnits = [...globalUnits, data].sort((a, b) => a.name.localeCompare(b.name))
            notifyListeners()
            toast.success('Unidade criada com sucesso!')
            return data
        } catch (err) {
            console.error('Error creating unit:', err)
            toast.error('Erro ao criar unidade')
            throw err
        }
    }

    const updateUnit = async (id, updates) => {
        try {
            const { data, error } = await supabase
                .from('units')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            globalUnits = globalUnits.map(u => u.id === id ? data : u).sort((a, b) => a.name.localeCompare(b.name))
            notifyListeners()
            toast.success('Unidade atualizada com sucesso!')
            return data
        } catch (err) {
            console.error('Error updating unit:', err)
            toast.error('Erro ao atualizar unidade')
            throw err
        }
    }

    const deleteUnit = async (id) => {
        try {
            const { error } = await supabase
                .from('units')
                .delete()
                .eq('id', id)

            if (error) throw error

            globalUnits = globalUnits.filter(u => u.id !== id)
            notifyListeners()
            toast.success('Unidade excluída com sucesso!')
        } catch (err) {
            console.error('Error deleting unit:', err)
            toast.error('Erro ao excluir unidade')
            throw err
        }
    }

    return {
        units: state.units,
        loading: state.loading,
        error: state.error,
        fetchUnits,
        createUnit,
        updateUnit,
        deleteUnit,
    }
}
