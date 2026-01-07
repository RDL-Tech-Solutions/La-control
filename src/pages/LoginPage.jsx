import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { isValidEmail, validatePassword } from '../utils/validators'
import Button from '../components/Button'
import Input from '../components/Input'
import { Sparkles, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
    const { user, signIn, signUp, loading: authLoading } = useAuth()
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    })

    const [errors, setErrors] = useState({})

    // Redirect if already logged in
    if (user && !authLoading) {
        return <Navigate to="/" replace />
    }

    const validateForm = () => {
        const newErrors = {}

        if (!isLogin && !formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório'
        }

        if (!formData.email) {
            newErrors.email = 'Email é obrigatório'
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = 'Email inválido'
        }

        const passwordValidation = validatePassword(formData.password)
        if (!passwordValidation.valid) {
            newErrors.password = passwordValidation.message
        }

        if (!isLogin && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'As senhas não coincidem'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

        setLoading(true)

        try {
            if (isLogin) {
                await signIn(formData.email, formData.password)
                toast.success('Login realizado com sucesso!')
            } else {
                await signUp(formData.email, formData.password, formData.name)
                toast.success('Conta criada com sucesso! Verifique seu email para confirmar.')
            }
        } catch (error) {
            console.error('Auth error:', error)

            // Handle specific Supabase errors
            if (error.message.includes('Invalid login credentials')) {
                toast.error('Email ou senha incorretos')
            } else if (error.message.includes('Email not confirmed')) {
                toast.error('Confirme seu email antes de fazer login')
            } else if (error.message.includes('User already registered')) {
                toast.error('Este email já está cadastrado')
            } else {
                toast.error(error.message || 'Erro ao processar solicitação')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }))
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--color-neutral-950)]">
            {/* Background Decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[var(--color-primary-600)]/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-[var(--color-accent-500)]/15 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-800)] mb-4 shadow-lg animate-pulse-glow">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">LA Control</h1>
                    <p className="text-[var(--color-neutral-400)]">
                        Gestão inteligente para seu negócio de nail design
                    </p>
                </div>

                {/* Form Card */}
                <div className="glass-card rounded-2xl p-6 sm:p-8">
                    <h2 className="text-xl font-semibold text-[var(--color-neutral-100)] mb-6">
                        {isLogin ? 'Entrar na sua conta' : 'Criar nova conta'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <Input
                                label="Nome"
                                name="name"
                                placeholder="Seu nome completo"
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                                required={!isLogin}
                            />
                        )}

                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            required
                        />

                        <div className="relative">
                            <Input
                                label="Senha"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                error={errors.password}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[38px] text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-200)] transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {!isLogin && (
                            <Input
                                label="Confirmar senha"
                                name="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                error={errors.confirmPassword}
                                required={!isLogin}
                            />
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            loading={loading}
                        >
                            {isLogin ? 'Entrar' : 'Criar conta'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-[var(--color-neutral-400)] text-sm">
                            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(!isLogin)
                                    setErrors({})
                                }}
                                className="ml-1 text-[var(--color-primary-400)] hover:text-[var(--color-primary-300)] font-medium transition-colors"
                            >
                                {isLogin ? 'Criar conta' : 'Entrar'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-[var(--color-neutral-500)] mt-8">
                    © {new Date().getFullYear()} LA Control. Todos os direitos reservados.
                </p>
            </div>
        </div>
    )
}
