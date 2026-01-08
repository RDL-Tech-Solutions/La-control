import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

// Shared state for all instances of useCategories
let globalCategories = []
let globalLoading = true
let globalError = null
let listeners = []

const notifyListeners = () => {
    listeners.forEach(listener => {
        listener({
            categories: [...globalCategories],
            loading: globalLoading,
            error: globalError
        })
    })
}

export function useCategories() {
    const [state, setState] = useState({
        categories: globalCategories,
        loading: globalLoading,
        error: globalError
    })

    const fetchCategories = useCallback(async () => {
        try {
            globalLoading = true
            notifyListeners()

            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name')

            if (error) throw error

            globalCategories = data || []
            globalError = null
        } catch (err) {
            console.error('Error fetching categories:', err)
            globalError = err.message
            toast.error('Erro ao carregar categorias')
        } finally {
            globalLoading = false
            notifyListeners()
        }
    }, [])

    useEffect(() => {
        const listener = (newState) => setState(newState)
        listeners.push(listener)

        // If it's the first time or we have no data, fetch
        if (globalCategories.length === 0 && globalLoading) {
            fetchCategories()
        }

        return () => {
            listeners = listeners.filter(l => l !== listener)
        }
    }, [fetchCategories])

    const createCategory = async (category) => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert([category])
                .select()
                .single()

            if (error) throw error

            globalCategories = [...globalCategories, data].sort((a, b) => a.name.localeCompare(b.name))
            notifyListeners()
            toast.success('Categoria criada com sucesso!')
            return data
        } catch (err) {
            console.error('Error creating category:', err)
            toast.error('Erro ao criar categoria')
            throw err
        }
    }

    const updateCategory = async (id, updates) => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            globalCategories = globalCategories.map(c => c.id === id ? data : c).sort((a, b) => a.name.localeCompare(b.name))
            notifyListeners()
            toast.success('Categoria atualizada com sucesso!')
            return data
        } catch (err) {
            console.error('Error updating category:', err)
            toast.error('Erro ao atualizar categoria')
            throw err
        }
    }

    const deleteCategory = async (id) => {
        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id)

            if (error) throw error

            globalCategories = globalCategories.filter(c => c.id !== id)
            notifyListeners()
            toast.success('Categoria excluída com sucesso!')
        } catch (err) {
            console.error('Error deleting category:', err)
            toast.error('Erro ao excluir categoria')
            throw err
        }
    }

    const resetToDefaults = async () => {
        try {
            globalLoading = true
            notifyListeners()

            const defaults = [
                { name: 'Equipamento', prefix: 'EQ' },
                { name: 'Ferramenta', prefix: 'FR' },
                { name: 'Lixa', prefix: 'LX' },
                { name: 'Higiene', prefix: 'HP' },
                { name: 'Tips', prefix: 'TP' },
                { name: 'Gel', prefix: 'GL' },
                { name: 'Esmalte', prefix: 'ES' },
                { name: 'Finalizado', prefix: 'FN' },
                { name: 'Preparador', prefix: 'PQ' }
            ]

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Usuário não autenticado')

            const categoriesWithUserId = defaults.map(c => ({ ...c, user_id: user.id }))

            const { data, error } = await supabase
                .from('categories')
                .upsert(categoriesWithUserId, { onConflict: 'user_id, name' })
                .select()

            if (error) throw error

            await fetchCategories()
            toast.success('Modelos padrões carregados!')
        } catch (err) {
            console.error('Error resetting categories:', err)
            toast.error('Erro ao carregar padrões')
        } finally {
            globalLoading = false
            notifyListeners()
        }
    }

    return {
        categories: state.categories,
        loading: state.loading,
        error: state.error,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        resetToDefaults,
    }
}
