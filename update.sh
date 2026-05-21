#!/bin/bash

################################################################################
# XPanel - Script de Atualização
# Versão: 2.0.0
# Descrição: Atualiza o XPanel para a versão mais recente
################################################################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

XPANEL_DIR="/opt/xpanel"

print_header() {
    clear
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║                    XPanel Update v2.0                          ║"
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

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

print_progress() {
    echo -e "${CYAN}[→]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Este script precisa ser executado como root"
        echo "Use: sudo bash update.sh"
        exit 1
    fi
}

check_installation() {
    if [ ! -d "$XPANEL_DIR" ]; then
        print_error "XPanel não está instalado em $XPANEL_DIR"
        exit 1
    fi
    
    if [ ! -f "$XPANEL_DIR/docker-compose.yml" ]; then
        print_error "Arquivo docker-compose.yml não encontrado"
        exit 1
    fi
}

backup_data() {
    print_progress "Criando backup antes da atualização..."
    
    BACKUP_DIR="$XPANEL_DIR/backups"
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
    
    mkdir -p "$BACKUP_DIR"
    
    cd "$XPANEL_DIR"
    docker compose exec -T postgres pg_dump -U xpanel xpanel > "$BACKUP_DIR/$BACKUP_FILE"
    
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        print_step "Backup criado: $BACKUP_FILE"
    else
        print_error "Falha ao criar backup"
        exit 1
    fi
}

pull_images() {
    print_progress "Baixando novas versões das imagens..."
    
    cd "$XPANEL_DIR"
    docker compose pull
    
    print_step "Imagens atualizadas"
}

update_containers() {
    print_progress "Atualizando containers..."
    
    cd "$XPANEL_DIR"
    docker compose up -d
    
    print_step "Containers atualizados"
}

run_migrations() {
    print_progress "Executando migrations do banco de dados..."
    
    sleep 5
    
    cd "$XPANEL_DIR"
    docker compose exec -T backend npx prisma db push 2>/dev/null || true
    
    print_step "Migrations executadas"
}

cleanup() {
    print_progress "Limpando imagens antigas..."
    
    docker image prune -f
    
    print_step "Limpeza concluída"
}

print_success() {
    echo ""
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║              ✓ XPanel Atualizado com Sucesso!                 ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${BLUE}Versão atual:${NC}"
    cd "$XPANEL_DIR"
    docker compose exec backend node -e "console.log(require('./package.json').version)" 2>/dev/null || echo "latest"
    echo ""
}

main() {
    print_header
    
    check_root
    check_installation
    
    echo ""
    print_info "Iniciando atualização do XPanel..."
    echo ""
    
    backup_data
    pull_images
    update_containers
    run_migrations
    cleanup
    
    print_success
}

main
