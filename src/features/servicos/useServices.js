import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

// Shared state for all instances of useServices
let globalServices = []
let globalLoading = true
let globalError = null
let listeners = []
let lastFilters = {}

const notifyListeners = () => {
    listeners.forEach(listener => {
        listener({
            services: [...globalServices],
            loading: globalLoading,
            error: globalError
        })
    })
}

export function useServices() {
    const [state, setState] = useState({
        services: globalServices,
        loading: globalLoading,
        error: globalError
    })

    const fetchServices = useCallback(async (filters = {}) => {
        try {
            globalLoading = true
            lastFilters = filters
            notifyListeners()

            let query = supabase
                .from('services')
                .select(`
          *,
          service_type:service_types(id, name, price)
        `)
                .order('date', { ascending: false })

            // Apply filters
            if (filters.serviceTypeId) {
                query = query.eq('service_type_id', filters.serviceTypeId)
            }
            if (filters.startDate) {
                query = query.gte('date', filters.startDate)
            }
            if (filters.endDate) {
                query = query.lte('date', filters.endDate)
            }

            const { data, error } = await query

            if (error) throw error

            globalServices = data || []
            globalError = null
        } catch (err) {
            console.error('Error fetching services:', err)
            globalError = err.message
            toast.error('Erro ao carregar serviços')
        } finally {
            globalLoading = false
            notifyListeners()
        }
    }, [])

    useEffect(() => {
        const listener = (newState) => setState(newState)
        listeners.push(listener)

        // If it's the first time or we have no data, fetch
        if (globalServices.length === 0 && globalLoading) {
            fetchServices()
        }

        return () => {
            listeners = listeners.filter(l => l !== listener)
        }
    }, [fetchServices])

    const checkStockAvailability = useCallback(async (serviceTypeId) => {
        try {
            // Get service products
            const { data: serviceProducts, error } = await supabase
                .from('service_products')
                .select(`
          product_id,
          default_quantity,
          use_unit_system,
          product:products(id, name, current_quantity, conversion_factor, last_unit_cost, unit)
        `)
                .eq('service_type_id', serviceTypeId)

            if (error) throw error

            // Check if all products have sufficient stock
            const productsWithDeduction = serviceProducts.map(sp => {
                const deducedQuantity = sp.use_unit_system
                    ? sp.default_quantity * (sp.product.conversion_factor || 1)
                    : sp.default_quantity
                return { ...sp, deducedQuantity }
            })

            const insufficientStock = productsWithDeduction.filter(
                sp => sp.product.current_quantity < sp.deducedQuantity
            )

            return {
                available: insufficientStock.length === 0,
                insufficientProducts: insufficientStock.map(sp => ({
                    name: sp.product.name,
                    required: sp.deducedQuantity,
                    available: sp.product.current_quantity,
                })),
                products: productsWithDeduction,
            }
        } catch (err) {
            console.error('Error checking stock:', err)
            throw err
        }
    }, [])

    const createService = async (service) => {
        try {
            // 1. Check stock availability
            const stockCheck = await checkStockAvailability(service.service_type_id)

            if (!stockCheck.available) {
                const productList = stockCheck.insufficientProducts
                    .map(p => `${p.name}: necessário ${p.required}, disponível ${p.available}`)
                    .join('\n')
                throw new Error(`Estoque insuficiente:\n${productList}`)
            }

            // 2. Get service type for price
            const { data: serviceType, error: typeError } = await supabase
                .from('service_types')
                .select('price, name')
                .eq('id', service.service_type_id)
                .single()

            if (typeError) throw typeError

            // 3. Calculate total product cost
            const productCost = stockCheck.products.reduce((sum, sp) => {
                const unitCost = sp.product.last_unit_cost || 0
                // Use deducedQuantity which is already in base measure
                return sum + (sp.deducedQuantity * unitCost)
            }, 0)

            // 4. Create the service
            const { data: serviceData, error: serviceError } = await supabase
                .from('services')
                .insert([{
                    client_name: service.client_name,
                    service_type_id: service.service_type_id,
                    date: service.date,
                    notes: service.notes,
                    price: serviceType.price,
                    product_cost: productCost,
                }])
                .select(`
          *,
          service_type:service_types(id, name, price)
        `)
                .single()

            if (serviceError) throw serviceError

            // 5. Deduct stock for each product
            for (const sp of stockCheck.products) {
                const newQuantity = sp.product.current_quantity - sp.deducedQuantity

                const { error: updateError } = await supabase
                    .from('products')
                    .update({ current_quantity: newQuantity })
                    .eq('id', sp.product_id)

                if (updateError) throw updateError
            }

            // 6. Create income record
            const { error: financeError } = await supabase
                .from('financial_records')
                .insert([{
                    type: 'income',
                    amount: serviceType.price,
                    description: `Serviço: ${serviceType.name} - Cliente: ${service.client_name}`,
                    reference_type: 'service',
                    reference_id: serviceData.id,
                    date: service.date,
                }])

            if (financeError) throw financeError

            globalServices = [serviceData, ...globalServices]
            notifyListeners()
            toast.success('Serviço registrado com sucesso!')
            return serviceData
        } catch (err) {
            console.error('Error creating service:', err)
            toast.error(err.message || 'Erro ao registrar serviço')
            throw err
        }
    }

    const deleteService = async (id, service) => {
        try {
            // 1. Get service products to restore stock
            const { data: serviceProducts, error: spError } = await supabase
                .from('service_products')
                .select(`
          product_id,
          default_quantity,
          use_unit_system,
          product:products(current_quantity, conversion_factor)
        `)
                .eq('service_type_id', service.service_type_id)

            if (spError) throw spError

            // 2. Restore stock
            for (const sp of serviceProducts) {
                const restoredQuantity = sp.use_unit_system
                    ? sp.default_quantity * (sp.product.conversion_factor || 1)
                    : sp.default_quantity

                const newQuantity = sp.product.current_quantity + restoredQuantity

                const { error: updateError } = await supabase
                    .from('products')
                    .update({ current_quantity: newQuantity })
                    .eq('id', sp.product_id)

                if (updateError) throw updateError
            }

            // 3. Delete related financial record
            const { error: financeError } = await supabase
                .from('financial_records')
                .delete()
                .eq('reference_type', 'service')
                .eq('reference_id', id)

            if (financeError) console.warn('Could not delete financial record:', financeError)

            // 4. Delete the service
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', id)

            if (error) throw error

            globalServices = globalServices.filter(s => s.id !== id)
            notifyListeners()
            toast.success('Serviço excluído com sucesso!')
        } catch (err) {
            console.error('Error deleting service:', err)
            toast.error('Erro ao excluir serviço')
            throw err
        }
    }

    return {
        services: state.services,
        loading: state.loading,
        error: state.error,
        fetchServices,
        createService,
        deleteService,
        checkStockAvailability,
    }
}
