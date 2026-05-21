# 🚀 XPanel - Source Code

> **Repositório privado contendo o código fonte completo do XPanel**

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](https://github.com/SxConnect/xpanel-source/releases)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

---

## 📋 Sobre

Este é o repositório **privado** do XPanel contendo todo o código fonte.

**Para instalação do XPanel, use o repositório público:**
👉 https://github.com/SxConnect/install-xpanel

---

## 🏗️ Estrutura do Projeto

```
xpanel-source/
├── backend/              # API REST (Node.js + TypeScript)
│   ├── src/             # Código fonte
│   ├── prisma/          # Schema do banco
│   ├── Dockerfile       # Build do backend
│   └── package.json
│
├── frontend/            # Interface web (React + TypeScript)
│   ├── src/             # Código fonte
│   ├── public/          # Assets públicos
│   ├── Dockerfile       # Build do frontend
│   └── package.json
│
├── .github/
│   └── workflows/       # GitHub Actions (CI/CD)
│
├── docker-compose.yml   # Orquestração
├── .env.example         # Exemplo de configuração
└── README.md           # Este arquivo
```

---

## 🐳 Build das Imagens Docker

### Build Local

```bash
# Backend
cd backend
docker build -t xpanel-backend:local .

# Frontend
cd frontend
docker build -t xpanel-frontend:local .
```

### Build Automático (GitHub Actions)

Quando você faz push para `main`, o GitHub Actions automaticamente:
1. Builda as imagens do backend e frontend
2. Publica no GitHub Container Registry (GHCR)
3. Cria release se for uma tag

**Imagens publicadas:**
- `ghcr.io/sxconnect/xpanel-backend:latest`
- `ghcr.io/sxconnect/xpanel-frontend:latest`

---

## 🚀 Desenvolvimento Local

### Pré-requisitos

- Node.js 20+
- PostgreSQL 15+
- Docker (opcional)

### Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar .env
cp .env.example .env
# Editar .env com suas configurações

# Executar migrations
npx prisma generate
npx prisma db push

# Iniciar em desenvolvimento
npm run dev
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar .env
cp .env.example .env
# Editar .env com suas configurações

# Iniciar em desenvolvimento
npm run dev
```

---

## 🔄 Workflow de Desenvolvimento

### 1. Fazer Mudanças

```bash
# Criar branch
git checkout -b feature/nova-funcionalidade

# Fazer alterações no código
# ...

# Commit
git add .
git commit -m "feat: adiciona nova funcionalidade"
```

### 2. Testar Localmente

```bash
# Testar build do Docker
docker build -t xpanel-backend:test ./backend
docker build -t xpanel-frontend:test ./frontend

# Testar com docker-compose
docker compose up -d
```

### 3. Push para GitHub

```bash
# Push da branch
git push origin feature/nova-funcionalidade

# Criar Pull Request no GitHub
# Após aprovação, merge para main
```

### 4. Build Automático

Após merge para `main`, GitHub Actions:
- Builda as imagens
- Publica no GHCR
- Atualiza a tag `latest`

---

## 📦 Criar Release

### Via Git Tag

```bash
# Criar tag
git tag -a v2.0.0 -m "Release v2.0.0"
git push origin v2.0.0
```

GitHub Actions irá:
- Buildar as imagens
- Publicar com tag `v2.0.0` e `latest`
- Criar release no GitHub

---

## 🔧 Scripts Disponíveis

### Backend

```bash
npm run dev      # Desenvolvimento
npm run build    # Build para produção
npm start        # Iniciar produção
npm run db:push  # Aplicar migrations
```

### Frontend

```bash
npm run dev      # Desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
```

---

## 🐛 Debug

### Ver Logs do GitHub Actions

```bash
# Instalar GitHub CLI
gh run list
gh run view
gh run watch
```

### Testar Build Localmente

```bash
# Backend
cd backend
docker build -t test .

# Frontend
cd frontend
docker build -t test .
```

---

## 📊 Tecnologias

### Backend
- Node.js 20
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- JWT
- Zod

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Query
- Zustand
- React Router

### DevOps
- Docker
- Docker Compose
- GitHub Actions
- GHCR

---

## 🔐 Segurança

### Variáveis de Ambiente

Nunca commite arquivos `.env` com credenciais reais!

Use `.env.example` como template.

### Secrets do GitHub

Configure no GitHub:
- Settings → Secrets and variables → Actions
- Adicione secrets necessários (se houver)

---

## 📝 Convenções de Commit

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
style: formatação de código
refactor: refatoração
test: adiciona testes
chore: tarefas de manutenção
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Proprietário - © 2026 SX Connect. Todos os direitos reservados.

---

## 📞 Contato

**SX Connect**
- 🌐 Website: https://sxconnect.com.br
- 📧 Email: contato@sxconnect.com.br

---

## 🔗 Links Úteis

- 📦 [Repositório de Instalação](https://github.com/SxConnect/install-xpanel)
- 🐳 [Imagens Docker (GHCR)](https://github.com/SxConnect?tab=packages)
- 📚 [Documentação](https://docs.xpanel.sxconnect.com.br)

---

**🚀 Desenvolvido com ❤️ pela SX Connect**
