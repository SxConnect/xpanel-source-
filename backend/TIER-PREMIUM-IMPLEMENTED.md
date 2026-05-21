# ✅ Módulo Multi-usuário Premium - IMPLEMENTADO

> **Data**: 16/05/2026  
> **Status**: ✅ Completo e Funcional

---

## 🎯 Objetivo

Tornar o módulo de multi-usuário (gerenciamento de usuários) **exclusivo para tier PREMIUM**.

---

## ✅ Implementações Realizadas

### 1. Atualização do JWT Payload

**Arquivo**: `src/core/auth.ts`

**Mudanças**:
- ✅ Adicionado campo `tier` ao interface `JWTPayload`
- ✅ Atualizado `authMiddleware` para incluir `tier` do banco de dados
- ✅ Token JWT agora contém: `userId`, `email`, `role` e `tier`

```typescript
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    tier: string;  // ← NOVO
}
```

### 2. Middleware de Verificação de Tier

**Arquivo**: `src/core/tier-check.ts` (NOVO)

**Funções criadas**:

#### `requireTier(tier: 'PREMIUM')`
Middleware para proteger rotas que requerem tier específico.

```typescript
router.get('/premium-feature', authMiddleware, requireTier('PREMIUM'), controller.feature);
```

#### `canManageUsers()`
Middleware específico para gerenciamento de usuários.

**Regras**:
- ✅ **ADMIN**: Sempre pode (qualquer tier)
- ✅ **RESELLER + PREMIUM**: Pode criar usuários
- ❌ **RESELLER + FREE**: Bloqueado
- ❌ **USER**: Nunca pode

```typescript
router.get('/users', authMiddleware, canManageUsers, controller.listUsers);
```

#### `checkResourceLimit(userId, resourceType, prisma)`
Verifica limites de recursos baseado no tier.

**Limites FREE**:
- Domínios: 3
- Databases: 2
- Containers: 5
- Emails: 5

**Limites PREMIUM**:
- Configurável (0 = ilimitado)

### 3. Atualização do Controller de Usuários

**Arquivo**: `src/modules/users/users.controller.ts`

**Mudanças**:

#### Token com Tier
```typescript
// No register() e login()
const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    tier: user.tier,  // ← ADICIONADO
});
```

#### Novas Funções

**`createUser()`** - Criar sub-usuários
- ADMIN pode criar qualquer tipo de usuário
- RESELLER só pode criar USER com tier FREE
- Requer tier PREMIUM (via middleware)

**`updateUser()`** - Atualizar usuários
- ADMIN pode alterar tudo
- RESELLER só pode alterar nome
- Requer tier PREMIUM (via middleware)

**`deleteUser()`** - Deletar usuários
- Apenas ADMIN pode deletar
- Não pode deletar a si mesmo

### 4. Atualização das Rotas de Usuários

**Arquivo**: `src/modules/users/users.routes.ts`

**Mudanças**:

```typescript
import { canManageUsers } from '../../core/tier-check.js';

// Rotas protegidas por tier PREMIUM
router.get('/', authMiddleware, canManageUsers, controller.listUsers);
router.post('/create', authMiddleware, canManageUsers, controller.createUser);
router.put('/:id', authMiddleware, canManageUsers, controller.updateUser);
router.delete('/:id', authMiddleware, requireRole('ADMIN'), controller.deleteUser);
```

### 5. Verificação de Limites nos Controllers

**Arquivos atualizados**:
- `src/modules/hosting/hosting.controller.ts`
- `src/modules/email/email.controller.ts`

**Implementação**:

```typescript
// Exemplo: Criar domínio
export async function createDomain(req: AuthRequest, res: Response) {
    const userId = req.user?.userId!;
    
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
```

---

## 📊 Matriz de Permissões

### Gerenciamento de Usuários

| Role | Tier | Listar | Criar | Editar | Deletar |
|------|------|--------|-------|--------|---------|
| ADMIN | FREE | ✅ | ✅ | ✅ | ✅ |
| ADMIN | PREMIUM | ✅ | ✅ | ✅ | ✅ |
| RESELLER | FREE | ❌ | ❌ | ❌ | ❌ |
| RESELLER | PREMIUM | ✅ | ✅* | ✅** | ❌ |
| USER | FREE | ❌ | ❌ | ❌ | ❌ |
| USER | PREMIUM | ❌ | ❌ | ❌ | ❌ |

\* RESELLER só pode criar USER com tier FREE  
\** RESELLER só pode editar nome

### Limites de Recursos

| Recurso | FREE | PREMIUM |
|---------|------|---------|
| Domínios | 3 | Ilimitado* |
| Databases | 2 | Ilimitado* |
| Containers | 5 | Ilimitado* |
| Emails | 5 | Ilimitado* |

\* Configurável no banco de dados (0 = ilimitado)

---

## 🔧 Endpoints da API

### Gerenciamento de Usuários (PREMIUM)

#### GET /api/users
Lista todos os usuários

**Requer**: ADMIN ou RESELLER PREMIUM

**Response**:
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "USER",
      "tier": "FREE",
      "createdAt": "2026-05-16T...",
      "_count": {
        "domains": 2,
        "databases": 1,
        "containers": 3,
        "emails": 4
      }
    }
  ]
}
```

#### POST /api/users/create
Cria novo usuário

**Requer**: ADMIN ou RESELLER PREMIUM

**Body**:
```json
{
  "email": "newuser@example.com",
  "password": "senha123",
  "name": "New User",
  "role": "USER",      // Opcional (ADMIN only)
  "tier": "FREE"       // Opcional (ADMIN only)
}
```

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "USER",
    "tier": "FREE",
    "createdAt": "2026-05-16T..."
  }
}
```

#### PUT /api/users/:id
Atualiza usuário

**Requer**: ADMIN ou RESELLER PREMIUM

**Body**:
```json
{
  "name": "Updated Name",
  "role": "RESELLER",     // ADMIN only
  "tier": "PREMIUM",      // ADMIN only
  "maxDomains": 10        // ADMIN only
}
```

#### DELETE /api/users/:id
Deleta usuário

**Requer**: ADMIN apenas

**Response**:
```json
{
  "message": "Usuário deletado com sucesso"
}
```

---

## 🚫 Respostas de Erro

### Tier Insuficiente

**Status**: 403 Forbidden

```json
{
  "error": "Recurso premium",
  "message": "Este recurso requer uma conta Premium",
  "requiredTier": "PREMIUM",
  "currentTier": "FREE",
  "upgradeUrl": "/upgrade"
}
```

### Sem Permissão

**Status**: 403 Forbidden

```json
{
  "error": "Sem permissão",
  "message": "Apenas contas Premium com perfil Reseller podem gerenciar usuários",
  "requiredRole": "RESELLER",
  "requiredTier": "PREMIUM",
  "currentRole": "USER",
  "currentTier": "FREE"
}
```

### Limite Atingido

**Status**: 403 Forbidden

```json
{
  "error": "Limite atingido",
  "message": "Limite gratuito de domínios atingido (3). Faça upgrade para Premium.",
  "current": 3,
  "limit": 3,
  "upgradeUrl": "/upgrade"
}
```

---

## 🧪 Testes

### Cenários de Teste

#### 1. Multi-usuário

```bash
# Login como ADMIN
TOKEN=$(curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@xpanel.local","password":"admin123"}' \
  | jq -r '.token')

# Listar usuários (deve funcionar)
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer $TOKEN"

# Criar usuário (deve funcionar)
curl -X POST http://localhost:4000/api/users/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"newuser@test.com",
    "password":"test123",
    "name":"New User"
  }'
```

#### 2. RESELLER FREE (deve falhar)

```bash
# Login como RESELLER FREE
TOKEN=$(curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"reseller@test.com","password":"test123"}' \
  | jq -r '.token')

# Tentar listar usuários (deve retornar 403)
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer $TOKEN"
# Resposta: {"error":"Sem permissão",...}
```

#### 3. Limites FREE

```bash
# Login como USER FREE
TOKEN=$(curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"test123"}' \
  | jq -r '.token')

# Criar 3 domínios (deve funcionar)
for i in {1..3}; do
  curl -X POST http://localhost:4000/api/hosting/domains \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"domain\":\"test$i.com\",\"type\":\"SITE\"}"
done

# Tentar criar 4º domínio (deve retornar 403)
curl -X POST http://localhost:4000/api/hosting/domains \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domain":"test4.com","type":"SITE"}'
# Resposta: {"error":"Limite atingido",...}
```

---

## 📝 Checklist de Implementação

### Backend
- [x] Adicionar `tier` ao JWT payload
- [x] Criar middleware `requireTier()`
- [x] Criar middleware `canManageUsers()`
- [x] Criar função `checkResourceLimit()`
- [x] Atualizar controller de usuários
- [x] Adicionar funções CRUD de usuários
- [x] Proteger rotas com middleware
- [x] Adicionar verificação de limites em hosting
- [x] Adicionar verificação de limites em email
- [x] Compilação TypeScript sem erros

### Frontend (Próximo)
- [ ] Atualizar tipos para incluir `tier`
- [ ] Criar página de gerenciamento de usuários
- [ ] Criar página de upgrade/pricing
- [ ] Adicionar badge de tier no header
- [ ] Mostrar limites atuais vs máximos
- [ ] Mensagens de erro com link para upgrade

---

## 🎯 Próximos Passos

### 1. Frontend - Página de Usuários

Criar `src/pages/Users.tsx`:
- Listar usuários (tabela)
- Botão "Criar Usuário" (modal)
- Editar usuário (modal)
- Deletar usuário (confirmação)
- Mostrar contadores de recursos

### 2. Frontend - Página de Upgrade

Criar `src/pages/Upgrade.tsx`:
- Comparação FREE vs PREMIUM
- Tabela de features
- Botão de upgrade
- Informações de pagamento

### 3. Frontend - Indicadores de Limite

Adicionar em cada página:
- Badge mostrando "2/3 domínios usados"
- Barra de progresso
- Link para upgrade quando próximo do limite

### 4. Testes Automatizados

- [ ] Testes unitários dos middlewares
- [ ] Testes de integração das rotas
- [ ] Testes E2E do fluxo completo

---

## 📊 Impacto

### Antes
- ❌ Qualquer usuário podia ver lista de usuários
- ❌ Não havia controle de tier
- ❌ Não havia limites de recursos
- ❌ Multi-usuário era gratuito

### Depois
- ✅ Apenas ADMIN e RESELLER PREMIUM podem gerenciar usuários
- ✅ Tier está no JWT e é verificado
- ✅ Limites de recursos implementados
- ✅ Multi-usuário é recurso PREMIUM
- ✅ Mensagens claras sobre upgrade

---

## 🔐 Segurança

### Verificações Implementadas

1. **Autenticação**: JWT obrigatório
2. **Autorização por Role**: ADMIN, RESELLER, USER
3. **Autorização por Tier**: FREE, PREMIUM
4. **Limites de Recursos**: Verificados no backend
5. **Validação de Dados**: Zod schemas
6. **Proteção contra Escalação**: RESELLER não pode criar ADMIN

### Boas Práticas

- ✅ Verificação sempre no backend (nunca confiar no frontend)
- ✅ Tier incluído no JWT (evita queries extras)
- ✅ Mensagens de erro informativas
- ✅ Logs de auditoria
- ✅ Validação de permissões em cada endpoint

---

## 📈 Monetização

### Modelo de Negócio

**FREE Tier**:
- Uso pessoal
- Limites básicos
- Sem multi-usuário
- **Preço**: R$ 0/mês

**PREMIUM Tier**:
- Uso profissional
- Recursos ilimitados
- Multi-usuário (RESELLER)
- Backup avançado
- Suporte prioritário
- **Preço**: R$ 49/mês

### Conversão

Gatilhos para upgrade:
1. Atingir limite de recursos
2. Tentar acessar multi-usuário
3. Precisar de backup agendado
4. Querer mais de 3 domínios

---

## ✅ Conclusão

O módulo multi-usuário agora é **100% PREMIUM**.

### Funcionalidades
- ✅ Apenas ADMIN e RESELLER PREMIUM podem gerenciar usuários
- ✅ Limites de recursos implementados
- ✅ Verificação de tier em todas as rotas
- ✅ Mensagens claras sobre upgrade
- ✅ API completa e documentada

### Status
- ✅ Backend: Completo e funcional
- ⏳ Frontend: Aguardando implementação
- ✅ Compilação: Sem erros
- ✅ Documentação: Completa

---

**Desenvolvido com ❤️ pela SX Connect**

**Data**: 16/05/2026  
**Versão**: 0.1.0  
**Status**: ✅ IMPLEMENTADO E FUNCIONAL
