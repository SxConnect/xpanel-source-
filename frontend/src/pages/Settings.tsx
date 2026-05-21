import { Card, CardHeader, CardTitle, CardBody } from '@/components/common/Card';
import { useAuthStore } from '@/store/authStore';

export function Settings() {
    const { user } = useAuthStore();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
                <p className="text-gray-600">Gerencie suas configurações</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Perfil</CardTitle>
                </CardHeader>
                <CardBody>
                    <div className="space-y-4">
                        <div>
                            <label className="label">Nome</label>
                            <input type="text" value={user?.name} className="input" disabled />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input type="email" value={user?.email} className="input" disabled />
                        </div>
                        <div>
                            <label className="label">Função</label>
                            <input type="text" value={user?.role} className="input" disabled />
                        </div>
                        <div>
                            <label className="label">Plano</label>
                            <input type="text" value={user?.tier} className="input" disabled />
                        </div>
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sobre o XPanel</CardTitle>
                </CardHeader>
                <CardBody>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Versão:</strong> 0.1.0</p>
                        <p><strong>Desenvolvido por:</strong> SX Connect</p>
                        <p><strong>Licença:</strong> Proprietária</p>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
