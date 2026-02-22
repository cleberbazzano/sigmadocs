#!/bin/bash

# Sigma DOCs - Script de Deploy para Produção
# Uso: ./deploy-production.sh

set -e

echo "🚀 Sigma DOCs - Deploy para Produção"
echo "===================================="

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script na raiz do projeto"
    exit 1
fi

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Funções
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# Verificar dependências
echo ""
echo "📦 Verificando dependências..."

if ! command -v bun &> /dev/null; then
    error "Bun não está instalado. Instale com: curl -fsSL https://bun.sh/install | bash"
fi

if ! command -v node &> /dev/null; then
    error "Node.js não está instalado"
fi

success "Dependências OK"

# Definir ambiente
export NODE_ENV=production

# Limpar builds anteriores
echo ""
echo "🧹 Limpando builds anteriores..."
rm -rf .next dist node_modules/.cache 2>/dev/null || true
success "Limpeza concluída"

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
bun install --frozen-lockfile
success "Dependências instaladas"

# Gerar Prisma Client
echo ""
echo "🔧 Gerando Prisma Client..."
bunx prisma generate
success "Prisma Client gerado"

# Verificar se .env.production existe
echo ""
if [ ! -f ".env.production" ]; then
    warning "Arquivo .env.production não encontrado!"
    echo ""
    echo "Criando .env.production com valores padrão..."
    
    # Gerar secrets
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    CRON_SECRET=$(openssl rand -base64 16)
    
    cat > .env.production << EOF
# Sigma DOCs - Configuração de Produção
# IMPORTANTE: Altere os valores abaixo!

# Banco de dados (SQLite)
DATABASE_URL=file:./data/sigmadocs.db

# URL do sistema (ALTERE PARA SEU DOMÍNIO)
NEXTAUTH_URL=https://seu-dominio.com.br

# Chave secreta para sessões (gerada automaticamente)
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Email SMTP (configure para notificações)
SMTP_HOST=smtp.seu-servidor.com
SMTP_PORT=587
SMTP_USER=seu-email@dominio.com
SMTP_PASS=sua-senha-email
SMTP_FROM_EMAIL=noreply@seu-dominio.com.br
SMTP_FROM_NAME=Sigma DOCs

# Secret para cron jobs
CRON_SECRET=${CRON_SECRET}
EOF
    
    warning "Configure o arquivo .env.production antes de continuar!"
fi

# Build da aplicação
echo ""
echo "🔨 Building aplicação..."
bun run build
success "Build concluído"

# Criar diretórios necessários
echo ""
echo "📁 Criando diretórios..."
mkdir -p data uploads uploads/logos uploads/documents backups
success "Diretórios criados"

# Criar arquivo de inicialização
echo ""
echo "📝 Criando script de inicialização..."
cat > start-production.sh << 'EOF'
#!/bin/bash
export NODE_ENV=production
export PORT=3000
export HOSTNAME="0.0.0.0"

# Iniciar aplicação
node .next/standalone/server.js
EOF
chmod +x start-production.sh
success "Script de inicialização criado"

# Criar arquivo PM2
echo ""
echo "📝 Criando configuração PM2..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sigmadocs',
    script: '.next/standalone/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
EOF
mkdir -p logs
success "Configuração PM2 criada"

# Resumo
echo ""
echo "===================================="
echo -e "${GREEN}✅ BUILD CONCLUÍDO COM SUCESSO!${NC}"
echo "===================================="
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Configure o arquivo .env.production:"
echo "   nano .env.production"
echo ""
echo "2. Inicie com PM2:"
echo "   pm2 start ecosystem.config.js --env production"
echo ""
echo "3. Configure Nginx como reverse proxy:"
echo "   Veja o arquivo DEPLOY-LOCAWEB.md"
echo ""
echo "4. Configure SSL com Let's Encrypt:"
echo "   certbot certonly --standalone -d seu-dominio.com.br"
echo ""
echo "📚 Documentação completa em DEPLOY-LOCAWEB.md"
echo ""
