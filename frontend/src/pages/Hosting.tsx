import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Shield, ShieldOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/common/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/common/Table';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Domain } from '@/types';
import { getStatusColor, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export function Hosting() {
    const queryClient = useQueryClient();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        domain: '',
        type: 'SITE' as 'SITE' | 'CONTAINER',
        phpVersion: '8.3',
        documentRoot: '/var/www/html',
        containerId: '',
        containerPort: 3000,
    });

    const { data: domains, isLoading } = useQuery<Domain[]>({
        queryKey: ['domains'],
        queryFn: async () => {
            const { data } = await api.get('/hosting/domains');
            return data.domains;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/hosting/domains', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            toast.success('Domínio criado');
            setShowCreateModal(false);
            setFormData({
                domain: '',
                type: 'SITE',
                phpVersion: '8.3',
                documentRoot: '/var/www/html',
                containerId: '',
                containerPort: 3000,
            });
        },
        onError: () => toast.error('Erro ao criar domínio'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/hosting/domains/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            toast.success('Domínio removido');
        },
        onError: () => toast.error('Erro ao remover domínio'),
    });

    const toggleSSLMutation = useMutation({
        mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
            api.post(`/hosting/domains/${id}/ssl/${enable ? 'enable' : 'disable'}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            toast.success('SSL atualizado');
        },
        onError: () => toast.error('Erro ao atualizar SSL'),
    });

    const handleCreate = () => {
        const payload = formData.type === 'SITE'
            ? {
                domain: formData.domain,
                type: formData.type,
                phpVersion: formData.phpVersion,
                documentRoot: formData.documentRoot,
            }
            : {
                domain: formData.domain,
                type: formData.type,
                containerId: formData.containerId,
                containerPort: formData.containerPort,
            };
        createMutation.mutate(payload);
    };

    const handleDelete = (domain: Domain) => {
        if (confirm(`Tem certeza que deseja remover o domínio ${domain.domain}?`)) {
            deleteMutation.mutate(domain.id);
        }
    };

    if (isLoading) {
        return <div className="text-gray-500">Carregando...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hospedagem</h1>
                    <p className="text-gray-600">Gerencie seus domínios e sites</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus size={16} className="mr-2" />
                    Novo Domínio
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Domínios ({domains?.length || 0})</CardTitle>
                </CardHeader>
                <CardBody>
                    {!domains || domains.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Nenhum domínio encontrado</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Domínio</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>SSL</TableHead>
                                    <TableHead>Criado</TableHead>
                                    <TableHead>Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {domains.map((domain) => (
                                    <TableRow key={domain.id}>
                                        <TableCell className="font-medium">{domain.domain}</TableCell>
                                        <TableCell>
                                            <span className="badge bg-blue-50 text-blue-600">{domain.type}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`badge ${getStatusColor(domain.status)}`}>
                                                {domain.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {domain.sslEnabled ? (
                                                <span className="badge bg-green-50 text-green-600">Ativo</span>
                                            ) : (
                                                <span className="badge bg-gray-50 text-gray-600">Inativo</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-gray-600">{formatDate(domain.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() =>
                                                        toggleSSLMutation.mutate({ id: domain.id, enable: !domain.sslEnabled })
                                                    }
                                                    className="p-1 text-gray-600 hover:text-green-600"
                                                    title={domain.sslEnabled ? 'Desabilitar SSL' : 'Habilitar SSL'}
                                                >
                                                    {domain.sslEnabled ? <ShieldOff size={16} /> : <Shield size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(domain)}
                                                    className="p-1 text-gray-600 hover:text-red-600"
                                                    title="Remover"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Novo Domínio"
            >
                <div className="space-y-4">
                    <div>
                        <label className="label">Domínio</label>
                        <input
                            type="text"
                            value={formData.domain}
                            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                            className="input"
                            placeholder="example.com"
                        />
                    </div>

                    <div>
                        <label className="label">Tipo</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="input"
                        >
                            <option value="SITE">Site (PHP/HTML)</option>
                            <option value="CONTAINER">Container</option>
                        </select>
                    </div>

                    {formData.type === 'SITE' ? (
                        <>
                            <div>
                                <label className="label">Versão PHP</label>
                                <select
                                    value={formData.phpVersion}
                                    onChange={(e) => setFormData({ ...formData, phpVersion: e.target.value })}
                                    className="input"
                                >
                                    <option value="8.3">PHP 8.3</option>
                                    <option value="8.2">PHP 8.2</option>
                                    <option value="8.1">PHP 8.1</option>
                                    <option value="7.4">PHP 7.4</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Document Root</label>
                                <input
                                    type="text"
                                    value={formData.documentRoot}
                                    onChange={(e) => setFormData({ ...formData, documentRoot: e.target.value })}
                                    className="input"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="label">Container ID</label>
                                <input
                                    type="text"
                                    value={formData.containerId}
                                    onChange={(e) => setFormData({ ...formData, containerId: e.target.value })}
                                    className="input"
                                    placeholder="abc123..."
                                />
                            </div>
                            <div>
                                <label className="label">Porta do Container</label>
                                <input
                                    type="number"
                                    value={formData.containerPort}
                                    onChange={(e) => setFormData({ ...formData, containerPort: parseInt(e.target.value) })}
                                    className="input"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreate} isLoading={createMutation.isPending}>
                            Criar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
