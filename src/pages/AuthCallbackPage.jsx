import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LoadingPage } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AuthCallbackPage() {
    const navigate = useNavigate()

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Supabase detectSessionInUrl: true already handles the hash
                // but we wait a bit for the session to be established
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) throw error

                if (session) {
                    toast.success('Email confirmado com sucesso!')
                    navigate('/', { replace: true })
                } else {
                    // If no session, wait for onAuthStateChange or redirect to login
                    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                        if (event === 'SIGNED_IN' && session) {
                            toast.success('Email confirmado com sucesso!')
                            subscription.unsubscribe()
                            navigate('/', { replace: true })
                        }
                    })

                    // Fallback after 5 seconds
                    setTimeout(() => {
                        subscription.unsubscribe()
                        navigate('/login', { replace: true })
                    }, 5000)
                }
            } catch (error) {
                console.error('Error during auth callback:', error)
                toast.error('Erro ao confirmar seu email. Tente fazer login.')
                navigate('/login', { replace: true })
            }
        }

        handleAuthCallback()
    }, [navigate])

    return <LoadingPage />
}
