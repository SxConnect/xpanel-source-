import { useQuery } from '@tanstack/react-query';
import { Server, Container, Globe, Mail, HardDrive, Cpu, MemoryStick } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/common/Card';
import { DashboardStats } from '@/types';
import api from '@/lib/api';

export function Dashboard() {
    const { data: stats, isLoading } = useQuery<DashboardStats>({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/stats');
            return data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Carregando...</div>
            </div>
        );
    }

    const resourceCards = [
        { label: 'Domínios', value: stats?.resources.domains || 0, icon: Globe, color: 'text-blue-600' },
        { label: 'Containers', value: stats?.resources.containers || 0, icon: Container, color: 'text-green-600' },
        { label: 'Emails', value: stats?.resources.emails || 0, icon: Mail, color: 'text-purple-600' },
        { label: 'Backups', value: stats?.resources.backups || 0, icon: HardDrive, color: 'text-orange-600' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Visão geral do seu servidor</p>
            </div>

            {/* Resource Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {resourceCards.map((card) => (
                    <Card key={card.label}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{card.label}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg bg-gray-50 ${card.color}`}>
                                <card.icon size={24} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Server Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Informações do Servidor</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Server className="text-gray-400 mr-2" size={20} />
                                    <span className="text-sm text-gray-600">Hostname</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                    {stats?.server.hostname}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Cpu className="text-gray-400 mr-2" size={20} />
                                    <span className="text-sm text-gray-600">CPUs</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                    {stats?.server.cpus} cores
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <MemoryStick className="text-gray-400 mr-2" size={20} />
                                    <span className="text-sm text-gray-600">Memória Total</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                    {stats?.server.totalMemoryGB} GB
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <MemoryStick className="text-gray-400 mr-2" size={20} />
                                    <span className="text-sm text-gray-600">Memória Livre</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                    {stats?.server.freeMemoryGB} GB
                                </span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Docker</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Containers Rodando</span>
                                <span className="text-sm font-medium text-green-600">
                                    {stats?.docker.containers.running}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Containers Parados</span>
                                <span className="text-sm font-medium text-gray-600">
                                    {stats?.docker.containers.stopped}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total de Containers</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {stats?.docker.containers.total}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Imagens</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {stats?.docker.images}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Redes</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {stats?.docker.networks}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Volumes</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {stats?.docker.volumes}
                                </span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
