#!/bin/bash

# Sigma DOCs - Script de Inicialização Rápida
# Execute este script após baixar o projeto

set -e

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║           Sigma DOCs - Instalação Rápida               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado!${NC}"
    echo "Instale Node.js 18+ de: https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✅ Node.js: $(node -v)${NC}"

# Verificar se bun ou npm
if command -v bun &> /dev/null; then
    PKG_MANAGER="bun"
    echo -e "${GREEN}✅ Bun encontrado${NC}"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    echo -e "${GREEN}✅ npm encontrado${NC}"
else
    echo -e "${RED}❌ Nenhum gerenciador de pacotes encontrado!${NC}"
    exit 1
fi

# Criar .env.local se não existir
if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    echo -e "${BLUE}📝 Criando arquivo de configuração...${NC}"
    
    NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-this-secret-key")
    
    cat > .env.local << EOF
# Sigma DOCs - Configuração Local

DATABASE_URL=file:./data/sigmadocs.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Email (opcional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EOF
    
    echo -e "${GREEN}✅ Arquivo .env.local criado${NC}"
fi

# Instalar dependências
echo -e "${BLUE}📦 Instalando dependências...${NC}"
if [ "$PKG_MANAGER" = "bun" ]; then
    bun install
else
    npm install
fi

# Gerar Prisma
echo -e "${BLUE}🔧 Configurando banco de dados...${NC}"
if [ "$PKG_MANAGER" = "bun" ]; then
    bunx prisma generate
    bunx prisma db push
else
    npx prisma generate
    npx prisma db push
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo -e "${GREEN}║         ✅ INSTALAÇÃO CONCLUÍDA!                      ║${NC}"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${YELLOW}🚀 Para iniciar o sistema:${NC}"
echo ""
if [ "$PKG_MANAGER" = "bun" ]; then
    echo -e "   ${BLUE}bun run dev${NC}"
else
    echo -e "   ${BLUE}npm run dev${NC}"
fi
echo ""
echo -e "${YELLOW}🌐 Acesse:${NC} http://localhost:3000"
echo ""
echo -e "${YELLOW}🔐 Login padrão:${NC}"
echo "   Email: admin@sigmadocs.com.br"
echo "   Senha: admin123"
echo ""
echo -e "${RED}⚠️  ALTERE A SENHA APÓS PRIMEIRO LOGIN!${NC}"
echo ""
