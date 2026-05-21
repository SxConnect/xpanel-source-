#!/bin/bash

################################################################################
# XPanel - Script de Desinstalação
# Versão: 2.0.0
# Descrição: Remove o XPanel do sistema
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
    echo -e "${RED}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║                  XPanel Uninstaller v2.0                       ║"
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

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Este script precisa ser executado como root"
        echo "Use: sudo bash uninstall.sh"
        exit 1
    fi
}

confirm_uninstall() {
    echo -e "${RED}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                         ⚠️  ATENÇÃO  ⚠️                         ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    print_warning "Esta ação irá remover o XPanel do seu sistema!"
    echo ""
    echo "O que será removido:"
    echo "  - Containers Docker"
    echo "  - Imagens Docker"
    echo "  - Volumes (banco de dados e logs)"
    echo "  - Diretório $XPANEL_DIR"
    echo ""
    
    read -p "Deseja criar um backup antes? (s/N): " backup_choice
    
    if [[ "$backup_choice" =~ ^[Ss]$ ]]; then
        BACKUP=true
    else
        BACKUP=false
    fi
    
    echo ""
    read -p "Tem certeza que deseja desinstalar o XPanel? (s/N): " confirm
    
    if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
        echo ""
        print_info "Desinstalação cancelada"
        exit 0
    fi
}

backup_data() {
    if [ "$BACKUP" = true ]; then
        print_info "Criando backup final..."
        
        BACKUP_DIR="$HOME/xpanel-backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        cd "$XPANEL_DIR"
        
        # Backup do banco
        docker compose exec -T postgres pg_dump -U xpanel xpanel > "$BACKUP_DIR/database.sql" 2>/dev/null || true
        
        # Backup do .env
        cp .env "$BACKUP_DIR/.env" 2>/dev/null || true
        
        # Backup de logs
        docker compose logs > "$BACKUP_DIR/logs.txt" 2>/dev/null || true
        
        print_step "Backup salvo em: $BACKUP_DIR"
        echo ""
    fi
}

stop_containers() {
    print_info "Parando containers..."
    
    if [ -d "$XPANEL_DIR" ]; then
        cd "$XPANEL_DIR"
        docker compose down 2>/dev/null || true
        print_step "Containers parados"
    fi
}

remove_volumes() {
    print_info "Removendo volumes..."
    
    if [ -d "$XPANEL_DIR" ]; then
        cd "$XPANEL_DIR"
        docker compose down -v 2>/dev/null || true
        print_step "Volumes removidos"
    fi
}

remove_images() {
    print_info "Removendo imagens Docker..."
    
    docker rmi ghcr.io/sxconnect/xpanel-backend:latest 2>/dev/null || true
    docker rmi ghcr.io/sxconnect/xpanel-frontend:latest 2>/dev/null || true
    docker rmi postgres:15-alpine 2>/dev/null || true
    docker rmi nginx:alpine 2>/dev/null || true
    
    print_step "Imagens removidas"
}

remove_directory() {
    print_info "Removendo diretório de instalação..."
    
    if [ -d "$XPANEL_DIR" ]; then
        rm -rf "$XPANEL_DIR"
        print_step "Diretório removido: $XPANEL_DIR"
    fi
}

cleanup_docker() {
    print_info "Limpando recursos Docker não utilizados..."
    
    docker system prune -f 2>/dev/null || true
    
    print_step "Limpeza concluída"
}

print_success() {
    echo ""
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║            ✓ XPanel Desinstalado com Sucesso!                 ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    
    if [ "$BACKUP" = true ]; then
        echo -e "${BLUE}Backup salvo em:${NC} $BACKUP_DIR"
        echo ""
    fi
    
    echo -e "${CYAN}Obrigado por usar o XPanel!${NC}"
    echo ""
    echo "Para reinstalar, execute:"
    echo "  curl -fsSL https://raw.githubusercontent.com/sxconnect/install-xpanel/main/install-docker.sh | sudo bash"
    echo ""
}

main() {
    print_header
    
    check_root
    confirm_uninstall
    
    echo ""
    print_info "Iniciando desinstalação..."
    echo ""
    
    backup_data
    stop_containers
    remove_volumes
    remove_images
    remove_directory
    cleanup_docker
    
    print_success
}

main
