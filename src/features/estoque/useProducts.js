import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

// Shared state for all instances of useProducts
let globalProducts = []
let globalLoading = true
let globalError = null
let listeners = []

const notifyListeners = () => {
    listeners.forEach(listener => {
        listener({
            products: [...globalProducts],
            loading: globalLoading,
            error: globalError
        })
    })
}

export function useProducts() {
    const [state, setState] = useState({
        products: globalProducts,
        loading: globalLoading,
        error: globalError
    })

    const fetchProducts = useCallback(async () => {
        try {
            globalLoading = true
            notifyListeners()

            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    brand:brands(id, name),
                    categories(id, name, prefix)
                `)
                .order('name')

            if (error) throw error

            globalProducts = data || []
            globalError = null
        } catch (err) {
            console.error('Error fetching products:', err)
            globalError = err.message
            toast.error('Erro ao carregar produtos')
        } finally {
            globalLoading = false
            notifyListeners()
        }
    }, [])

    useEffect(() => {
        const listener = (newState) => setState(newState)
        listeners.push(listener)

        // If it's the first time or we have no data, fetch
        if (globalProducts.length === 0 && globalLoading) {
            fetchProducts()
        }

        return () => {
            listeners = listeners.filter(l => l !== listener)
        }
    }, [fetchProducts])

    const createProduct = async (product) => {
        try {
            const { data, error } = await supabase
                .from('products')
                .insert([product])
                .select(`
                    *,
                    brand:brands(id, name),
                    categories(id, name, prefix)
                `)
                .single()

            if (error) throw error

            globalProducts = [...globalProducts, data].sort((a, b) => a.name.localeCompare(b.name))
            notifyListeners()
            toast.success('Produto criado com sucesso!')
            return data
        } catch (err) {
            console.error('Error creating product:', err)
            toast.error('Erro ao criar produto')
            throw err
        }
    }

    const updateProduct = async (id, updates) => {
        try {
            const { data, error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', id)
                .select(`
                    *,
                    brand:brands(id, name),
                    categories(id, name, prefix)
                `)
                .single()

            if (error) throw error

            globalProducts = globalProducts.map(p => p.id === id ? data : p).sort((a, b) => a.name.localeCompare(b.name))
            notifyListeners()
            toast.success('Produto atualizado com sucesso!')
            return data
        } catch (err) {
            console.error('Error updating product:', err)
            toast.error('Erro ao atualizar produto')
            throw err
        }
    }

    const deleteProduct = async (id) => {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id)

            if (error) throw error

            globalProducts = globalProducts.filter(p => p.id !== id)
            notifyListeners()
            toast.success('Produto excluído com sucesso!')
        } catch (err) {
            console.error('Error deleting product:', err)
            toast.error('Erro ao excluir produto')
            throw err
        }
    }

    const getLowStockProducts = useCallback(() => {
        return state.products.filter(p => p.current_quantity <= p.min_quantity)
    }, [state.products])

    return {
        products: state.products,
        loading: state.loading,
        error: state.error,
        fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        getLowStockProducts,
    }
}
