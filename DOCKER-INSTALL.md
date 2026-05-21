# 🐳 XPanel - Guia de Instalação Docker

Este guia detalha o processo de instalação do XPanel usando Docker.

---

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Instalação Automática](#instalação-automática)
- [Instalação Manual](#instalação-manual)
- [Configuração](#configuração)
- [Verificação](#verificação)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### Sistema Operacional

- Ubuntu 20.04+ (recomendado: 22.04 LTS)
- Debian 11+ (recomendado: 12)
- Outras distros Linux com Docker suportado

### Hardware Mínimo

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| RAM | 1GB | 2GB+ |
| CPU | 1 core | 2+ cores |
| Disco | 10GB | 20GB+ |
| Rede | 10 Mbps | 100 Mbps+ |

### Acesso

- Acesso root via SSH
- Porta 80 disponível (ou outra porta configurável)
- Porta 443 disponível (para SSL)

---

## 🚀 Instalação Automática

### Método 1: Instalação com Um Comando

```bash
curl -fsSL https://raw.githubusercontent.com/sxconnect/install-xpanel/main/install-docker.sh | sudo bash
```

Este comando irá:
1. ✅ Verificar requisitos do sistema
2. ✅ Instalar Docker (se necessário)
3. ✅ Baixar arquivos de configuração
4. ✅ Gerar credenciais seguras
5. ✅ Baixar imagens Docker do GHCR
6. ✅ Iniciar containers
7. ✅ Configurar banco de dados
8. ✅ Criar usuário admin
9. ✅ Configurar firewall

**Tempo estimado:** 5-10 minutos

### Método 2: Download e Execução

```bash
# Baixar o instalador
wget https://raw.githubusercontent.com/sxconnect/install-xpanel/main/install-docker.sh

# Dar permissão de execução
chmod +x install-docker.sh

# Executar
sudo ./install-docker.sh
```

---

## 🛠️ Instalação Manual

Se preferir instalar manualmente ou personalizar a instalação:

### Passo 1: Instalar Docker

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y ca-certificates curl gnupg lsb-release

# Adicionar chave GPG do Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Adicionar repositório
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verificar instalação
docker --version
docker compose version
```

### Passo 2: Criar Diretório de Instalação

```bash
sudo mkdir -p /opt/xpanel
cd /opt/xpanel
```

### Passo 3: Baixar Arquivos de Configuração

```bash
# docker-compose.yml
sudo curl -fsSL https://raw.githubusercontent.com/sxconnect/install-xpanel/main/docker-compose.yml -o docker-compose.yml

# .env.example
sudo curl -fsSL https://raw.githubusercontent.com/sxconnect/install-xpanel/main/.env.example -o .env.example
```

### Passo 4: Configurar Variáveis de Ambiente

```bash
# Copiar exemplo
sudo cp .env.example .env

# Gerar senhas seguras
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# Editar .env
sudo nano .env
```

Configurar:
```env
POSTGRES_PASSWORD=sua_senha_gerada
JWT_SECRET=seu_secret_gerado
GITHUB_USERNAME=sxconnect
VERSION=latest
```

### Passo 5: Baixar Imagens Docker

```bash
sudo docker compose pull
```

### Passo 6: Iniciar Containers

```bash
sudo docker compose up -d
```

### Passo 7: Verificar Status

```bash
sudo docker compose ps
```

Você deve ver algo como:
```
NAME                IMAGE                                    STATUS
xpanel-backend      ghcr.io/sxconnect/xpanel-backend:latest  Up (healthy)
xpanel-frontend     ghcr.io/sxconnect/xpanel-frontend:latest Up (healthy)
xpanel-postgres     postgres:15-alpine                       Up (healthy)
```

### Passo 8: Executar Migrations

```bash
sudo docker compose exec backend npx prisma db push
```

### Passo 9: Criar Usuário Admin

```bash
sudo docker compose exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createAdmin() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@xpanel.local' },
        update: {},
        create: {
            email: 'admin@xpanel.local',
            password: hashedPassword,
            name: 'Administrator',
            role: 'ADMIN',
            tier: 'PREMIUM'
        }
    });
    console.log('Admin created');
    await prisma.\$disconnect();
}

createAdmin();
"
```

### Passo 10: Configurar Firewall

```bash
# Instalar UFW
sudo apt install -y ufw

# Configurar regras
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

---

## ⚙️ Configuração

### Configurar Domínio Personalizado

Edite o arquivo `.env`:

```bash
sudo nano /opt/xpanel/.env
```

Adicione:
```env
DOMAIN=xpanel.seudominio.com
```

### Configurar SSL/HTTPS

```bash
# Instalar Certbot
sudo apt install -y certbot

# Obter certificado
sudo certbot certonly --standalone -d xpanel.seudominio.com

# Configurar renovação automática
sudo certbot renew --dry-run
```

### Configurar Porta Customizada

Edite `.env`:
```env
FRONTEND_PORT=8080
```

Reinicie:
```bash
sudo docker compose up -d
```

---

## ✅ Verificação

### Verificar Containers

```bash
cd /opt/xpanel
sudo docker compose ps
```

Todos devem estar **Up** e **healthy**.

### Verificar Logs

```bash
# Todos os logs
sudo docker compose logs

# Apenas backend
sudo docker compose logs backend

# Seguir logs em tempo real
sudo docker compose logs -f
```

### Verificar Conectividade

```bash
# Health check do backend
curl http://localhost:4000/health

# Health check do frontend
curl http://localhost/health
```

### Acessar o Painel

Abra no navegador:
```
http://SEU_IP_DO_SERVIDOR
```

Credenciais:
- Email: `admin@xpanel.local`
- Senha: `admin123`

---

## 🔧 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
sudo docker compose logs [nome-do-container]

# Reiniciar container específico
sudo docker compose restart [nome-do-container]

# Recriar container
sudo docker compose up -d --force-recreate [nome-do-container]
```

### Erro de conexão com banco de dados

```bash
# Verificar se PostgreSQL está rodando
sudo docker compose ps postgres

# Ver logs do PostgreSQL
sudo docker compose logs postgres

# Reiniciar PostgreSQL
sudo docker compose restart postgres

# Verificar variáveis de ambiente
sudo docker compose exec backend env | grep DATABASE_URL
```

### Porta 80 já está em uso

```bash
# Verificar o que está usando a porta
sudo lsof -i :80

# Parar serviço conflitante (exemplo: Apache)
sudo systemctl stop apache2
sudo systemctl disable apache2

# Ou usar porta diferente no .env
FRONTEND_PORT=8080
```

### Frontend não carrega

```bash
# Verificar se backend está respondendo
curl http://localhost:4000/health

# Verificar logs do frontend
sudo docker compose logs frontend

# Limpar cache do navegador
# Ctrl + Shift + Delete
```

### Imagens não baixam

```bash
# Verificar conectividade com GHCR
curl -I https://ghcr.io

# Tentar pull manual
sudo docker pull ghcr.io/sxconnect/xpanel-backend:latest
sudo docker pull ghcr.io/sxconnect/xpanel-frontend:latest

# Verificar espaço em disco
df -h
```

### Erro de permissão no Docker socket

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Relogar ou executar
newgrp docker

# Verificar permissões
ls -la /var/run/docker.sock
```

---

## 🔄 Comandos Úteis

### Gerenciamento

```bash
# Ver status
sudo docker compose ps

# Ver logs
sudo docker compose logs -f

# Reiniciar tudo
sudo docker compose restart

# Parar tudo
sudo docker compose stop

# Iniciar tudo
sudo docker compose start

# Recriar tudo
sudo docker compose up -d --force-recreate
```

### Atualização

```bash
# Baixar novas versões
sudo docker compose pull

# Aplicar atualizações
sudo docker compose up -d
```

### Backup

```bash
# Backup do banco
sudo docker compose exec postgres pg_dump -U xpanel xpanel > backup.sql

# Backup completo
sudo tar -czf xpanel-backup.tar.gz /opt/xpanel
```

### Limpeza

```bash
# Remover containers parados
sudo docker container prune

# Remover imagens não utilizadas
sudo docker image prune

# Limpeza completa
sudo docker system prune -a
```

---

## 📚 Próximos Passos

Após a instalação:

1. ✅ [Alterar senha do admin](CONFIGURATION.md#alterar-senha)
2. ✅ [Configurar SSL/HTTPS](SSL-SETUP.md)
3. ✅ [Configurar backup automático](BACKUP.md)
4. ✅ [Explorar funcionalidades](QUICKSTART.md)
5. ✅ [Fazer upgrade para Premium](https://xpanel.sxconnect.com.br/pricing)

---

## 🆘 Precisa de Ajuda?

- 📧 Email: suporte@sxconnect.com.br
- 💬 Discord: https://discord.gg/xpanel
- 📚 Docs: https://docs.xpanel.sxconnect.com.br
- 🐛 Issues: https://github.com/sxconnect/install-xpanel/issues

---

**🚀 Desenvolvido com ❤️ pela SX Connect**
