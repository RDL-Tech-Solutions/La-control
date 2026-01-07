/**
 * Valida se o email é válido
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Valida se a senha atende aos requisitos mínimos
 * @param {string} password
 * @returns {{ valid: boolean, message: string }}
 */
export function validatePassword(password) {
    if (!password) {
        return { valid: false, message: 'Senha é obrigatória' }
    }
    if (password.length < 6) {
        return { valid: false, message: 'Senha deve ter no mínimo 6 caracteres' }
    }
    return { valid: true, message: '' }
}

/**
 * Valida se um valor é um número positivo
 * @param {any} value
 * @returns {boolean}
 */
export function isPositiveNumber(value) {
    const num = parseFloat(value)
    return !isNaN(num) && num > 0
}

/**
 * Valida se um valor é um número não negativo (zero ou positivo)
 * @param {any} value
 * @returns {boolean}
 */
export function isNonNegativeNumber(value) {
    const num = parseFloat(value)
    return !isNaN(num) && num >= 0
}

/**
 * Valida se um valor é um inteiro positivo
 * @param {any} value
 * @returns {boolean}
 */
export function isPositiveInteger(value) {
    const num = parseInt(value)
    return !isNaN(num) && num > 0 && num === parseFloat(value)
}

/**
 * Valida se uma string não está vazia
 * @param {string} value
 * @returns {boolean}
 */
export function isNotEmpty(value) {
    return typeof value === 'string' && value.trim().length > 0
}

/**
 * Valida dados de produto
 * @param {object} product
 * @returns {{ valid: boolean, errors: object }}
 */
export function validateProduct(product) {
    const errors = {}

    if (!isNotEmpty(product.name)) {
        errors.name = 'Nome é obrigatório'
    }

    if (!isNonNegativeNumber(product.current_quantity)) {
        errors.current_quantity = 'Quantidade deve ser um número válido'
    }

    if (!isNonNegativeNumber(product.min_quantity)) {
        errors.min_quantity = 'Estoque mínimo deve ser um número válido'
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    }
}

/**
 * Valida dados de entrada de estoque
 * @param {object} entry
 * @returns {{ valid: boolean, errors: object }}
 */
export function validateStockEntry(entry) {
    const errors = {}

    if (!entry.product_id) {
        errors.product_id = 'Selecione um produto'
    }

    if (!isPositiveNumber(entry.quantity)) {
        errors.quantity = 'Quantidade deve ser maior que zero'
    }

    if (!isPositiveNumber(entry.cost)) {
        errors.cost = 'Valor deve ser maior que zero'
    }

    if (!entry.date) {
        errors.date = 'Data é obrigatória'
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    }
}

/**
 * Valida dados de tipo de serviço
 * @param {object} serviceType
 * @returns {{ valid: boolean, errors: object }}
 */
export function validateServiceType(serviceType) {
    const errors = {}

    if (!isNotEmpty(serviceType.name)) {
        errors.name = 'Nome é obrigatório'
    }

    if (!isPositiveNumber(serviceType.price)) {
        errors.price = 'Preço deve ser maior que zero'
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    }
}

/**
 * Valida dados de serviço realizado
 * @param {object} service
 * @returns {{ valid: boolean, errors: object }}
 */
export function validateService(service) {
    const errors = {}

    if (!isNotEmpty(service.client_name)) {
        errors.client_name = 'Nome do cliente é obrigatório'
    }

    if (!service.service_type_id) {
        errors.service_type_id = 'Selecione um tipo de serviço'
    }

    if (!service.date) {
        errors.date = 'Data é obrigatória'
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    }
}
