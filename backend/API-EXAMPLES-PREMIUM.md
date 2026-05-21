# 🔐 Exemplos de API - Módulo Premium

> Exemplos práticos de uso da API com tier PREMIUM

---

## 🎯 Cenários de Uso

### 1. ADMIN - Gerenciamento Completo

#### Login como ADMIN

```bash
curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@xpanel.local",
    "password": "admin123"
  }'
```

**Response**:
```json
{
  "user": {
    "id": "uuid-admin",
    "email": "admin@xpanel.local",
    "name": "Administrator",
    "role": "ADMIN",
    "tier": "PREMIUM"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Listar Todos os Usuários

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl http://localhost:4000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

**Response**:
```json
{
  "users": [
    {
      "id": "uuid-1",
      "email": "admin@xpanel.local",
      "name": "Administrator",
      "role": "ADMIN",
      "tier": "PREMIUM",
      "createdAt": "2026-05-16T10:00:00Z",
      "_count": {
        "domains": 10,
        "databases": 5,
        "containers": 8,
        "emails": 15
      }
    },
    {
      "id": "uuid-2",
      "email": "reseller@example.com",
      "name": "Reseller User",
      "role": "RESELLER",
      "tier": "PREMIUM",
      "createdAt": "2026-05-16T11:00:00Z",
      "_count": {
        "domains": 5,
        "databases": 2,
        "containers": 3,
        "emails": 8
      }
    }
  ]
}
```

#### Criar Usuário RESELLER PREMIUM

```bash
curl -X POST http://localhost:4000/api/users/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newreseller@example.com",
    "password": "senha123",
    "name": "New Reseller",
    "role": "RESELLER",
    "tier": "PREMIUM"
  }'
```

**Response**:
```json
{
  "user": {
    "id": "uuid-new",
    "email": "newreseller@example.com",
    "name": "New Reseller",
    "role": "RESELLER",
    "tier": "PREMIUM",
    "createdAt": "2026-05-16T12:00:00Z"
  }
}
```

#### Atualizar Tier de Usuário

```bash
curl -X PUT http://localhost:4000/api/users/uuid-user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "PREMIUM",
    "maxDomains": 0,
    "maxEmails": 0
  }'
```

**Response**:
```json
{
  "user": {
    "id": "uuid-user",
    "email": "user@example.com",
    "name": "User Name",
    "role": "USER",
    "tier": "PREMIUM",
    "maxDomains": 0,
    "maxEmails": 0
  }
}
```

---

### 2. RESELLER PREMIUM - Gerenciamento Limitado

#### Login como RESELLER PREMIUM

```bash
curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "reseller@example.com",
    "password": "senha123"
  }'
```

**Response**:
```json
{
  "user": {
    "id": "uuid-reseller",
    "email": "reseller@example.com",
    "name": "Reseller User",
    "role": "RESELLER",
    "tier": "PREMIUM"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Criar Sub-usuário (USER FREE)

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:4000/api/users/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "senha123",
    "name": "Client User"
  }'
```

**Response**:
```json
{
  "user": {
    "id": "uuid-client",
    "email": "client@example.com",
    "name": "Client User",
    "role": "USER",
    "tier": "FREE",
    "createdAt": "2026-05-16T13:00:00Z"
  }
}
```

**Nota**: RESELLER sempre cria USER com tier FREE, mesmo que tente especificar PREMIUM.

#### Listar Seus Usuários

```bash
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

**Response**: Lista todos os usuários (RESELLER vê todos)

---

### 3. RESELLER FREE - Bloqueado

#### Login como RESELLER FREE

```bash
curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "reseller-free@example.com",
    "password": "senha123"
  }'
```

**Response**:
```json
{
  "user": {
    "id": "uuid-reseller-free",
    "email": "reseller-free@example.com",
    "name": "Reseller Free",
    "role": "RESELLER",
    "tier": "FREE"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Tentar Listar Usuários (BLOQUEADO)

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl http://localhost:4000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

**Response** (403 Forbidden):
```json
{
  "error": "Sem permissão",
  "message": "Apenas contas Premium com perfil Reseller podem gerenciar usuários",
  "requiredRole": "RESELLER",
  "requiredTier": "PREMIUM",
  "currentRole": "RESELLER",
  "currentTier": "FREE"
}
```

#### Tentar Criar Usuário (BLOQUEADO)

```bash
curl -X POST http://localhost:4000/api/users/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "senha123",
    "name": "Test User"
  }'
```

**Response** (403 Forbidden):
```json
{
  "error": "Sem permissão",
  "message": "Apenas contas Premium com perfil Reseller podem gerenciar usuários",
  "requiredRole": "RESELLER",
  "requiredTier": "PREMIUM",
  "currentRole": "RESELLER",
  "currentTier": "FREE"
}
```

---

### 4. USER FREE - Limites de Recursos

#### Login como USER FREE

```bash
curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "senha123"
  }'
```

**Response**:
```json
{
  "user": {
    "id": "uuid-user",
    "email": "user@example.com",
    "name": "User Name",
    "role": "USER",
    "tier": "FREE"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Criar Domínios (até 3)

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Domínio 1 (OK)
curl -X POST http://localhost:4000/api/hosting/domains \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "site1.com",
    "type": "SITE",
    "phpVersion": "8.3"
  }'

# Domínio 2 (OK)
curl -X POST http://localhost:4000/api/hosting/domains \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "site2.com",
    "type": "SITE",
    "phpVersion": "8.3"
  }'

# Domínio 3 (OK)
curl -X POST http://localhost:4000/api/hosting/domains \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "site3.com",
    "type": "SITE",
    "phpVersion": "8.3"
  }'
```

#### Tentar Criar 4º Domínio (BLOQUEADO)

```bash
curl -X POST http://localhost:4000/api/hosting/domains \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "site4.com",
    "type": "SITE",
    "phpVersion": "8.3"
  }'
```

**Response** (403 Forbidden):
```json
{
  "error": "Limite atingido",
  "message": "Limite gratuito de domínios atingido (3). Faça upgrade para Premium.",
  "current": 3,
  "limit": 3,
  "upgradeUrl": "/upgrade"
}
```

#### Criar Emails (até 5)

```bash
# Email 1-5 (OK)
for i in {1..5}; do
  curl -X POST http://localhost:4000/api/email/accounts \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"email$i@site1.com\",
      \"password\": \"senha123\",
      \"quotaMB\": 1024
    }"
done
```

#### Tentar Criar 6º Email (BLOQUEADO)

```bash
curl -X POST http://localhost:4000/api/email/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "email6@site1.com",
    "password": "senha123",
    "quotaMB": 1024
  }'
```

**Response** (403 Forbidden):
```json
{
  "error": "Limite atingido",
  "message": "Limite gratuito de emails atingido (5). Faça upgrade para Premium.",
  "current": 5,
  "limit": 5,
  "upgradeUrl": "/upgrade"
}
```

---

### 5. USER PREMIUM - Sem Limites

#### Login como USER PREMIUM

```bash
curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "premium@example.com",
    "password": "senha123"
  }'
```

**Response**:
```json
{
  "user": {
    "id": "uuid-premium",
    "email": "premium@example.com",
    "name": "Premium User",
    "role": "USER",
    "tier": "PREMIUM"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Criar 10+ Domínios (OK)

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

for i in {1..10}; do
  curl -X POST http://localhost:4000/api/hosting/domains \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"domain\": \"site$i.com\",
      \"type\": \"SITE\",
      \"phpVersion\": \"8.3\"
    }"
done
```

**Response**: Todos criados com sucesso (sem limite)

---

## 📊 Tabela de Comparação

| Ação | ADMIN | RESELLER PREMIUM | RESELLER FREE | USER PREMIUM | USER FREE |
|------|-------|------------------|---------------|--------------|-----------|
| Listar usuários | ✅ | ✅ | ❌ | ❌ | ❌ |
| Criar usuário | ✅ | ✅* | ❌ | ❌ | ❌ |
| Editar usuário | ✅ | ✅** | ❌ | ❌ | ❌ |
| Deletar usuário | ✅ | ❌ | ❌ | ❌ | ❌ |
| Domínios | ∞ | ∞ | 3 | ∞ | 3 |
| Emails | ∞ | ∞ | 5 | ∞ | 5 |
| Containers | ∞ | ∞ | 5 | ∞ | 5 |
| Databases | ∞ | ∞ | 2 | ∞ | 2 |

\* RESELLER só pode criar USER com tier FREE  
\** RESELLER só pode editar nome

---

## 🔧 Scripts de Teste

### Script Completo de Teste

```bash
#!/bin/bash

BASE_URL="http://localhost:4000/api"

echo "=== Teste 1: ADMIN ==="
ADMIN_TOKEN=$(curl -s -X POST $BASE_URL/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@xpanel.local","password":"admin123"}' \
  | jq -r '.token')

echo "Token ADMIN: $ADMIN_TOKEN"

echo "Listando usuários como ADMIN..."
curl -s $BASE_URL/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.users | length'

echo ""
echo "=== Teste 2: RESELLER FREE (deve falhar) ==="
# Primeiro criar um RESELLER FREE
curl -s -X POST $BASE_URL/users/create \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"reseller-free@test.com",
    "password":"test123",
    "name":"Reseller Free",
    "role":"RESELLER",
    "tier":"FREE"
  }' | jq '.'

# Login como RESELLER FREE
RESELLER_FREE_TOKEN=$(curl -s -X POST $BASE_URL/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"reseller-free@test.com","password":"test123"}' \
  | jq -r '.token')

echo "Tentando listar usuários como RESELLER FREE..."
curl -s $BASE_URL/users \
  -H "Authorization: Bearer $RESELLER_FREE_TOKEN" \
  | jq '.'

echo ""
echo "=== Teste 3: USER FREE - Limites ==="
# Criar USER FREE
curl -s -X POST $BASE_URL/users/create \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user-free@test.com",
    "password":"test123",
    "name":"User Free"
  }' | jq '.'

# Login como USER FREE
USER_FREE_TOKEN=$(curl -s -X POST $BASE_URL/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user-free@test.com","password":"test123"}' \
  | jq -r '.token')

echo "Criando 3 domínios (deve funcionar)..."
for i in {1..3}; do
  curl -s -X POST $BASE_URL/hosting/domains \
    -H "Authorization: Bearer $USER_FREE_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"domain\":\"test$i.com\",\"type\":\"SITE\"}" \
    | jq '.domain.domain'
done

echo "Tentando criar 4º domínio (deve falhar)..."
curl -s -X POST $BASE_URL/hosting/domains \
  -H "Authorization: Bearer $USER_FREE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domain":"test4.com","type":"SITE"}' \
  | jq '.'

echo ""
echo "=== Testes Concluídos ==="
```

---

## 📝 Notas Importantes

### Segurança

1. **Sempre verificar tier no backend**
   - Nunca confiar no frontend
   - Tier está no JWT mas é validado contra o banco

2. **Logs de auditoria**
   - Todas as ações são registradas
   - Incluem IP e user agent

3. **Rate limiting**
   - Implementar limite de requisições
   - Prevenir abuso da API

### Performance

1. **Cache de tier**
   - Tier está no JWT (evita query extra)
   - Atualizar JWT ao fazer upgrade

2. **Índices no banco**
   - Índice em `userId` para queries rápidas
   - Índice em `tier` para relatórios

---

**Desenvolvido com ❤️ pela SX Connect**

**Data**: 16/05/2026  
**Versão**: 0.1.0
