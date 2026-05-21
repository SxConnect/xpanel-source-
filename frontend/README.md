# XPanel Frontend

Interface web moderna para o XPanel - Painel de Controle VPS.

## 🚀 Tecnologias

- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **React Router** - Roteamento
- **React Query** - Gerenciamento de estado servidor
- **Zustand** - Gerenciamento de estado cliente
- **Axios** - Cliente HTTP
- **Lucide React** - Ícones
- **React Hot Toast** - Notificações

## 📦 Instalação

```bash
npm install
```

## 🔧 Desenvolvimento

```bash
npm run dev
```

O frontend estará disponível em: http://localhost:5173

## 🏗️ Build

```bash
npm run build
```

Os arquivos compilados estarão em `dist/`.

## 📁 Estrutura

```
src/
├── components/
│   ├── common/          # Componentes reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Table.tsx
│   └── layout/          # Layout da aplicação
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Layout.tsx
├── pages/               # Páginas da aplicação
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Docker.tsx
│   ├── Hosting.tsx
│   ├── Email.tsx
│   ├── DNS.tsx
│   ├── Backup.tsx
│   └── Settings.tsx
├── lib/                 # Utilitários
│   ├── api.ts          # Cliente Axios
│   └── utils.ts        # Funções auxiliares
├── store/              # Estado global
│   └── authStore.ts    # Store de autenticação
├── types/              # Tipos TypeScript
│   └── index.ts
├── App.tsx             # Componente principal
├── main.tsx            # Entry point
└── index.css           # Estilos globais
```

## 🎨 Páginas

### Autenticação
- **Login** - `/login`
- **Registro** - `/register`

### Dashboard
- **Dashboard** - `/` - Visão geral do sistema

### Módulos
- **Docker** - `/docker` - Gerenciamento de containers
- **Hospedagem** - `/hosting` - Gerenciamento de domínios
- **Email** - `/email` - Contas de email
- **DNS** - `/dns` - Registros DNS
- **Backup** - `/backup` - Backups do sistema
- **Configurações** - `/settings` - Configurações do usuário

## 🔐 Autenticação

O frontend usa JWT para autenticação. O token é armazenado no localStorage e enviado automaticamente em todas as requisições via interceptor do Axios.

## 🌐 API

O frontend se comunica com o backend através de proxy configurado no Vite:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true,
    },
  },
}
```

## 📊 Funcionalidades

### Dashboard
- Estatísticas de recursos
- Informações do servidor
- Status do Docker

### Docker
- Listar containers
- Iniciar/Parar/Reiniciar containers
- Ver logs em tempo real
- Remover containers

### Hospedagem
- Criar domínios (Site ou Container)
- Habilitar/Desabilitar SSL
- Remover domínios

### Email
- Criar contas de email
- Configurar quotas
- Configurar forwarding
- Remover contas

### DNS
- Criar registros DNS (A, AAAA, CNAME, MX, TXT, etc.)
- Editar registros
- Remover registros

### Backup
- Criar backups manuais
- Agendar backups
- Restaurar backups
- Múltiplos destinos (Local, S3, B2, SFTP)

## 🎨 Design System

### Cores
- **Primary**: Blue (#3b82f6)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)

### Componentes
- **Button**: Variantes (primary, secondary, danger, success)
- **Card**: Container com header e body
- **Modal**: Diálogo modal
- **Table**: Tabela responsiva
- **Badge**: Etiquetas de status

## 🔄 Estado

### Zustand (Cliente)
- Autenticação do usuário
- Token JWT

### React Query (Servidor)
- Cache de dados da API
- Refetch automático
- Mutations

## 📱 Responsividade

O frontend é totalmente responsivo e funciona em:
- Desktop (1920x1080+)
- Laptop (1366x768+)
- Tablet (768x1024+)
- Mobile (375x667+)

## 🚀 Deploy

### Build de Produção

```bash
npm run build
```

### Servir com Nginx

```nginx
server {
    listen 80;
    server_name xpanel.example.com;
    root /var/www/xpanel/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📝 Variáveis de Ambiente

Não há variáveis de ambiente necessárias. A URL da API é configurada via proxy do Vite em desenvolvimento e via Nginx em produção.

## 🐛 Debug

### Logs do React Query

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Em App.tsx
<ReactQueryDevtools initialIsOpen={false} />
```

### Logs do Axios

```typescript
// Em lib/api.ts
api.interceptors.request.use((config) => {
  console.log('Request:', config);
  return config;
});
```

## 📄 Licença

Proprietária - SX Connect

## 👥 Desenvolvido por

**SX Connect**  
Versão: 0.1.0
