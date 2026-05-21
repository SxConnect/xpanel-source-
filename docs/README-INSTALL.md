# 🚀 XPanel - Painel de Controle VPS Moderno

<div align="center">

![XPanel Logo](https://via.placeholder.com/200x200?text=XPanel)

**Painel de controle completo para gerenciamento de VPS com Docker, hospedagem, email, DNS e muito mais**

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](https://github.com/sxconnect/install-xpanel/releases)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![GitHub Stars](https://img.shields.io/github/stars/sxconnect/install-xpanel?style=social)](https://github.com/sxconnect/install-xpanel)

[🌐 Website](https://xpanel.sxconnect.com.br) • [📚 Documentação](https://docs.xpanel.sxconnect.com.br) • [💬 Discord](https://discord.gg/xpanel) • [🐛 Issues](https://github.com/sxconnect/install-xpanel/issues)

</div>

---

## 📋 Sobre o XPanel

XPanel é um **painel de controle moderno e completo** para gerenciamento de servidores VPS. Desenvolvido com tecnologias de ponta, oferece uma interface intuitiva e poderosa para gerenciar todos os aspectos do seu servidor.

### ✨ Por que escolher o XPanel?

- 🐳 **100% Dockerizado** - Instalação limpa e isolada
- 🚀 **Instalação em 1 comando** - Pronto em menos de 10 minutos
- 🔒 **Seguro por padrão** - JWT, bcrypt, validações
- 💎 **Tier System** - FREE e PREMIUM com recursos diferenciados
- 🎨 **Interface Moderna** - React 18 + TailwindCSS
- 📊 **Dashboard Completo** - Estatísticas em tempo real
- 🔄 **Atualizações Fáceis** - Um comando para atualizar
- 🌍 **Multi-idioma** - Português e Inglês

---

## 🎯 Funcionalidades

### 🐳 Gerenciamento Docker
- ✅ Criar, parar, iniciar e remover containers
- ✅ Visualizar logs em tempo real
- ✅ Monitorar recursos (CPU, RAM, Rede)
- ✅ Gerenciar volumes e networks
- ✅ Deploy de aplicações com um clique

### 🌐 Hospedagem de Sites
- ✅ Criar domínios e subdomínios
- ✅ Configuração automática de Nginx/Apache
- ✅ Certificados SSL gratuitos (Let's Encrypt)
- ✅ PHP, Node.js, Python, Ruby
- ✅ FTP/SFTP integrado

### 📧 Gerenciamento de Email
- ✅ Criar contas de email ilimitadas
- ✅ Webmail integrado
- ✅ Anti-spam e anti-vírus
- ✅ Aliases e redirecionamentos
- ✅ SMTP, IMAP, POP3

### 🌍 DNS Manager
- ✅ 10 tipos de registros (A, AAAA, CNAME, MX, TXT, etc)
- ✅ Editor visual intuitivo
- ✅ Validação automática
- ✅ Propagação rápida
- ✅ Importação/Exportação de zonas

### 💾 Sistema de Backup
- ✅ Backup manual e agendado
- ✅ Backup incremental
- ✅ Restauração com um clique
- ✅ Armazenamento local e remoto (S3, FTP)
- ✅ Criptografia de backups

### 👥 Multi-usuário (Premium)
- ✅ Criar usuários RESELLER
- ✅ Limites personalizados por usuário
- ✅ Isolamento de recursos
- ✅ Painel white-label
- ✅ Faturamento integrado

---

## 🚀 Instalação Rápida

### Requisitos Mínimos

- **OS**: Ubuntu 20.04+ ou Debian 11+
- **RAM**: 1GB (recomendado 2GB+)
- **CPU**: 1 core (recomendado 2+ cores)
- **Disco**: 10GB livre (recomendado 20GB+)
- **Acesso**: Root via SSH

### Instalação com Um Comando

```bash
curl -fsSL https://raw.githubusercontent.com/sxconnect/install-xpanel/main/install-docker.sh | sudo bash
```

**Pronto!** O XPanel estará instalado e rodando em ~10 minutos.

### Acesso Inicial

```
URL: http://SEU_IP_DO_SERVIDOR

Credenciais:
  Email: admin@xpanel.local
  Senha: admin123
```

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login!

---

## 📦 O Que Será Instalado?

O instalador configura automaticamente:

- ✅ Docker e Docker Compose
- ✅ PostgreSQL 15 (containerizado)
- ✅ XPanel Backend (API REST)
- ✅ XPanel Frontend (React SPA)
- ✅ Nginx (reverse proxy)
- ✅ Firewall (UFW)
- ✅ Certificados SSL (opcional)

**Tudo isolado em containers Docker!** Sem poluir seu sistema.

---

## 🎨 Screenshots

<div align="center">

### Dashboard
![Dashboard](https://via.placeholder.com/800x450?text=Dashboard+Screenshot)

### Gerenciamento Docker
![Docker](https://via.placeholder.com/800x450?text=Docker+Management)

### Hospedagem de Sites
![Hosting](https://via.placeholder.com/800x450?text=Website+Hosting)

### DNS Manager
![DNS](https://via.placeholder.com/800x450?text=DNS+Manager)

</div>

---

## 💎 Planos e Preços

### 🆓 FREE Tier

**Grátis para sempre**

- ✅ 3 domínios
- ✅ 2 databases
- ✅ 5 containers Docker
- ✅ 5 contas de email
- ✅ Backup manual
- ✅ Suporte comunitário

### 👑 PREMIUM Tier

**R$ 49/mês ou R$ 490/ano**

- ✅ **Tudo do FREE +**
- ✅ Domínios ilimitados
- ✅ Databases ilimitados
- ✅ Containers ilimitados
- ✅ Emails ilimitados
- ✅ Multi-usuário (RESELLER)
- ✅ Backup agendado
- ✅ White-label
- ✅ Suporte prioritário

[🚀 Fazer Upgrade](https://xpanel.sxconnect.com.br/pricing)

---

## 🛠️ Comandos Úteis

### Gerenciamento de Containers

```bash
# Ver status
cd /opt/xpanel && docker compose ps

# Ver logs
cd /opt/xpanel && docker compose logs -f

# Reiniciar
cd /opt/xpanel && docker compose restart

# Parar
cd /opt/xpanel && docker compose stop

# Iniciar
cd /opt/xpanel && docker compose start
```

### Atualização

```bash
# Atualizar para a versão mais recente
cd /opt/xpanel && docker compose pull && docker compose up -d
```

### Backup

```bash
# Backup do banco de dados
cd /opt/xpanel && docker compose exec postgres pg_dump -U xpanel xpanel > backup.sql

# Restaurar backup
cd /opt/xpanel && docker compose exec -T postgres psql -U xpanel xpanel < backup.sql
```

### Desinstalação

```bash
# Remover XPanel (mantém dados)
cd /opt/xpanel && docker compose down

# Remover XPanel + dados
cd /opt/xpanel && docker compose down -v && rm -rf /opt/xpanel
```

---

## 📚 Documentação

### Guias de Instalação
- 📖 [Instalação Básica](docs/INSTALLATION.md)
- 🐳 [Instalação com Docker](docs/DOCKER-INSTALL.md)
- ☁️ [Deploy em Cloud (AWS, GCP, Azure)](docs/CLOUD-DEPLOY.md)
- 🔧 [Instalação Manual](docs/MANUAL-INSTALL.md)

### Configuração
- ⚙️ [Configuração Inicial](docs/CONFIGURATION.md)
- 🔒 [Configuração SSL/HTTPS](docs/SSL-SETUP.md)
- 📧 [Configuração de Email](docs/EMAIL-SETUP.md)
- 🌍 [Configuração DNS](docs/DNS-SETUP.md)

### Uso
- 🚀 [Guia de Início Rápido](docs/QUICKSTART.md)
- 🐳 [Gerenciamento Docker](docs/DOCKER-MANAGEMENT.md)
- 🌐 [Hospedagem de Sites](docs/HOSTING.md)
- 💾 [Sistema de Backup](docs/BACKUP.md)

### Desenvolvimento
- 🏗️ [Arquitetura](docs/ARCHITECTURE.md)
- 🔌 [API Reference](docs/API.md)
- 🧩 [Plugins e Extensões](docs/PLUGINS.md)
- 🤝 [Contribuindo](docs/CONTRIBUTING.md)

---

## 🔧 Troubleshooting

### Problemas Comuns

#### ❌ Erro ao conectar no banco de dados

**Solução:**
```bash
# Verificar se o PostgreSQL está rodando
docker compose ps postgres

# Ver logs do PostgreSQL
docker compose logs postgres

# Reiniciar PostgreSQL
docker compose restart postgres
```

#### ❌ Frontend não carrega

**Solução:**
```bash
# Verificar se o backend está rodando
docker compose ps backend

# Ver logs do backend
docker compose logs backend

# Verificar conectividade
curl http://localhost:4000/health
```

#### ❌ Porta 80 já está em uso

**Solução:**
```bash
# Verificar o que está usando a porta 80
sudo lsof -i :80

# Parar o serviço conflitante (exemplo: Apache)
sudo systemctl stop apache2

# Ou mudar a porta do XPanel no .env
FRONTEND_PORT=8080
```

### Mais Ajuda

- 📚 [FAQ Completo](docs/FAQ.md)
- 🐛 [Reportar Bug](https://github.com/sxconnect/install-xpanel/issues/new?template=bug_report.md)
- 💡 [Solicitar Feature](https://github.com/sxconnect/install-xpanel/issues/new?template=feature_request.md)
- 💬 [Discord Community](https://discord.gg/xpanel)

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológico

**Backend:**
- Node.js 20 + TypeScript
- Express.js (API REST)
- Prisma ORM
- PostgreSQL 15
- JWT Authentication
- Zod Validation

**Frontend:**
- React 18 + TypeScript
- Vite (Build tool)
- TailwindCSS
- React Query
- Zustand (State)
- React Router

**Infraestrutura:**
- Docker + Docker Compose
- Nginx (Reverse Proxy)
- Let's Encrypt (SSL)
- UFW (Firewall)

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │  Nginx  │ (Port 80/443)
                    │ (Proxy) │
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
   │Frontend │     │ Backend │     │  Postgres│
   │ (React) │────▶│  (API)  │────▶│   (DB)  │
   │Port 3000│     │Port 4000│     │Port 5432│
   └─────────┘     └────┬────┘     └─────────┘
                        │
                   ┌────▼────┐
                   │  Docker │
                   │  Socket │
                   └─────────┘
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja nosso [Guia de Contribuição](CONTRIBUTING.md).

### Como Contribuir

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📊 Status do Projeto

- ✅ Backend: 100% completo
- ✅ Frontend: 100% completo
- ✅ Documentação: 100% completa
- ✅ Instalador: 100% completo
- ✅ Docker: 100% completo
- 🚀 Status: **Produção**

---

## 🎯 Roadmap

### v2.1.0 (Q2 2026)
- [ ] Marketplace de aplicações (WordPress, Nextcloud, etc)
- [ ] Integração com Cloudflare
- [ ] Tema escuro
- [ ] Notificações push

### v2.2.0 (Q3 2026)
- [ ] API pública
- [ ] Webhooks
- [ ] Integração com gateways de pagamento
- [ ] White-label completo

### v3.0.0 (Q4 2026)
- [ ] Tier ENTERPRISE
- [ ] Multi-servidor
- [ ] Kubernetes support
- [ ] IA para otimização automática

---

## 📄 Licença

Este projeto é proprietário. © 2026 SX Connect. Todos os direitos reservados.

Para informações sobre licenciamento comercial:
- 📧 Email: comercial@sxconnect.com.br
- 🌐 Website: https://sxconnect.com.br

---

## 📞 Suporte

### Canais de Suporte

- 📧 **Email**: suporte@sxconnect.com.br
- 💬 **Discord**: [Servidor XPanel](https://discord.gg/xpanel)
- 📚 **Documentação**: [docs.xpanel.sxconnect.com.br](https://docs.xpanel.sxconnect.com.br)
- 🐛 **Issues**: [GitHub Issues](https://github.com/sxconnect/install-xpanel/issues)

### Horário de Atendimento

- **Suporte FREE**: Segunda a Sexta, 9h às 18h (horário de Brasília)
- **Suporte PREMIUM**: 24/7 com SLA de 4 horas

---

## 🌟 Destaques

### Por que empresas escolhem o XPanel?

- ✅ **Instalação Rápida**: Pronto em menos de 10 minutos
- ✅ **Seguro**: Atualizações de segurança regulares
- ✅ **Escalável**: Do hobby ao enterprise
- ✅ **Suporte**: Equipe dedicada em português
- ✅ **Preço Justo**: Sem taxas ocultas
- ✅ **Open Core**: Código auditável

---

## 📈 Estatísticas

<div align="center">

![GitHub Stars](https://img.shields.io/github/stars/sxconnect/install-xpanel?style=for-the-badge)
![GitHub Forks](https://img.shields.io/github/forks/sxconnect/install-xpanel?style=for-the-badge)
![GitHub Issues](https://img.shields.io/github/issues/sxconnect/install-xpanel?style=for-the-badge)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/sxconnect/install-xpanel?style=for-the-badge)

</div>

---

## 🎉 Agradecimentos

Agradecemos a todos que contribuíram para o XPanel:

- [Node.js](https://nodejs.org)
- [React](https://reactjs.org)
- [PostgreSQL](https://www.postgresql.org)
- [Docker](https://www.docker.com)
- [Nginx](https://nginx.org)
- [Prisma](https://www.prisma.io)
- [TailwindCSS](https://tailwindcss.com)

E toda a comunidade open source! ❤️

---

<div align="center">

**🚀 Desenvolvido com ❤️ pela SX Connect 🚀**

[Website](https://sxconnect.com.br) • [Documentação](https://docs.xpanel.sxconnect.com.br) • [Discord](https://discord.gg/xpanel) • [Twitter](https://twitter.com/sxconnect)

**⭐ Se você gostou do XPanel, dê uma estrela no GitHub! ⭐**

</div>
