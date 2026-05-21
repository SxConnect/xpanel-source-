import { Bell, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function Header() {
    const { user } = useAuthStore();

    return (
        <header className="bg-white border-b border-gray-200 h-16 fixed top-0 right-0 left-64 z-10">
            <div className="flex items-center justify-between h-full px-6">
                <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Bem-vindo, {user?.name}
                    </h2>
                </div>

                <div className="flex items-center space-x-4">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <Bell size={20} />
                    </button>

                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                            <User size={16} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.tier?.toLowerCase()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
