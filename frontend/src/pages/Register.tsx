import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export function Register() {
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data } = await api.post('/users/register', { name, email, password });
            setAuth(data.user, data.token);
            toast.success('Conta criada com sucesso!');
            navigate('/');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao criar conta');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                        <UserPlus className="text-primary-600" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Conta</h1>
                    <p className="text-gray-600">Registre-se no XPanel</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">Nome</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input"
                            placeholder="Seu nome"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        Criar Conta
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                            Faça login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
