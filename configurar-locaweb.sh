#!/bin/bash

# Sigma DOCs - Configuração Rápida para Locaweb
# Uso: ./configurar-locaweb.sh

set -e

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     Sigma DOCs - Configuração para Locaweb       ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Perguntar domínio
echo -e "${BLUE}🌐 Configuração do Domínio${NC}"
echo ""
read -p "Digite seu domínio (ex: empresa.com.br): " DOMINIO

if [ -z "$DOMINIO" ]; then
    echo "❌ Domínio é obrigatório!"
    exit 1
fi

# Remover protocolo se presente
DOMINIO=$(echo "$DOMINIO" | sed 's|https://||' | sed 's|http://||' | sed 's|/||g')

echo ""
echo -e "${GREEN}✅ Domínio configurado: $DOMINIO${NC}"
echo ""

# Gerar secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
CRON_SECRET=$(openssl rand -base64 16)

# Criar arquivo .env.production
echo -e "${BLUE}📝 Criando arquivo de configuração...${NC}"

cat > .env.production << EOF
# ================================================
# Sigma DOCs - Configuração para Locaweb
# Domínio: $DOMINIO
# Gerado em: $(date)
# ================================================

# Banco de dados SQLite
DATABASE_URL=file:./data/sigmadocs.db

# URL do sistema
NEXTAUTH_URL=https://$DOMINIO

# Chave secreta para sessões (MANTENHA SECRETA!)
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Configurações de Email (configure conforme necessário)
SMTP_HOST=smtp.locaweb.com.br
SMTP_PORT=587
SMTP_USER=contato@$DOMINIO
SMTP_PASS=sua-senha-email
SMTP_FROM_EMAIL=noreply@$DOMINIO
SMTP_FROM_NAME=Sigma DOCs

# Secret para cron jobs
CRON_SECRET=${CRON_SECRET}

# Porta da aplicação
PORT=3000
EOF

echo -e "${GREEN}✅ Arquivo .env.production criado!${NC}"

# Criar .htaccess para Apache
echo -e "${BLUE}📝 Criando .htaccess...${NC}"

cat > public/.htaccess << EOF
# Sigma DOCs - Configuração Apache/Locaweb
# Domínio: $DOMINIO

<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Forçar HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # Forçar www (opcional - descomente se desejar)
    # RewriteCond %{HTTP_HOST} !^www\.
    # RewriteRule ^(.*)$ https://www.%{HTTP_HOST}/$1 [R=301,L]
</IfModule>

# Headers de segurança
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Limite de upload (100MB)
LimitRequestBody 104857600

# Cache para arquivos estáticos
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
EOF

echo -e "${GREEN}✅ Arquivo .htaccess criado!${NC}"

# Criar redirecionamento para a aplicação
cat > public/index.php << 'EOF'
<?php
// Sigma DOCs - Redirecionamento para aplicação Node.js
// Este arquivo redireciona requisições para a aplicação

$port = getenv('PORT') ?: '3000';
$url = "http://localhost:{$port}" . $_SERVER['REQUEST_URI'];

// Redirecionar para a aplicação Node.js
header("Location: {$url}");
exit;
EOF

echo -e "${GREEN}✅ Arquivo de redirecionamento criado!${NC}"

# Resumo
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║          CONFIGURAÇÃO CONCLUÍDA!                 ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Domínio:${NC} https://$DOMINIO"
echo ""
echo "📋 Arquivos criados:"
echo "   • .env.production - Configurações do sistema"
echo "   • public/.htaccess - Configuração Apache"
echo "   • public/index.php - Redirecionamento"
echo ""
echo "🚀 Próximos passos:"
echo ""
echo "   1. Execute o build de produção:"
echo -e "      ${BLUE}./prepare-ftp-deploy.sh${NC}"
echo ""
echo "   2. Faça upload dos arquivos para a Locaweb"
echo ""
echo "   3. No painel da Locaweb, configure:"
echo "      - Diretório do app"
echo "      - Node.js habilitado"
echo "      - SSL ativo"
echo ""
echo "   4. Acesse: ${BLUE}https://$DOMINIO${NC}"
echo ""
echo "   5. Login padrão:"
echo "      Email: admin@sigmadocs.com.br"
echo "      Senha: admin123"
echo ""
echo -e "${YELLOW}⚠️  ALTERE A SENHA APÓS PRIMEIRO LOGIN!${NC}"
echo ""
