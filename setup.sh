#!/bin/bash

# TatuTicket - Script de Setup Automatizado
# Este script configura o ambiente de desenvolvimento local

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de utilidade
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Verificar pré-requisitos
check_prerequisites() {
    print_header "Verificando Pré-requisitos"
    
    # Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js instalado: $NODE_VERSION"
    else
        print_error "Node.js não encontrado. Por favor, instale Node.js 18+ primeiro."
        exit 1
    fi
    
    # npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        print_success "npm instalado: $NPM_VERSION"
    else
        print_error "npm não encontrado."
        exit 1
    fi
    
    # PostgreSQL
    if command -v psql &> /dev/null; then
        POSTGRES_VERSION=$(psql --version)
        print_success "PostgreSQL instalado: $POSTGRES_VERSION"
    else
        print_warning "PostgreSQL não encontrado. Você precisará instalá-lo manualmente."
    fi
    
    # MongoDB
    if command -v mongosh &> /dev/null || command -v mongo &> /dev/null; then
        print_success "MongoDB instalado"
    else
        print_warning "MongoDB não encontrado. Você precisará instalá-lo manualmente."
    fi
    
    # Redis
    if command -v redis-cli &> /dev/null; then
        print_success "Redis instalado"
    else
        print_warning "Redis não encontrado. Você precisará instalá-lo manualmente."
    fi
    
    echo ""
}

# Setup Backend
setup_backend() {
    print_header "Configurando Backend"
    
    cd backend
    
    # Instalar dependências
    print_info "Instalando dependências do backend..."
    npm install
    print_success "Dependências instaladas"
    
    # Configurar .env
    if [ ! -f .env ]; then
        print_info "Criando arquivo .env..."
        cp .env.example .env
        print_success "Arquivo .env criado"
        print_warning "Por favor, edite backend/.env com suas configurações"
    else
        print_info "Arquivo .env já existe"
    fi
    
    cd ..
    echo ""
}

# Setup Portal Organização
setup_portal_org() {
    print_header "Configurando Portal Organização"
    
    cd portalOrganizaçãoTenant
    
    # Instalar dependências
    print_info "Instalando dependências do portal organização..."
    npm install
    print_success "Dependências instaladas"
    
    # Configurar .env
    if [ ! -f .env ]; then
        print_info "Criando arquivo .env..."
        cp .env.example .env
        print_success "Arquivo .env criado"
    else
        print_info "Arquivo .env já existe"
    fi
    
    cd ..
    echo ""
}

# Setup Portal Cliente
setup_portal_client() {
    print_header "Configurando Portal Cliente"
    
    cd portalClientEmpresa
    
    # Instalar dependências
    print_info "Instalando dependências do portal cliente..."
    npm install
    print_success "Dependências instaladas"
    
    # Configurar .env
    if [ ! -f .env ]; then
        print_info "Criando arquivo .env..."
        cp .env.example .env
        print_success "Arquivo .env criado"
    else
        print_info "Arquivo .env já existe"
    fi
    
    cd ..
    echo ""
}

# Setup Database
setup_database() {
    print_header "Configurando Banco de Dados"
    
    read -p "Deseja executar as migrations agora? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd backend
        print_info "Executando migrations..."
        npm run migrate || print_warning "Erro ao executar migrations. Execute manualmente: cd backend && npm run migrate"
        print_success "Migrations executadas"
        cd ..
    fi
    
    read -p "Deseja executar os seeds (dados de exemplo)? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd backend
        print_info "Executando seeds..."
        npm run seed || print_warning "Erro ao executar seeds. Execute manualmente: cd backend && npm run seed"
        print_success "Seeds executados"
        cd ..
    fi
    
    echo ""
}

# Resumo final
print_summary() {
    print_header "Setup Concluído!"
    
    echo -e "${GREEN}✓ Backend configurado${NC}"
    echo -e "${GREEN}✓ Portal Organização configurado${NC}"
    echo -e "${GREEN}✓ Portal Cliente configurado${NC}"
    echo ""
    
    print_info "Próximos passos:"
    echo ""
    echo "1. Configure as variáveis de ambiente:"
    echo "   - backend/.env"
    echo "   - portalOrganizaçãoTenant/.env"
    echo "   - portalClientEmpresa/.env"
    echo ""
    echo "2. Inicie os serviços:"
    echo "   Terminal 1: cd backend && npm run dev"
    echo "   Terminal 2: cd portalOrganizaçãoTenant && npm run dev"
    echo "   Terminal 3: cd portalClientEmpresa && npm run dev"
    echo ""
    echo "3. Acesse:"
    echo "   - Backend API: http://localhost:3000"
    echo "   - Portal Organização: http://localhost:5173"
    echo "   - Portal Cliente: http://localhost:5174"
    echo ""
    echo "4. Credenciais de teste (após executar seeds):"
    echo "   - Admin: admin@empresademo.com / Admin@123"
    echo "   - Agente: agente@empresademo.com / Agente@123"
    echo "   - Cliente: cliente@empresademo.com / Cliente@123"
    echo ""
    
    print_info "Documentação completa: README.md"
    print_info "Guia de deployment: DEPLOYMENT.md"
    echo ""
}

# Main
main() {
    clear
    print_header "TatuTicket - Setup Automatizado"
    echo ""
    
    check_prerequisites
    setup_backend
    setup_portal_org
    setup_portal_client
    setup_database
    print_summary
}

# Executar
main
