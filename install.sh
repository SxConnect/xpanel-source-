#!/bin/bash

################################################################################
# XPanel - Script de Instalação Automática
# Versão: 1.0.0
# Descrição: Instala o XPanel completo em um VPS Ubuntu/Debian
# Uso: curl -fsSL https://raw.githubusercontent.com/seu-usuario/xpanel/main/install.sh | bash
################################################################################

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variáveis
XPANEL_DIR="/opt/xpanel"
GITHUB_REPO="https://github.com/seu-usuario/xpanel.git"
GITHUB_BRANCH="main"
NODE_VERSION="20"
POSTGRES_VERSION="15"

################################################################################
# Funções Auxiliares
################################################################################

print_header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║                    XPanel Installer v1.0                       ║"
    echo "║                                                                ║"
    echo "║              Instalador Automático para VPS                    ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Este script precisa ser executado como root"
        echo "Use: sudo bash install.sh"
        exit 1
    fi
}

check_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
    else
        print_error "Sistema operacional não suportado"
        exit 1
    fi

    if [[ "$OS" != "ubuntu" && "$OS" != "debian" ]]; then
        print_error "Este instalador suporta apenas Ubuntu e Debian"
        exit 1
    fi

    print_step "Sistema operacional: $OS $VERSION"
}

check_requirements() {
    print_info "Verificando requisitos do sistema..."
    
    # Verificar memória RAM (mínimo 1GB)
    TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
    if [ "$TOTAL_RAM" -lt 1024 ]; then
        print_warning "RAM disponível: ${TOTAL_RAM}MB (recomendado: 2GB+)"
    else
        print_step "RAM disponível: ${TOTAL_RAM}MB"
    fi

    # Verificar espaço em disco (mínimo 5GB)
    DISK_SPACE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$DISK_SPACE" -lt 5 ]; then
        print_error "Espaço em disco insuficiente: ${DISK_SPACE}GB (mínimo: 5GB)"
        exit 1
    else
        print_step "Espaço em disco: ${DISK_SPACE}GB"
    fi
}

install_dependencies() {
    print_info "Instalando dependências do sistema..."
    
    # Atualizar repositórios
    apt-get update -qq
    
    # Instalar dependências básicas
    apt-get install -y -qq \
        curl \
        wget \
        git \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        nginx \
        certbot \
        python3-certbot-nginx
    
    print_step "Dependências básicas instaladas"
}

install_nodejs() {
    print_info "Instalando Node.js ${NODE_VERSION}..."
    
    # Verificar se Node.js já está instalado
    if command -v node &> /dev/null; then
        CURRENT_NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$CURRENT_NODE_VERSION" -ge "$NODE_VERSION" ]; then
            print_step "Node.js já instalado: $(node -v)"
            return
        fi
    fi
    
    # Instalar Node.js via NodeSource
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y -qq nodejs
    
    # Instalar npm global packages
    npm install -g pm2
    
    print_step "Node.js instalado: $(node -v)"
    print_step "npm instalado: $(npm -v)"
    print_step "PM2 instalado: $(pm2 -v)"
}

install_postgresql() {
    print_info "Instalando PostgreSQL ${POSTGRES_VERSION}..."
    
    # Verificar se PostgreSQL já está instalado
    if command -v psql &> /dev/null; then
        print_step "PostgreSQL já instalado: $(psql --version)"
        return
    fi
    
    # Adicionar repositório PostgreSQL
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
    
    apt-get update -qq
    apt-get install -y -qq postgresql-${POSTGRES_VERSION} postgresql-contrib-${POSTGRES_VERSION}
    
    # Iniciar PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    print_step "PostgreSQL instalado: $(psql --version)"
}

install_docker() {
    print_info "Instalando Docker..."
    
    # Verificar se Docker já está instalado
    if command -v docker &> /dev/null; then
        print_step "Docker já instalado: $(docker --version)"
        return
    fi
    
    # Instalar Docker
    curl -fsSL https://get.docker.com | sh
    
    # Adicionar usuário ao grupo docker
    usermod -aG docker $SUDO_USER 2>/dev/null || true
    
    # Iniciar Docker
    systemctl start docker
    systemctl enable docker
    
    print_step "Docker instalado: $(docker --version)"
}

setup_database() {
    print_info "Configurando banco de dados..."
    
    # Gerar senha aleatória para o banco
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    DB_NAME="xpanel"
    DB_USER="xpanel"
    
    # Criar banco de dados e usuário
    sudo -u postgres psql <<EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\q
EOF
    
    print_step "Banco de dados criado: ${DB_NAME}"
    print_step "Usuário criado: ${DB_USER}"
}

clone_repository() {
    print_info "Clonando repositório do XPanel..."
    
    # Remover diretório existente se houver
    if [ -d "$XPANEL_DIR" ]; then
        print_warning "Diretório $XPANEL_DIR já existe. Removendo..."
        rm -rf "$XPANEL_DIR"
    fi
    
    # Clonar repositório
    git clone -b "$GITHUB_BRANCH" "$GITHUB_REPO" "$XPANEL_DIR"
    
    print_step "Repositório clonado em: $XPANEL_DIR"
}

setup_backend() {
    print_info "Configurando backend..."
    
    cd "$XPANEL_DIR/backend"
    
    # Instalar dependências
    npm install --production
    
    # Gerar JWT secret
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    
    # Criar arquivo .env
    cat > .env <<EOF
# Database
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"

# JWT
JWT_SECRET="${JWT_SECRET}"
JWT_EXPIRES_IN="7d"

# Server
PORT=4000
NODE_ENV=production

# Docker
DOCKER_SOCKET=/var/run/docker.sock
EOF
    
    # Executar migrations do Prisma
    npx prisma generate
    npx prisma db push
    
    # Criar usuário admin padrão
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
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
        console.log('Admin user created');
        await prisma.\$disconnect();
    }
    
    createAdmin().catch(console.error);
    "
    
    # Build do backend
    npm run build
    
    print_step "Backend configurado"
}

setup_frontend() {
    print_info "Configurando frontend..."
    
    cd "$XPANEL_DIR/frontend"
    
    # Instalar dependências
    npm install
    
    # Criar arquivo .env
    cat > .env <<EOF
VITE_API_URL=http://localhost:4000/api
EOF
    
    # Build do frontend
    npm run build
    
    print_step "Frontend configurado"
}

setup_nginx() {
    print_info "Configurando Nginx..."
    
    # Obter IP do servidor
    SERVER_IP=$(curl -s ifconfig.me)
    
    # Criar configuração do Nginx
    cat > /etc/nginx/sites-available/xpanel <<EOF
server {
    listen 80;
    server_name ${SERVER_IP} _;

    # Frontend
    location / {
        root ${XPANEL_DIR}/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    # Ativar site
    ln -sf /etc/nginx/sites-available/xpanel /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Testar configuração
    nginx -t
    
    # Reiniciar Nginx
    systemctl restart nginx
    systemctl enable nginx
    
    print_step "Nginx configurado"
}

setup_pm2() {
    print_info "Configurando PM2..."
    
    cd "$XPANEL_DIR/backend"
    
    # Iniciar backend com PM2
    pm2 start dist/index.js --name xpanel-backend
    pm2 save
    pm2 startup systemd -u root --hp /root
    
    print_step "PM2 configurado"
}

setup_firewall() {
    print_info "Configurando firewall..."
    
    # Configurar UFW
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow http
    ufw allow https
    
    print_step "Firewall configurado"
}

create_info_file() {
    print_info "Criando arquivo de informações..."
    
    cat > "$XPANEL_DIR/INSTALLATION_INFO.txt" <<EOF
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                  XPanel - Informações de Instalação            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

Data de Instalação: $(date)
Diretório: $XPANEL_DIR

╔════════════════════════════════════════════════════════════════╗
║ ACESSO                                                         ║
╚════════════════════════════════════════════════════════════════╝

URL: http://${SERVER_IP}

Usuário Admin:
  Email: admin@xpanel.local
  Senha: admin123

⚠️  IMPORTANTE: Altere a senha do admin após o primeiro login!

╔════════════════════════════════════════════════════════════════╗
║ BANCO DE DADOS                                                 ║
╚════════════════════════════════════════════════════════════════╝

Database: ${DB_NAME}
User: ${DB_USER}
Password: ${DB_PASSWORD}

Connection String:
postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}

╔════════════════════════════════════════════════════════════════╗
║ SERVIÇOS                                                       ║
╚════════════════════════════════════════════════════════════════╝

Backend:
  - PM2: pm2 status
  - Logs: pm2 logs xpanel-backend
  - Restart: pm2 restart xpanel-backend

Nginx:
  - Status: systemctl status nginx
  - Restart: systemctl restart nginx
  - Config: /etc/nginx/sites-available/xpanel

PostgreSQL:
  - Status: systemctl status postgresql
  - Access: sudo -u postgres psql

Docker:
  - Status: systemctl status docker
  - Containers: docker ps

╔════════════════════════════════════════════════════════════════╗
║ COMANDOS ÚTEIS                                                 ║
╚════════════════════════════════════════════════════════════════╝

Ver logs do backend:
  pm2 logs xpanel-backend

Reiniciar backend:
  pm2 restart xpanel-backend

Atualizar XPanel:
  cd $XPANEL_DIR
  git pull
  cd backend && npm install && npm run build
  cd ../frontend && npm install && npm run build
  pm2 restart xpanel-backend

Backup do banco de dados:
  pg_dump -U ${DB_USER} ${DB_NAME} > backup.sql

Restaurar banco de dados:
  psql -U ${DB_USER} ${DB_NAME} < backup.sql

╔════════════════════════════════════════════════════════════════╗
║ SUPORTE                                                        ║
╚════════════════════════════════════════════════════════════════╝

Documentação: https://github.com/seu-usuario/xpanel
Issues: https://github.com/seu-usuario/xpanel/issues

EOF
    
    print_step "Arquivo de informações criado: $XPANEL_DIR/INSTALLATION_INFO.txt"
}

print_success() {
    echo ""
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║              ✓ XPanel Instalado com Sucesso!                  ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${BLUE}Acesse o painel em:${NC} http://${SERVER_IP}"
    echo ""
    echo -e "${YELLOW}Credenciais de acesso:${NC}"
    echo "  Email: admin@xpanel.local"
    echo "  Senha: admin123"
    echo ""
    echo -e "${RED}⚠️  IMPORTANTE: Altere a senha após o primeiro login!${NC}"
    echo ""
    echo -e "${BLUE}Informações completas em:${NC} $XPANEL_DIR/INSTALLATION_INFO.txt"
    echo ""
}

################################################################################
# Execução Principal
################################################################################

main() {
    print_header
    
    # Verificações iniciais
    check_root
    check_os
    check_requirements
    
    # Instalação
    install_dependencies
    install_nodejs
    install_postgresql
    install_docker
    
    # Configuração
    setup_database
    clone_repository
    setup_backend
    setup_frontend
    setup_nginx
    setup_pm2
    setup_firewall
    
    # Finalização
    create_info_file
    print_success
}

# Executar instalação
main
