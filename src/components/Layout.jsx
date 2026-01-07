import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Package,
    Scissors,
    DollarSign,
    FileText,
    LogOut,
    Sparkles,
    Settings
} from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext'

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/estoque', icon: Package, label: 'Estoque' },
    { to: '/servicos', icon: Scissors, label: 'Serviços' },
    { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
    { to: '/relatorios', icon: FileText, label: 'Relatórios' },
    { to: '/cadastros', icon: Settings, label: 'Cadastros' },
]

export default function Layout({ children }) {
    const location = useLocation()
    const { user, signOut } = useAuth()

    const handleSignOut = async () => {
        try {
            await signOut()
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }

    return (
        <>
            {/* Sidebar - Desktop */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="sidebar-logo-text">LA Control</span>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}

                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Conta</div>
                        <div className="px-4 py-2 text-sm text-[var(--color-neutral-400)] truncate">
                            {user?.email}
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="sidebar-link w-full text-left hover:text-[var(--color-error-400)]"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Sair</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content safe-area-bottom">
                {children}
            </main>

            {/* Tab Bar - Mobile */}
            <nav className="tab-bar safe-area-bottom">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `tab-bar-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <div className="tab-bar-icon">
                            <item.icon className="w-5 h-5" />
                        </div>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </>
    )
}
