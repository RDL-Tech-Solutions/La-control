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
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) {
                    if (error.message.includes('Refresh Token Not Found') ||
                        error.message.includes('Invalid Refresh Token')) {
                        await supabase.auth.signOut()
                    }
                    throw error
                }

                if (session) {
                    toast.success('Email confirmado com sucesso!')
                    navigate('/', { replace: true })
                } else {
                    // Check if there's a session in the callback
                    const { data: { session: currentSession } } = await supabase.auth.getSession()
                    if (currentSession) {
                        toast.success('Email confirmado com sucesso!')
                        navigate('/', { replace: true })
                        return
                    }

                    // If no session, wait for onAuthStateChange or redirect to login
                    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                        console.log('AuthCallback event:', event)
                        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
                            toast.success('Email confirmado com sucesso!')
                            subscription.unsubscribe()
                            navigate('/', { replace: true })
                        }
                    })

                    // Fallback after 5 seconds
                    const timeout = setTimeout(() => {
                        subscription.unsubscribe()
                        navigate('/login', { replace: true })
                    }, 5000)

                    return () => {
                        clearTimeout(timeout)
                        subscription.unsubscribe()
                    }
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
