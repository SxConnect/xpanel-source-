# XPanel - API Documentation

> Versão: 0.1.0

## Base URL

```
http://localhost:4000/api
```

## Autenticação

Todas as rotas (exceto `/users/register` e `/users/login`) requerem autenticação via JWT.

**Header:**
```
Authorization: Bearer {token}
```

---

## 📊 Dashboard

### GET /dashboard/stats
Estatísticas gerais do sistema

**Response:**
```json
{
  "resources": {
    "domains": 10,
    "databases": 5,
    "containers": 8,
    "emails": 15,
    "backups": 3
  },
  "server": {
    "hostname": "server01",
    "platform": "linux",
    "cpus": 4,
    "totalMemoryGB": "16.00",
    "freeMemoryGB": "8.50"
  },
  "docker": {
    "containers": {
      "total": 8,
      "running": 6,
      "stopped": 2
    },
    "images": 12,
    "networks": 3,
    "volumes": 5
  }
}
```

### GET /dashboard/activity
Atividades recentes

### GET /dashboard/usage
Uso de recursos do usuário

### GET /dashboard/alerts
Alertas do sistema

---

## 👤 Users

### POST /users/register
Registrar novo usuário

**Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123",
  "name": "João Silva"
}
```

### POST /users/login
Login

**Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "João Silva",
    "role": "USER",
    "tier": "FREE"
  },
  "token": "jwt_token_here"
}
```

### GET /users/profile
Obter perfil do usuário autenticado

### PUT /users/profile
Atualizar perfil

### GET /users
Listar todos os usuários (admin only)

---

## 🐳 Docker

### GET /docker/containers
Listar containers

**Query:**
- `all` (boolean) - Incluir containers parados

### GET /docker/containers/:id
Inspecionar container

### POST /docker/containers/:id/start
Iniciar container

### POST /docker/containers/:id/stop
Parar container

### POST /docker/containers/:id/restart
Reiniciar container

### DELETE /docker/containers/:id
Remover container

**Query:**
- `force` (boolean) - Forçar remoção

### GET /docker/containers/:id/logs
Obter logs

**Query:**
- `tail` (number) - Número de linhas (padrão: 100)

### GET /docker/containers/:id/stats
Obter estatísticas em tempo real

### GET /docker/images
Listar imagens

### GET /docker/networks
Listar redes

### GET /docker/volumes
Listar volumes

### GET /docker/ping
Health check do Docker

---

## 🌐 Hosting

### GET /hosting/domains
Listar domínios

### GET /hosting/domains/:id
Obter detalhes de um domínio

### POST /hosting/domains
Criar novo domínio

**Body:**
```json
{
  "domain": "example.com",
  "type": "SITE",
  "phpVersion": "8.3",
  "documentRoot": "/var/www/html"
}
```

**Ou para container:**
```json
{
  "domain": "app.example.com",
  "type": "CONTAINER",
  "containerId": "container_id",
  "containerPort": 3000
}
```

### PUT /hosting/domains/:id
Atualizar domínio

### DELETE /hosting/domains/:id
Remover domínio

### POST /hosting/domains/:id/ssl/enable
Habilitar SSL

### POST /hosting/domains/:id/ssl/disable
Desabilitar SSL

### GET /hosting/stats
Estatísticas de hospedagem

---

## 📧 Email

### GET /email/accounts
Listar contas de email

### GET /email/accounts/:id
Obter detalhes de uma conta

### POST /email/accounts
Criar nova conta de email

**Body:**
```json
{
  "email": "contato@example.com",
  "password": "senha123",
  "quotaMB": 1024,
  "forwardTo": "outro@example.com"
}
```

### PUT /email/accounts/:id
Atualizar conta

### DELETE /email/accounts/:id
Remover conta

### GET /email/stats
Estatísticas de email

---

## 🌍 DNS

### GET /dns/domains/:domainId/records
Listar registros DNS de um domínio

### GET /dns/records/:id
Obter detalhes de um registro

### POST /dns/records
Criar novo registro DNS

**Body:**
```json
{
  "domainId": "domain_uuid",
  "type": "A",
  "name": "@",
  "value": "192.168.1.1",
  "ttl": 3600
}
```

**Tipos suportados:**
- A, AAAA, CNAME, MX, TXT, SPF, DKIM, DMARC, CAA, SRV

### PUT /dns/records/:id
Atualizar registro

### DELETE /dns/records/:id
Remover registro

### POST /dns/domains/:domainId/records/defaults
Criar registros DNS padrão

---

## 💾 Backup

### GET /backup
Listar backups

### GET /backup/:id
Obter detalhes de um backup

### POST /backup
Criar novo backup

**Body:**
```json
{
  "name": "Backup Completo",
  "type": "MANUAL",
  "includes": ["domains", "databases", "containers"],
  "destination": "S3",
  "path": "s3://bucket/path",
  "schedule": "0 2 * * *"
}
```

**Tipos:**
- `MANUAL` - Backup manual
- `SCHEDULED` - Backup agendado

**Destinos:**
- `LOCAL` - Armazenamento local
- `S3` - Amazon S3
- `B2` - Backblaze B2
- `SFTP` - Servidor SFTP

### DELETE /backup/:id
Remover backup

### POST /backup/:id/restore
Restaurar backup

---

## 📝 Códigos de Status

- `200` - OK
- `201` - Created
- `400` - Bad Request (dados inválidos)
- `401` - Unauthorized (não autenticado)
- `403` - Forbidden (sem permissão)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔐 Roles

- `ADMIN` - Acesso total
- `RESELLER` - Gerenciar sub-contas
- `USER` - Acesso aos próprios recursos

---

## 💎 Tiers

- `FREE` - Recursos limitados
- `PREMIUM` - Recursos ilimitados + módulos premium

---

## 📊 Exemplos de Uso

### Criar domínio e habilitar SSL

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@xpanel.local","password":"admin123"}' \
  | jq -r '.token')

# 2. Criar domínio
DOMAIN_ID=$(curl -X POST http://localhost:4000/api/hosting/domains \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domain":"example.com","type":"SITE","phpVersion":"8.3"}' \
  | jq -r '.domain.id')

# 3. Habilitar SSL
curl -X POST http://localhost:4000/api/hosting/domains/$DOMAIN_ID/ssl/enable \
  -H "Authorization: Bearer $TOKEN"
```

### Criar container e apontar domínio

```bash
# 1. Criar container (via Docker API ou docker-compose)
# 2. Obter ID do container
# 3. Criar domínio apontando para o container

curl -X POST http://localhost:4000/api/hosting/domains \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain":"app.example.com",
    "type":"CONTAINER",
    "containerId":"abc123",
    "containerPort":3000
  }'
```

### Criar backup agendado

```bash
curl -X POST http://localhost:4000/api/backup \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Backup Diário",
    "type":"SCHEDULED",
    "includes":["domains","databases"],
    "destination":"S3",
    "path":"s3://my-bucket/backups",
    "schedule":"0 2 * * *"
  }'
```

---

## 🔄 WebSocket (Futuro)

Eventos em tempo real:
- Container status changes
- Backup progress
- SSL renewal
- System alerts

```javascript
const ws = new WebSocket('ws://localhost:4001');

ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log(event.type, event.data);
});
```

---

**Desenvolvido com ❤️ pela SX Connect**
