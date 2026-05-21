# 🚀 XPanel - Guia de Instalação

> **Instalador automático para VPS Ubuntu/Debian**

---

## 📋 Requisitos Mínimos

### Sistema Operacional
- ✅ Ubuntu 20.04 LTS ou superior
- ✅ Debian 11 ou superior

### Hardware
- **RAM**: 2GB (mínimo 1GB)
- **Disco**: 10GB livres (mínimo 5GB)
- **CPU**: 1 core (recomendado 2+)

### Acesso
- ✅ Acesso root (sudo)
- ✅ Conexão com internet

---

## ⚡ Instalação Rápida

### Método 1: Instalação Direta (Recomendado)

```bash
curl -fsSL https://raw.githubusercontent.com/seu-usuario/xpanel/main/install.sh | sudo bash
```

### Método 2: Download e Execução

```bash
# Download do instalador
wget https://raw.githubusercontent.com/seu-usuario/xpanel/main/install.sh

# Dar permissão de execução
chmod +x install.sh

# Executar instalação
sudo ./install.sh
```

---

## 📦 O Que Será Instalado

### Dependências do Sistema
- ✅ **Node.js 20** - Runtime JavaScript
- ✅ **PostgreSQL 15** - Banco de dados
- ✅ **Docker** - Gerenciamento de containers
- ✅ **Nginx** - Servidor web e proxy reverso
- ✅ **PM2** - Gerenciador de processos Node.js
- ✅ **Certbot** - Certificados SSL (Let's Encrypt)
- ✅ **UFW** - Firewall

### Aplicação
- ✅ **XPanel Backend** - API REST
- ✅ **XPanel Frontend** - Interface web
- ✅ **Banco de dados** - PostgreSQL configurado
- ✅ **Usuário admin** - Criado automaticamente

---

## 🔧 Processo de Instalação

O instalador executa os seguintes passos automaticamente:

### 1. Verificações Iniciais
- ✅ Verifica se é executado como root
- ✅ Detecta sistema operacional
- ✅ Verifica requisitos de hardware

### 2. Instalação de Dependências
- ✅ Atualiza repositórios do sistema
- ✅ Instala Node.js 20
- ✅ Instala PostgreSQL 15
- ✅ Instala Docker
- ✅ Instala Nginx
- ✅ Instala PM2 globalmente

### 3. Configuração do Banco de Dados
- ✅ Cria banco de dados `xpanel`
- ✅ Cria usuário `xpanel` com senha aleatória
- ✅ Configura permissões

### 4. Clonagem do Repositório
- ✅ Clona código do GitHub
- ✅ Instala em `/opt/xpanel`

### 5. Configuração do Backend
- ✅ Instala dependências npm
- ✅ Cria arquivo `.env` com configurações
- ✅ Executa migrations do Prisma
- ✅ Cria usuário admin padrão
- ✅ Compila TypeScript

### 6. Configuração do Frontend
- ✅ Instala dependências npm
- ✅ Cria arquivo `.env`
- ✅ Compila para produção

### 7. Configuração do Nginx
- ✅ Cria virtual host
- ✅ Configura proxy reverso para API
- ✅ Serve frontend estático

### 8. Configuração do PM2
- ✅ Inicia backend como serviço
- ✅ Configura auto-start no boot

### 9. Configuração do Firewall
- ✅ Ativa UFW
- ✅ Permite SSH, HTTP, HTTPS

### 10. Finalização
- ✅ Cria arquivo com informações de acesso
- ✅ Exibe credenciais de acesso

---

## 🎯 Após a Instalação

### Acessar o Painel

```
URL: http://SEU_IP_DO_SERVIDOR

Credenciais:
  Email: admin@xpanel.local
  Senha: admin123
```

⚠️ **IMPORTANTE**: Altere a senha do admin imediatamente após o primeiro login!

### Verificar Serviços

```bash
# Status do backend
pm2 status

# Logs do backend
pm2 logs xpanel-backend

# Status do Nginx
systemctl status nginx

# Status do PostgreSQL
systemctl status postgresql

# Status do Docker
systemctl status docker
```

### Informações da Instalação

Todas as informações (senhas, configurações, comandos úteis) estão em:

```bash
cat /opt/xpanel/INSTALLATION_INFO.txt
```

---

## 🔒 Configurar SSL (HTTPS)

### Pré-requisitos
- ✅ Domínio apontando para o IP do servidor
- ✅ Portas 80 e 443 abertas

### Instalação do Certificado

```bash
# Substituir example.com pelo seu domínio
sudo certbot --nginx -d example.com -d www.example.com

# Renovação automática já está configurada
```

### Atualizar Frontend

Edite `/opt/xpanel/frontend/.env`:

```env
VITE_API_URL=https://example.com/api
```

Recompile o frontend:

```bash
cd /opt/xpanel/frontend
npm run build
```

---

## 🔄 Atualizar XPanel

### Atualização Manual

```bash
cd /opt/xpanel

# Fazer backup do banco de dados
sudo -u postgres pg_dump xpanel > backup_$(date +%Y%m%d).sql

# Atualizar código
git pull

# Atualizar backend
cd backend
npm install
npm run build
pm2 restart xpanel-backend

# Atualizar frontend
cd ../frontend
npm install
npm run build
```

### Script de Atualização Automática

```bash
# Download do script
wget https://raw.githubusercontent.com/seu-usuario/xpanel/main/update.sh

# Executar atualização
sudo bash update.sh
```

---

## 🐛 Troubleshooting

### Erro: "Port 80 already in use"

Outro serviço está usando a porta 80 (provavelmente Apache):

```bash
# Parar Apache
sudo systemctl stop apache2
sudo systemctl disable apache2

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Erro: "Cannot connect to database"

Verificar se PostgreSQL está rodando:

```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Erro: "Backend not responding"

Verificar logs do PM2:

```bash
pm2 logs xpanel-backend
pm2 restart xpanel-backend
```

### Frontend mostra página em branco

Verificar se o build foi feito corretamente:

```bash
cd /opt/xpanel/frontend
npm run build
sudo systemctl restart nginx
```

### Erro: "Docker permission denied"

Adicionar usuário ao grupo docker:

```bash
sudo usermod -aG docker $USER
# Fazer logout e login novamente
```

---

## 📊 Estrutura de Diretórios

```
/opt/xpanel/
├── backend/
│   ├── dist/              # Código compilado
│   ├── src/               # Código fonte
│   ├── prisma/            # Schema do banco
│   ├── .env               # Configurações
│   └── package.json
├── frontend/
│   ├── dist/              # Build de produção
│   ├── src/               # Código fonte
│   ├── .env               # Configurações
│   └── package.json
├── install.sh             # Script de instalação
├── update.sh              # Script de atualização
└── INSTALLATION_INFO.txt  # Informações da instalação
```

---

## 🔐 Segurança

### Recomendações Pós-Instalação

1. **Alterar senha do admin**
   - Faça login e vá em Configurações

2. **Configurar SSL/HTTPS**
   - Use Let's Encrypt (Certbot)

3. **Configurar backup automático**
   - Configure cron job para backup do banco

4. **Atualizar sistema regularmente**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

5. **Monitorar logs**
   ```bash
   pm2 logs xpanel-backend
   tail -f /var/log/nginx/access.log
   ```

6. **Configurar fail2ban** (opcional)
   ```bash
   sudo apt install fail2ban
   ```

---

## 📞 Suporte

### Documentação
- 📚 [Documentação Completa](https://github.com/seu-usuario/xpanel/wiki)
- 🐛 [Reportar Bug](https://github.com/seu-usuario/xpanel/issues)
- 💬 [Discussões](https://github.com/seu-usuario/xpanel/discussions)

### Logs Úteis

```bash
# Backend
pm2 logs xpanel-backend

# Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# PostgreSQL
tail -f /var/log/postgresql/postgresql-15-main.log

# Sistema
journalctl -u nginx -f
journalctl -u postgresql -f
```

---

## 🎯 Próximos Passos

Após a instalação bem-sucedida:

1. ✅ Fazer login no painel
2. ✅ Alterar senha do admin
3. ✅ Configurar SSL (se tiver domínio)
4. ✅ Criar usuários adicionais
5. ✅ Configurar backup automático
6. ✅ Explorar funcionalidades do XPanel

---

## 📝 Notas

### Portas Utilizadas
- **80** - HTTP (Nginx)
- **443** - HTTPS (Nginx)
- **4000** - Backend API (interno)
- **5432** - PostgreSQL (interno)

### Usuários Criados
- **PostgreSQL**: `xpanel` (senha aleatória)
- **XPanel**: `admin@xpanel.local` (senha: admin123)

### Serviços Configurados
- **PM2**: Auto-start no boot
- **Nginx**: Auto-start no boot
- **PostgreSQL**: Auto-start no boot
- **Docker**: Auto-start no boot

---

## ⚠️ Avisos Importantes

1. **Senha Padrão**: Altere a senha do admin imediatamente
2. **Firewall**: UFW é ativado automaticamente
3. **Backup**: Configure backup automático do banco de dados
4. **Atualizações**: Mantenha o sistema e XPanel atualizados
5. **SSL**: Configure HTTPS para produção

---

**🚀 Desenvolvido com ❤️ pela SX Connect 🚀**

**Versão**: 1.0.0  
**Data**: 16/05/2026  
**Licença**: Proprietária
