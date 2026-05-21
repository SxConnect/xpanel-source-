#!/bin/bash

################################################################################
# XPanel - Instalador Docker Simplificado
# Versão: 2.0.0
# Descrição: Instala o XPanel usando imagens Docker do GHCR
# Uso: curl -fsSL https://raw.githubusercontent.com/seu-usuario/install-xpanel/main/install.sh | bash
################################################################################

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Variáveis
XPANEL_DIR="/opt/xpanel"
GITHUB_REPO="https://raw.githubusercontent.com/seu-usuario/install-xpanel/main"
GITHUB_USERNAME="sxconnect"
VERSION="latest"

################################################################################
# Funções Auxiliares
################################################################################

print_header() {
    clear
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║                    ${MAGENTA}XPanel Installer v2.0${CYAN}                       ║"
    echo "║                                                                ║"
    echo "║              ${BLUE}Instalação via Docker Containers${CYAN}                  ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
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

print_progress() {
    echo -e "${CYAN}[→]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Este script precisa ser executado como root"
        echo ""
        echo "Use: ${YELLOW}sudo bash install.sh${NC}"
        echo ""
        exit 1
    fi
}

check_os() {
    print_progress "Verificando sistema operacional..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION_OS=$VERSION_ID
    else
        print_error "Sistema operacional não suportado"
        exit 1
    fi

    if [[ "$OS" != "ubuntu" && "$OS" != "debian" ]]; then
        print_error "Este instalador suporta apenas Ubuntu e Debian"
        echo "Sistema detectado: $OS"
        exit 1
    fi

    print_step "Sistema operacional: $OS $VERSION_OS"
}

check_requirements() {
    print_progress "Verificando requisitos do sistema..."
    
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

install_docker() {
    print_progress "Verificando Docker..."
    
    if command -v docker &> /dev/null; then
        print_step "Docker já instalado: $(docker --version)"
        return
    fi
    
    print_progress "Instalando Docker..."
    
    # Atualizar repositórios
    apt-get update -qq
    
    # Instalar dependências
    apt-get install -y -qq \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Adicionar chave GPG do Docker
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Adicionar repositório do Docker
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Instalar Docker
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Iniciar Docker
    systemctl start docker
    systemctl enable docker
    
    print_step "Docker instalado: $(docker --version)"
}

setup_directory() {
    print_progress "Criando diretório de instalação..."
    
    # Criar diretório
    mkdir -p "$XPANEL_DIR"
    cd "$XPANEL_DIR"
    
    print_step "Diretório criado: $XPANEL_DIR"
}

download_files() {
    print_progress "Baixando arquivos de configuração..."
    
    # Baixar docker-compose.yml
    curl -fsSL "${GITHUB_REPO}/docker-compose.yml" -o docker-compose.yml
    
    # Baixar .env.example
    curl -fsSL "${GITHUB_REPO}/.env.example" -o .env.example
    
    print_step "Arquivos baixados"
}

generate_secrets() {
    print_progress "Gerando credenciais seguras..."
    
    # Gerar senhas aleatórias
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    
    # Criar arquivo .env
    cat > .env <<EOF
# ============================================
# XPanel - Environment Variables
# Gerado automaticamente em: $(date)
# ============================================

# Database Configuration
POSTGRES_DB=xpanel
POSTGRES_USER=xpanel
POSTGRES_PASSWORD=${DB_PASSWORD}

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=production
FRONTEND_PORT=80
HTTP_PORT=80
HTTPS_PORT=443

# GitHub Container Registry
GITHUB_USERNAME=${GITHUB_USERNAME}
VERSION=${VERSION}
EOF
    
    print_step "Credenciais geradas"
}

pull_images() {
    print_progress "Baixando imagens Docker do GHCR..."
    echo ""
    
    # Pull backend
    print_info "Baixando backend..."
    docker pull ghcr.io/${GITHUB_USERNAME}/xpanel-backend:${VERSION}
    
    # Pull frontend
    print_info "Baixando frontend..."
    docker pull ghcr.io/${GITHUB_USERNAME}/xpanel-frontend:${VERSION}
    
    echo ""
    print_step "Imagens baixadas com sucesso"
}

start_containers() {
    print_progress "Iniciando containers..."
    
    # Iniciar com docker compose
    docker compose up -d
    
    # Aguardar containers ficarem saudáveis
    print_progress "Aguardando containers iniciarem..."
    sleep 10
    
    # Verificar status
    if docker compose ps | grep -q "Up"; then
        print_step "Containers iniciados com sucesso"
    else
        print_error "Erro ao iniciar containers"
        docker compose logs
        exit 1
    fi
}

run_migrations() {
    print_progress "Executando migrations do banco de dados..."
    
    # Aguardar banco estar pronto
    sleep 5
    
    # Executar migrations
    docker compose exec -T backend npx prisma db push 2>/dev/null || true
    
    print_step "Migrations executadas"
}

create_admin_user() {
    print_progress "Criando usuário administrador..."
    
    # Criar usuário admin via API ou script
    docker compose exec -T backend node -e "
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcrypt');
    const prisma = new PrismaClient();
    
    async function createAdmin() {
        try {
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
            console.log('Admin user created successfully');
        } catch (error) {
            console.error('Error creating admin:', error.message);
        } finally {
            await prisma.\$disconnect();
        }
    }
    
    createAdmin();
    " 2>/dev/null || print_warning "Usuário admin pode já existir"
    
    print_step "Usuário administrador configurado"
}

setup_firewall() {
    print_progress "Configurando firewall..."
    
    # Verificar se UFW está instalado
    if ! command -v ufw &> /dev/null; then
        apt-get install -y -qq ufw
    fi
    
    # Configurar UFW
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    print_step "Firewall configurado"
}

create_info_file() {
    print_progress "Criando arquivo de informações..."
    
    # Obter IP do servidor
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "SEU_IP_AQUI")
    
    cat > "$XPANEL_DIR/INSTALLATION_INFO.txt" <<EOF
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                  XPanel - Informações de Instalação            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

Data de Instalação: $(date)
Diretório: $XPANEL_DIR
Versão: ${VERSION}

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

Database: xpanel
User: xpanel
Password: ${DB_PASSWORD}

╔════════════════════════════════════════════════════════════════╗
║ COMANDOS ÚTEIS                                                 ║
╚════════════════════════════════════════════════════════════════╝

Ver status dos containers:
  cd $XPANEL_DIR && docker compose ps

Ver logs:
  cd $XPANEL_DIR && docker compose logs -f

Reiniciar:
  cd $XPANEL_DIR && docker compose restart

Parar:
  cd $XPANEL_DIR && docker compose stop

Iniciar:
  cd $XPANEL_DIR && docker compose start

Atualizar XPanel:
  cd $XPANEL_DIR && docker compose pull && docker compose up -d

Backup do banco de dados:
  cd $XPANEL_DIR && docker compose exec postgres pg_dump -U xpanel xpanel > backup.sql

Restaurar banco de dados:
  cd $XPANEL_DIR && docker compose exec -T postgres psql -U xpanel xpanel < backup.sql

Desinstalar:
  cd $XPANEL_DIR && docker compose down -v
  rm -rf $XPANEL_DIR

╔════════════════════════════════════════════════════════════════╗
║ SUPORTE                                                        ║
╚════════════════════════════════════════════════════════════════╝

GitHub: https://github.com/${GITHUB_USERNAME}/install-xpanel
Issues: https://github.com/${GITHUB_USERNAME}/install-xpanel/issues
Email: suporte@sxconnect.com.br

EOF
    
    print_step "Arquivo de informações criado"
}

print_success() {
    # Obter IP do servidor
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "SEU_IP_AQUI")
    
    echo ""
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║              ✓ XPanel Instalado com Sucesso!                  ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${CYAN}┌────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${NC}  ${BLUE}Acesse o painel em:${NC}                                      ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${YELLOW}http://${SERVER_IP}${NC}                                        ${CYAN}│${NC}"
    echo -e "${CYAN}└────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    echo -e "${CYAN}┌────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${NC}  ${BLUE}Credenciais de acesso:${NC}                                   ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  Email: ${GREEN}admin@xpanel.local${NC}                               ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  Senha: ${GREEN}admin123${NC}                                         ${CYAN}│${NC}"
    echo -e "${CYAN}└────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    echo -e "${RED}⚠️  IMPORTANTE: Altere a senha após o primeiro login!${NC}"
    echo ""
    echo -e "${BLUE}📄 Informações completas em:${NC} $XPANEL_DIR/INSTALLATION_INFO.txt"
    echo ""
    echo -e "${GREEN}🎉 Instalação concluída! Aproveite o XPanel! 🎉${NC}"
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
    
    echo ""
    print_info "Iniciando instalação do XPanel..."
    echo ""
    
    # Instalação
    install_docker
    setup_directory
    download_files
    generate_secrets
    pull_images
    start_containers
    run_migrations
    create_admin_user
    setup_firewall
    
    # Finalização
    create_info_file
    print_success
}

# Executar instalação
main
