#!/bin/bash

# Sigma DOCs - Preparar Pacote para Deploy FTP
# Uso: ./prepare-ftp-deploy.sh

set -e

echo "===================================="
echo "📦 Sigma DOCs - Preparando Deploy FTP"
echo "===================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verificar se bun está instalado
if ! command -v bun &> /dev/null; then
    echo "❌ Bun não encontrado. Instale com:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Diretório de deploy
DEPLOY_DIR="deploy-ftp"

echo -e "${BLUE}1️⃣ Limpando builds anteriores...${NC}"
rm -rf $DEPLOY_DIR 2>/dev/null || true
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

echo -e "${BLUE}2️⃣ Instalando dependências...${NC}"
bun install --frozen-lockfile

echo -e "${BLUE}3️⃣ Gerando Prisma Client...${NC}"
bunx prisma generate

echo -e "${BLUE}4️⃣ Executando build de produção...${NC}"
NODE_ENV=production bun run build

echo -e "${BLUE}5️⃣ Criando estrutura de diretórios...${NC}"
mkdir -p $DEPLOY_DIR
mkdir -p $DEPLOY_DIR/data
mkdir -p $DEPLOY_DIR/uploads/logos
mkdir -p $DEPLOY_DIR/uploads/documents
mkdir -p $DEPLOY_DIR/backups
mkdir -p $DEPLOY_DIR/logs

echo -e "${BLUE}6️⃣ Copiando arquivos...${NC}"

# Copiar build
cp -r .next/standalone $DEPLOY_DIR/
cp -r .next/static $DEPLOY_DIR/.next/static

# Copiar arquivos públicos
cp -r public $DEPLOY_DIR/

# Copiar Prisma
cp -r prisma $DEPLOY_DIR/

# Copiar configurações
cp package.json $DEPLOY_DIR/
cp next.config.ts $DEPLOY_DIR/

echo -e "${BLUE}7️⃣ Criando arquivos de configuração...${NC}"

# Criar .env.production
NEXTAUTH_SECRET=$(openssl rand -base64 32)
CRON_SECRET=$(openssl rand -base64 16)

cat > $DEPLOY_DIR/.env.production << EOF
# Sigma DOCs - Configuração de Produção
# =====================================
# IMPORTANTE: Configure antes de fazer upload!

# Banco de dados SQLite
DATABASE_URL=file:./data/sigmadocs.db

# URL do sistema (ALTERE PARA SEU DOMÍNIO!)
NEXTAUTH_URL=https://seu-dominio.com.br

# Chave secreta para sessões (gerada automaticamente - mantenha segura!)
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Configurações de Email (opcional)
SMTP_HOST=smtp.seu-servidor.com
SMTP_PORT=587
SMTP_USER=seu-email@dominio.com
SMTP_PASS=sua-senha
SMTP_FROM_EMAIL=noreply@seu-dominio.com.br
SMTP_FROM_NAME=Sigma DOCs

# Secret para cron jobs
CRON_SECRET=${CRON_SECRET}
EOF

# Criar script de início
cat > $DEPLOY_DIR/server.js << 'EOF'
// Sigma DOCs - Production Server
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false;
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
EOF

# Criar script de inicialização PM2
cat > $DEPLOY_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sigmadocs',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
}
EOF

# Criar script de instalação
cat > $DEPLOY_DIR/install.sh << 'EOF'
#!/bin/bash
# Sigma DOCs - Script de Instalação no Servidor

echo "🚀 Instalando Sigma DOCs..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    echo "Instale Node.js 18+ antes de continuar."
    exit 1
fi

echo "✅ Node.js encontrado: $(node -v)"

# Instalar PM2 se não existir
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# Inicializar banco de dados
echo "🗄️ Inicializando banco de dados..."
npx prisma db push

# Iniciar aplicação
echo "▶️ Iniciando aplicação..."
pm2 start ecosystem.config.js --env production

# Salvar configuração PM2
pm2 save

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "Comandos úteis:"
echo "  pm2 status          - Ver status"
echo "  pm2 logs sigmadocs  - Ver logs"
echo "  pm2 restart sigmadocs - Reiniciar"
echo "  pm2 stop sigmadocs  - Parar"
EOF

# Criar README
cat > $DEPLOY_DIR/README.txt << 'EOF'
====================================
     SIGMA DOCs - DEPLOY FTP
====================================

ESTRUTURA DE ARQUIVOS:
---------------------
├── .next/              # Build da aplicação
├── .env.production     # CONFIGURE ANTES DO UPLOAD!
├── data/               # Banco de dados SQLite
├── uploads/            # Arquivos enviados pelos usuários
├── backups/            # Backups automáticos
├── logs/               # Logs da aplicação
├── public/             # Arquivos estáticos
├── prisma/             # Schema do banco
├── server.js           # Servidor de produção
├── ecosystem.config.js # Configuração PM2
├── install.sh          # Script de instalação
└── package.json        # Dependências

PASSOS PARA DEPLOY:
-------------------
1. EDITE o arquivo .env.production com suas configurações
2. FAÇA UPLOAD de todos os arquivos para o servidor
3. EXECUTE no servidor:
   chmod +x install.sh
   ./install.sh

SE NÃO TIVER SSH:
-----------------
Use o painel de controle da hospedagem para:
1. Configurar Node.js
2. Definir comando de início: node server.js
3. Definir porta: 3000

CREDENCIAIS PADRÃO:
------------------
Email: admin@sigmadocs.com.br
Senha: admin123

⚠️ ALTERE A SENHA APÓS PRIMEIRO LOGIN!

SUPORTE:
--------
Documentação: DEPLOY-FTP-GUIA.md
EOF

echo ""
echo -e "${GREEN}✅ Pacote de deploy criado com sucesso!${NC}"
echo ""
echo "===================================="
echo "📁 Estrutura criada em: $DEPLOY_DIR/"
echo "===================================="
echo ""
echo -e "${YELLOW}⚠️  PRÓXIMOS PASSOS:${NC}"
echo ""
echo "1. Configure o arquivo:"
echo "   ${BLUE}$DEPLOY_DIR/.env.production${NC}"
echo ""
echo "2. Compacte a pasta para upload:"
echo "   ${BLUE}zip -r sigmadocs.zip $DEPLOY_DIR${NC}"
echo ""
echo "3. Faça upload via FTP/SFTP para o servidor"
echo ""
echo "4. No servidor, execute:"
echo "   ${BLUE}chmod +x install.sh${NC}"
echo "   ${BLUE}./install.sh${NC}"
echo ""
echo -e "${GREEN}📚 Documentação completa: DEPLOY-FTP-GUIA.md${NC}"
echo ""
