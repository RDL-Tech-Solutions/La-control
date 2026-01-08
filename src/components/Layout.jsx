import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Package,
    Scissors,
    DollarSign,
    FileText,
    LogOut,
    Sparkles,
    Settings,
    Menu,
    X
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    // Close sidebar when route changes
    useEffect(() => {
        setIsSidebarOpen(false)
    }, [location])

    const handleSignOut = async () => {
        try {
            await signOut()
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }

    return (
        <div className="layout-root">
            {/* Mobile Header (Visible only on small screens) */}
            <header className="mobile-header">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="mobile-header-btn"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="mobile-header-logo">
                    <Sparkles className="w-5 h-5 text-[var(--color-primary-400)]" />
                    <span>LA Control</span>
                </div>
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <span className="sidebar-logo-text">LA Control</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="sidebar-close-btn"
                    >
                        <X className="w-5 h-5" />
                    </button>
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

            {/* Tab Bar - Mobile (Hidden on very small screens) */}
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
        </div>
    )
}
