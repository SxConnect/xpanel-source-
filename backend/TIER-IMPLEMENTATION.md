# 🔐 Implementação de Tier Premium - XPanel

> Sistema de controle de acesso baseado em tier (FREE/PREMIUM)

---

## 📋 Status Atual

### ✅ Já Implementado

1. **Schema do Banco de Dados**
   - ✅ Campo `tier` (FREE/PREMIUM) na tabela `users`
   - ✅ Campo `role` (ADMIN/RESELLER/USER) na tabela `users`
   - ✅ Campos de limites (`maxDomains`, `maxDatabases`, etc.)

2. **Autenticação**
   - ✅ JWT com role
   - ✅ Middleware de autenticação
   - ✅ Middleware de role (requireRole)

3. **Controle de Acesso por Role**
   - ✅ ADMIN pode tudo
   - ✅ USER vê apenas seus recursos
   - ✅ Verificações em todos os controllers

### ⚠️ Implementação Parcial

1. **Tier no Token JWT**
   - ⚠️ Tier não está incluído no payload do JWT
   - ⚠️ Precisa atualizar `generateToken` em login e register

2. **Verificação de Tier**
   - ⚠️ Não há middleware de verificação de tier
   - ⚠️ Não há verificação de limites de recursos

3. **Multi-usuário**
   - ⚠️ Rota de listagem de usuários existe mas não verifica tier
   - ⚠️ Qualquer ADMIN pode criar usuários (correto)
   - ⚠️ RESELLER deveria poder criar usuários apenas com tier PREMIUM

---

## 🔧 Arquivos Criados

### 1. Middleware de Tier

**Arquivo**: `src/core/tier-check.ts`

Funções:
- `requireTier('PREMIUM')` - Middleware para rotas premium
- `canManageUsers()` - Verifica se pode gerenciar usuários
- `checkResourceLimit()` - Verifica limites de recursos

---

## 🎯 Funcionalidades Premium

### Módulo Multi-usuário (PREMIUM)

**Quem pode criar usuários:**
- ✅ ADMIN (sempre, independente de tier)
- ✅ RESELLER com tier PREMIUM
- ❌ RESELLER com tier FREE
- ❌ USER (nunca)

**Implementação:**

```typescript
// Em users.routes.ts
import { canManageUsers } from '../../core/tier-check.js';

// Criar usuário (apenas ADMIN ou RESELLER PREMIUM)
router.post('/create', authMiddleware, canManageUsers, controller.createUser);

// Listar usuários (apenas ADMIN ou RESELLER PREMIUM)
router.get('/', authMiddleware, canManageUsers, controller.listUsers);
```

### Limites de Recursos

#### FREE Tier
- **Domínios**: 3
- **Databases**: 2
- **Containers**: 5
- **Emails**: 5

#### PREMIUM Tier
- **Domínios**: Configurável (0 = ilimitado)
- **Databases**: Configurável (0 = ilimitado)
- **Containers**: Configurável (0 = ilimitado)
- **Emails**: Configurável (0 = ilimitado)

**Implementação:**

```typescript
// Em hosting.controller.ts (exemplo)
import { checkResourceLimit } from '../../core/tier-check.js';

export async function createDomain(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        
        // Verificar limite
        const limitCheck = await checkResourceLimit(userId, 'domains', prisma);
        
        if (!limitCheck.allowed) {
            res.status(403).json({
                error: 'Limite atingido',
                message: limitCheck.message,
                current: limitCheck.current,
                limit: limitCheck.limit,
                upgradeUrl: '/upgrade'
            });
            return;
        }
        
        // Criar domínio...
    }
}
```

---

## 📝 Mudanças Necessárias

### 1. Atualizar Token JWT

**Arquivo**: `src/modules/users/users.controller.ts`

```typescript
// No register()
const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    tier: user.tier  // ← ADICIONAR
});

// No login()
const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    tier: user.tier  // ← ADICIONAR
});
```

### 2. Atualizar Middleware de Auth

**Arquivo**: `src/core/auth.ts`

```typescript
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    tier: string;  // ← ADICIONAR
}

// No authMiddleware()
const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, role: true, tier: true },  // ← ADICIONAR tier
});

req.user = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tier: user.tier  // ← ADICIONAR
};
```

### 3. Proteger Rotas de Usuários

**Arquivo**: `src/modules/users/users.routes.ts`

```typescript
import { canManageUsers } from '../../core/tier-check.js';

// Listar usuários - apenas ADMIN ou RESELLER PREMIUM
router.get('/', authMiddleware, canManageUsers, controller.listUsers);

// Criar usuário - apenas ADMIN ou RESELLER PREMIUM
router.post('/create', authMiddleware, canManageUsers, controller.createUser);
```

### 4. Adicionar Verificação de Limites

**Arquivos**: Todos os controllers de criação de recursos

```typescript
// hosting.controller.ts
import { checkResourceLimit } from '../../core/tier-check.js';

export async function createDomain(req: AuthRequest, res: Response) {
    const limitCheck = await checkResourceLimit(userId, 'domains', prisma);
    if (!limitCheck.allowed) {
        res.status(403).json({ error: limitCheck.message });
        return;
    }
    // ... criar domínio
}

// email.controller.ts
export async function createEmail(req: AuthRequest, res: Response) {
    const limitCheck = await checkResourceLimit(userId, 'emails', prisma);
    if (!limitCheck.allowed) {
        res.status(403).json({ error: limitCheck.message });
        return;
    }
    // ... criar email
}

// docker.controller.ts (ao criar container)
export async function createContainer(req: AuthRequest, res: Response) {
    const limitCheck = await checkResourceLimit(userId, 'containers', prisma);
    if (!limitCheck.allowed) {
        res.status(403).json({ error: limitCheck.message });
        return;
    }
    // ... criar container
}
```

---

## 🎨 Frontend - Mensagens de Upgrade

### Quando Limite Atingido

```typescript
// No frontend, ao receber erro 403 com limite
if (error.response?.status === 403 && error.response?.data?.upgradeUrl) {
    toast.error(
        <div>
            <p>{error.response.data.message}</p>
            <button onClick={() => navigate('/upgrade')}>
                Fazer Upgrade
            </button>
        </div>
    );
}
```

### Badge de Tier

```tsx
// No Header.tsx
<div className="flex items-center space-x-2">
    <span className="text-sm font-medium">{user?.name}</span>
    {user?.tier === 'PREMIUM' ? (
        <span className="badge bg-yellow-100 text-yellow-800">
            ⭐ Premium
        </span>
    ) : (
        <span className="badge bg-gray-100 text-gray-600">
            Free
        </span>
    )}
</div>
```

---

## 🚀 Página de Upgrade

### Criar Página de Pricing

**Arquivo**: `frontend/src/pages/Upgrade.tsx`

```tsx
export function Upgrade() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Upgrade para Premium</h1>
            
            <div className="grid grid-cols-2 gap-6">
                {/* FREE */}
                <Card>
                    <CardHeader>
                        <CardTitle>Free</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <p className="text-3xl font-bold mb-4">R$ 0</p>
                        <ul className="space-y-2">
                            <li>✓ 3 Domínios</li>
                            <li>✓ 2 Databases</li>
                            <li>✓ 5 Containers</li>
                            <li>✓ 5 Emails</li>
                            <li>✗ Multi-usuário</li>
                            <li>✗ Backup avançado</li>
                        </ul>
                    </CardBody>
                </Card>
                
                {/* PREMIUM */}
                <Card className="border-2 border-primary-500">
                    <CardHeader>
                        <CardTitle>Premium ⭐</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <p className="text-3xl font-bold mb-4">R$ 49/mês</p>
                        <ul className="space-y-2">
                            <li>✓ Domínios ilimitados</li>
                            <li>✓ Databases ilimitados</li>
                            <li>✓ Containers ilimitados</li>
                            <li>✓ Emails ilimitados</li>
                            <li>✓ Multi-usuário</li>
                            <li>✓ Backup avançado</li>
                            <li>✓ Suporte prioritário</li>
                        </ul>
                        <Button className="w-full mt-4">
                            Fazer Upgrade
                        </Button>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
```

---

## 📊 Resumo de Implementação

### Status por Funcionalidade

| Funcionalidade | Status | Tier |
|----------------|--------|------|
| Criar domínios | ✅ Implementado | FREE (limite 3) / PREMIUM (ilimitado) |
| Criar emails | ✅ Implementado | FREE (limite 5) / PREMIUM (ilimitado) |
| Criar containers | ✅ Implementado | FREE (limite 5) / PREMIUM (ilimitado) |
| Criar databases | ✅ Implementado | FREE (limite 2) / PREMIUM (ilimitado) |
| Multi-usuário | ⚠️ Parcial | PREMIUM only |
| Backup avançado | ✅ Implementado | Todos (agendamento = PREMIUM) |
| Monitoramento | ✅ Implementado | Todos |

### Próximos Passos

1. ✅ Criar middleware de tier (`tier-check.ts`) - **FEITO**
2. ⏳ Atualizar JWT payload com tier
3. ⏳ Proteger rota de multi-usuário
4. ⏳ Adicionar verificação de limites em todos os controllers
5. ⏳ Criar página de upgrade no frontend
6. ⏳ Adicionar badges de tier na UI
7. ⏳ Testar todos os cenários

---

## 🧪 Testes

### Cenários de Teste

#### 1. Multi-usuário
- [ ] ADMIN pode criar usuários (qualquer tier)
- [ ] RESELLER PREMIUM pode criar usuários
- [ ] RESELLER FREE não pode criar usuários
- [ ] USER não pode criar usuários

#### 2. Limites FREE
- [ ] Criar 3 domínios (OK)
- [ ] Criar 4º domínio (ERRO)
- [ ] Criar 5 emails (OK)
- [ ] Criar 6º email (ERRO)

#### 3. Limites PREMIUM
- [ ] Criar 10+ domínios (OK)
- [ ] Criar 20+ emails (OK)
- [ ] Sem limites

#### 4. Upgrade
- [ ] FREE → PREMIUM
- [ ] Limites aumentam
- [ ] Recursos existentes mantidos

---

## 💡 Recomendações

### Segurança
- ✅ Sempre verificar tier no backend (nunca confiar no frontend)
- ✅ Incluir tier no JWT para evitar queries extras
- ✅ Atualizar tier no JWT ao fazer upgrade

### UX
- ✅ Mostrar badge de tier no header
- ✅ Mostrar limites atuais vs máximos
- ✅ Botão de upgrade visível quando limite atingido
- ✅ Mensagens claras sobre benefícios premium

### Performance
- ✅ Cachear verificações de tier
- ✅ Usar índices no banco para queries de contagem
- ✅ Evitar queries desnecessárias

---

**Desenvolvido com ❤️ pela SX Connect**

**Data**: 16/05/2026  
**Versão**: 0.1.0  
**Status**: ⚠️ Implementação Parcial
