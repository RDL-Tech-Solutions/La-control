import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

// Shared state for all instances of useServiceTypes
let globalServiceTypes = []
let globalLoading = true
let globalError = null
let listeners = []

const notifyListeners = () => {
    listeners.forEach(listener => {
        listener({
            serviceTypes: [...globalServiceTypes],
            loading: globalLoading,
            error: globalError
        })
    })
}

export function useServiceTypes() {
    const [state, setState] = useState({
        serviceTypes: globalServiceTypes,
        loading: globalLoading,
        error: globalError
    })

    const fetchServiceTypes = useCallback(async () => {
        try {
            globalLoading = true
            notifyListeners()

            const { data, error } = await supabase
                .from('service_types')
                .select(`
          *,
          service_products(
            id,
            product_id,
            default_quantity,
            use_unit_system,
            product:products(id, name, current_quantity, conversion_factor, unit)
          )
        `)
                .order('name')

            if (error) throw error

            globalServiceTypes = data || []
            globalError = null
        } catch (err) {
            console.error('Error fetching service types:', err)
            globalError = err.message
            toast.error('Erro ao carregar tipos de serviço')
        } finally {
            globalLoading = false
            notifyListeners()
        }
    }, [])

    useEffect(() => {
        const listener = (newState) => setState(newState)
        listeners.push(listener)

        // If it's the first time or we have no data, fetch
        if (globalServiceTypes.length === 0 && globalLoading) {
            fetchServiceTypes()
        }

        return () => {
            listeners = listeners.filter(l => l !== listener)
        }
    }, [fetchServiceTypes])

    const createServiceType = async (serviceType, products = []) => {
        try {
            // 1. Create the service type
            const { data: typeData, error: typeError } = await supabase
                .from('service_types')
                .insert([{
                    name: serviceType.name,
                    price: serviceType.price,
                }])
                .select()
                .single()

            if (typeError) throw typeError

            // 2. Create service products if any
            if (products.length > 0) {
                const serviceProducts = products.map(p => ({
                    service_type_id: typeData.id,
                    product_id: p.product_id,
                    default_quantity: p.default_quantity,
                    use_unit_system: p.use_unit_system || false,
                }))

                const { error: productsError } = await supabase
                    .from('service_products')
                    .insert(serviceProducts)

                if (productsError) throw productsError
            }

            // Refresh to get full data with relations
            await fetchServiceTypes()
            toast.success('Tipo de serviço criado com sucesso!')
            return typeData
        } catch (err) {
            console.error('Error creating service type:', err)
            toast.error('Erro ao criar tipo de serviço')
            throw err
        }
    }

    const updateServiceType = async (id, serviceType, products = []) => {
        try {
            // 1. Update the service type
            const { error: typeError } = await supabase
                .from('service_types')
                .update({
                    name: serviceType.name,
                    price: serviceType.price,
                })
                .eq('id', id)

            if (typeError) throw typeError

            // 2. Delete existing service products
            const { error: deleteError } = await supabase
                .from('service_products')
                .delete()
                .eq('service_type_id', id)

            if (deleteError) throw deleteError

            // 3. Insert new service products
            if (products.length > 0) {
                const serviceProducts = products.map(p => ({
                    service_type_id: id,
                    product_id: p.product_id,
                    default_quantity: p.default_quantity,
                    use_unit_system: p.use_unit_system || false,
                }))

                const { error: productsError } = await supabase
                    .from('service_products')
                    .insert(serviceProducts)

                if (productsError) throw productsError
            }

            // Refresh to get full data with relations
            await fetchServiceTypes()
            toast.success('Tipo de serviço atualizado com sucesso!')
        } catch (err) {
            console.error('Error updating service type:', err)
            toast.error('Erro ao atualizar tipo de serviço')
            throw err
        }
    }

    const deleteServiceType = async (id) => {
        try {
            // Service products will be deleted by cascade
            const { error } = await supabase
                .from('service_types')
                .delete()
                .eq('id', id)

            if (error) throw error

            globalServiceTypes = globalServiceTypes.filter(s => s.id !== id)
            notifyListeners()
            toast.success('Tipo de serviço excluído com sucesso!')
        } catch (err) {
            console.error('Error deleting service type:', err)
            toast.error('Erro ao excluir tipo de serviço')
            throw err
        }
    }

    return {
        serviceTypes: state.serviceTypes,
        loading: state.loading,
        error: state.error,
        fetchServiceTypes,
        createServiceType,
        updateServiceType,
        deleteServiceType,
    }
}
