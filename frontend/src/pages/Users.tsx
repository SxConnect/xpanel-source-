import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Edit2, Trash2, Crown, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/common/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/common/Table';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface UserData {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'RESELLER' | 'USER';
    tier: 'FREE' | 'PREMIUM';
    createdAt: string;
    lastLoginAt?: string;
    _count?: {
        domains: number;
        databases: number;
        containers: number;
        emails: number;
    };
}

interface CreateUserForm {
    email: string;
    password: string;
    name: string;
    role?: 'USER' | 'RESELLER';
    tier?: 'FREE' | 'PREMIUM';
}

interface UpdateUserForm {
    name?: string;
    role?: 'USER' | 'RESELLER' | 'ADMIN';
    tier?: 'FREE' | 'PREMIUM';
    maxDomains?: number;
    maxDatabases?: number;
    maxContainers?: number;
    maxEmails?: number;
}

export function Users() {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [createForm, setCreateForm] = useState<CreateUserForm>({
        email: '',
        password: '',
        name: '',
    });
    const [editForm, setEditForm] = useState<UpdateUserForm>({});

    // Check if user has permission
    const canManageUsers = currentUser?.role === 'ADMIN' ||
        (currentUser?.role === 'RESELLER' && currentUser?.tier === 'PREMIUM');

    const { data: users, isLoading } = useQuery<UserData[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await api.get('/users');
            return data.users;
        },
        enabled: canManageUsers,
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateUserForm) => api.post('/users/create', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Usuário criado com sucesso');
            setShowCreateModal(false);
            setCreateForm({ email: '', password: '', name: '' });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Erro ao criar usuário');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserForm }) =>
            api.put(`/users/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Usuário atualizado com sucesso');
            setShowEditModal(false);
            setSelectedUser(null);
            setEditForm({});
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Erro ao atualizar usuário');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Usuário deletado com sucesso');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Erro ao deletar usuário');
        },
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(createForm);
    };

    const handleEdit = (user: UserData) => {
        setSelectedUser(user);
        setEditForm({
            name: user.name,
            role: user.role,
            tier: user.tier,
        });
        setShowEditModal(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedUser) {
            updateMutation.mutate({ id: selectedUser.id, data: editForm });
        }
    };

    const handleDelete = (user: UserData) => {
        if (confirm(`Tem certeza que deseja deletar o usuário ${user.name}?`)) {
            deleteMutation.mutate(user.id);
        }
    };

    const getRoleBadge = (role: string) => {
        const colors = {
            ADMIN: 'bg-red-100 text-red-800',
            RESELLER: 'bg-blue-100 text-blue-800',
            USER: 'bg-gray-100 text-gray-800',
        };
        return colors[role as keyof typeof colors] || colors.USER;
    };

    const getTierBadge = (tier: string) => {
        return tier === 'PREMIUM'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-800';
    };

    if (!canManageUsers) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
                    <p className="text-gray-600">Gerenciamento de usuários</p>
                </div>

                <Card>
                    <CardBody>
                        <div className="text-center py-12">
                            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Recurso Premium
                            </h3>
                            <p className="text-gray-600 mb-4">
                                O gerenciamento de usuários está disponível apenas para contas Premium
                                com perfil Reseller ou Admin.
                            </p>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                                <p className="text-sm text-yellow-800">
                                    <strong>Seu perfil:</strong> {currentUser?.role} ({currentUser?.tier})
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return <div className="text-gray-500">Carregando...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
                    <p className="text-gray-600">Gerencie os usuários do sistema</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <UserPlus size={16} className="mr-2" />
                    Novo Usuário
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Usuários ({users?.length || 0})</CardTitle>
                </CardHeader>
                <CardBody>
                    {!users || users.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Nenhum usuário encontrado</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Perfil</TableHead>
                                    <TableHead>Tier</TableHead>
                                    <TableHead>Recursos</TableHead>
                                    <TableHead>Criado</TableHead>
                                    <TableHead>Último Login</TableHead>
                                    <TableHead>Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell className="text-gray-600">{user.email}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                                                {user.role === 'ADMIN' && <Crown size={12} className="mr-1" />}
                                                {user.role}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierBadge(user.tier)}`}>
                                                {user.tier === 'PREMIUM' && <Crown size={12} className="mr-1" />}
                                                {user.tier}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-gray-600 text-sm">
                                            {user._count && (
                                                <div className="space-y-1">
                                                    <div>Domínios: {user._count.domains}</div>
                                                    <div>Containers: {user._count.containers}</div>
                                                    <div>Emails: {user._count.emails}</div>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {formatRelativeTime(user.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Nunca'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-1 text-gray-600 hover:text-blue-600"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                {currentUser?.role === 'ADMIN' && user.id !== currentUser.id && (
                                                    <button
                                                        onClick={() => handleDelete(user)}
                                                        className="p-1 text-gray-600 hover:text-red-600"
                                                        title="Deletar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            {/* Create User Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Criar Novo Usuário"
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome
                        </label>
                        <input
                            type="text"
                            value={createForm.name}
                            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={createForm.email}
                            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Senha
                        </label>
                        <input
                            type="password"
                            value={createForm.password}
                            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            minLength={6}
                        />
                    </div>

                    {currentUser?.role === 'ADMIN' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Perfil
                                </label>
                                <select
                                    value={createForm.role || 'USER'}
                                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="USER">USER</option>
                                    <option value="RESELLER">RESELLER</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tier
                                </label>
                                <select
                                    value={createForm.tier || 'FREE'}
                                    onChange={(e) => setCreateForm({ ...createForm, tier: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="FREE">FREE</option>
                                    <option value="PREMIUM">PREMIUM</option>
                                </select>
                            </div>
                        </>
                    )}

                    {currentUser?.role === 'RESELLER' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                Como RESELLER, você só pode criar usuários com perfil USER e tier FREE.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowCreateModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Criando...' : 'Criar Usuário'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit User Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title={`Editar Usuário - ${selectedUser?.name}`}
            >
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome
                        </label>
                        <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {currentUser?.role === 'ADMIN' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Perfil
                                </label>
                                <select
                                    value={editForm.role || selectedUser?.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="USER">USER</option>
                                    <option value="RESELLER">RESELLER</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tier
                                </label>
                                <select
                                    value={editForm.tier || selectedUser?.tier}
                                    onChange={(e) => setEditForm({ ...editForm, tier: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="FREE">FREE</option>
                                    <option value="PREMIUM">PREMIUM</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Max Domínios (0 = ilimitado)
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.maxDomains ?? ''}
                                        onChange={(e) => setEditForm({ ...editForm, maxDomains: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Max Containers (0 = ilimitado)
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.maxContainers ?? ''}
                                        onChange={(e) => setEditForm({ ...editForm, maxContainers: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Max Databases (0 = ilimitado)
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.maxDatabases ?? ''}
                                        onChange={(e) => setEditForm({ ...editForm, maxDatabases: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Max Emails (0 = ilimitado)
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.maxEmails ?? ''}
                                        onChange={(e) => setEditForm({ ...editForm, maxEmails: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {currentUser?.role === 'RESELLER' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                Como RESELLER, você só pode editar o nome do usuário.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowEditModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
