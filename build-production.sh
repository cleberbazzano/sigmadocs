#!/bin/bash

# Sigma DOCs - Build Completo para Produção
# Este script prepara tudo para deploy na Locaweb

set -e

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║     Sigma DOCs - Build para Produção (Locaweb)         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar bun
if ! command -v bun &> /dev/null; then
    echo -e "${RED}❌ Bun não encontrado!${NC}"
    echo "Instale com: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo -e "${BLUE}📁 Preparando ambiente...${NC}"

# Limpar builds anteriores
rm -rf .next deploy-ftp node_modules/.cache 2>/dev/null || true

# Criar diretório de deploy
mkdir -p deploy-ftp

echo -e "${BLUE}📦 Instalando dependências...${NC}"
bun install --frozen-lockfile

echo -e "${BLUE}🔧 Gerando Prisma Client...${NC}"
bunx prisma generate

echo -e "${BLUE}🔨 Executando build de produção...${NC}"
NODE_ENV=production bun run build

if [ ! -d ".next/standalone" ]; then
    echo -e "${RED}❌ Build falhou! Pasta .next/standalone não encontrada.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"

echo -e "${BLUE}📂 Criando estrutura de deploy...${NC}"

# Criar diretórios
mkdir -p deploy-ftp/data
mkdir -p deploy-ftp/uploads/logos
mkdir -p deploy-ftp/uploads/documents
mkdir -p deploy-ftp/backups
mkdir -p deploy-ftp/logs
mkdir -p deploy-ftp/.next/static

# Copiar arquivos do build
cp -r .next/standalone/* deploy-ftp/
cp -r .next/static/* deploy-ftp/.next/static/

# Copiar arquivos públicos
cp -r public deploy-ftp/

# Copiar Prisma
cp -r prisma deploy-ftp/

# Copiar configurações
cp package.json deploy-ftp/
cp next.config.ts deploy-ftp/

echo -e "${GREEN}✅ Arquivos copiados!${NC}"

# Perguntar domínio
echo ""
echo -e "${YELLOW}🌐 Configuração do Domínio${NC}"
read -p "Digite seu domínio (ex: empresa.com.br): " DOMINIO

if [ -z "$DOMINIO" ]; then
    DOMINIO="seu-dominio.com.br"
    echo -e "${YELLOW}Usando domínio padrão: $DOMINIO${NC}"
fi

# Limpar domínio
DOMINIO=$(echo "$DOMINIO" | sed 's|https://||' | sed 's|http://||' | sed 's|/||g')

# Gerar secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
CRON_SECRET=$(openssl rand -base64 16)

# Criar .env.production
cat > deploy-ftp/.env.production << EOF
# Sigma DOCs - Produção
# Domínio: $DOMINIO

DATABASE_URL=file:./data/sigmadocs.db
NEXTAUTH_URL=https://$DOMINIO
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
CRON_SECRET=${CRON_SECRET}
PORT=3000
NODE_ENV=production

# Email (configure conforme necessário)
SMTP_HOST=smtp.seu-servidor.com
SMTP_PORT=587
SMTP_USER=seu-email
SMTP_PASS=sua-senha
SMTP_FROM_EMAIL=noreply@$DOMINIO
SMTP_FROM_NAME=Sigma DOCs
EOF

# Criar server.js simplificado
cat > deploy-ftp/server.js << 'SERVEREOF'
// Sigma DOCs - Production Server
/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '.env.production') });

const port = parseInt(process.env.PORT || '3000', 10);
const hostname = '0.0.0.0';

// Importar Next.js
const next = require('next');
const app = next({ dev: false, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

console.log('🚀 Iniciando Sigma DOCs...');
console.log(`   Porta: ${port}`);
console.log(`   Diretório: ${__dirname}`);

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Erro:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, hostname, () => {
    console.log(`✅ Sigma DOCs rodando em http://${hostname}:${port}`);
  });
}).catch(err => {
  console.error('Erro ao iniciar:', err);
  process.exit(1);
});
SERVEREOF

# Criar script de instalação
cat > deploy-ftp/install.sh << 'INSTALLEOF'
#!/bin/bash
echo "🚀 Instalando Sigma DOCs..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    exit 1
fi

echo "✅ Node.js: $(node -v)"

# Instalar dependências se node_modules não existir
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install --production
fi

# Gerar Prisma
echo "🔧 Configurando banco de dados..."
npx prisma generate
npx prisma db push

# Instalar PM2 se não existir
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# Iniciar aplicação
echo "▶️ Iniciando aplicação..."
pm2 delete sigmadocs 2>/dev/null || true
pm2 start server.js --name sigmadocs
pm2 save

echo ""
echo "✅ Instalação concluída!"
echo "   Comandos úteis:"
echo "   pm2 status"
echo "   pm2 logs sigmadocs"
echo "   pm2 restart sigmadocs"
INSTALLEOF

# Criar ecosystem.config.js para PM2
cat > deploy-ftp/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sigmadocs',
    script: 'server.js',
    cwd: __dirname,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log'
  }]
};
EOF

# Criar .htaccess para Apache
cat > deploy-ftp/public/.htaccess << 'EOF'
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
</IfModule>
EOF

# Criar README
cat > deploy-ftp/README.txt << EOF
========================================
     SIGMA DOCs - Instruções
========================================

1. Configure o arquivo .env.production se necessário

2. No servidor, execute:
   chmod +x install.sh
   ./install.sh

3. Acesse: https://$DOMINIO

4. Login padrão:
   Email: admin@sigmadocs.com.br
   Senha: admin123

⚠️ ALTERE A SENHA APÓS PRIMEIRO LOGIN!

Requisitos:
- Node.js 18+
- PM2 (instalado automaticamente)
========================================
EOF

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo -e "${GREEN}║         ✅ BUILD CONCLUÍDO COM SUCESSO!               ║${NC}"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📁 Pasta de deploy: deploy-ftp/"
echo "🌐 Domínio configurado: https://$DOMINIO"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "   1. Compacte a pasta deploy-ftp:"
echo -e "      ${BLUE}zip -r sigmadocs.zip deploy-ftp${NC}"
echo ""
echo "   2. Faça upload via FTP/SFTP para o servidor"
echo ""
echo "   3. No servidor, execute:"
echo -e "      ${BLUE}chmod +x install.sh${NC}"
echo -e "      ${BLUE}./install.sh${NC}"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Sua hospedagem PRECISA suportar Node.js 18+"
echo "   - Cloud Server Pro ou VPS na Locaweb"
echo "   - Hospedagem compartilhada NÃO funciona"
echo ""
