import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Container,
    Globe,
    Mail,
    Network,
    HardDrive,
    Settings,
    LogOut,
    Users,
    Crown,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Docker', href: '/docker', icon: Container },
    { name: 'Hospedagem', href: '/hosting', icon: Globe },
    { name: 'Email', href: '/email', icon: Mail },
    { name: 'DNS', href: '/dns', icon: Network },
    { name: 'Backup', href: '/backup', icon: HardDrive },
    { name: 'Usuários', href: '/users', icon: Users, premium: true },
    { name: 'Configurações', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const { user, logout } = useAuthStore();

    // Check if user can manage users (ADMIN or RESELLER with PREMIUM)
    const canManageUsers = user?.role === 'ADMIN' ||
        (user?.role === 'RESELLER' && user?.tier === 'PREMIUM');

    return (
        <div className="flex flex-col w-64 bg-gray-900 h-screen fixed left-0 top-0">
            <div className="flex items-center justify-center h-16 bg-gray-800">
                <h1 className="text-2xl font-bold text-white">XPanel</h1>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {navigation.map((item) => {
                        // Hide premium items if user doesn't have access
                        if (item.premium && !canManageUsers) {
                            return null;
                        }

                        return (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                className={({ isActive }) =>
                                    cn(
                                        'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                                        isActive
                                            ? 'bg-gray-800 text-white'
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    )
                                }
                            >
                                <item.icon className="mr-3 h-5 w-5" />
                                {item.name}
                                {item.premium && (
                                    <Crown className="ml-auto h-4 w-4 text-yellow-500" />
                                )}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center mb-3">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white">{user?.name}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{user?.role}</span>
                            {user?.tier === 'PREMIUM' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-900 text-yellow-200">
                                    <Crown size={10} className="mr-1" />
                                    PREMIUM
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sair
                </button>
            </div>
        </div>
    );
}
