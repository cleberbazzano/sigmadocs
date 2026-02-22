#!/bin/bash

# Sigma DOCs - Criar Pacote Completo para Download
# Este script cria um ZIP com todo o código fonte

echo "📦 Criando pacote do Sigma DOCs..."

# Nome do pacote
PACKAGE_NAME="sigmadocs-$(date +%Y%m%d-%H%M%S)"

# Criar diretório temporário
mkdir -p /tmp/$PACKAGE_NAME

# Copiar todos os arquivos necessários
echo "📁 Copiando arquivos..."

# Código fonte
cp -r src /tmp/$PACKAGE_NAME/
cp -r prisma /tmp/$PACKAGE_NAME/
cp -r public /tmp/$PACKAGE_NAME/

# Configurações
cp package.json /tmp/$PACKAGE_NAME/
cp bun.lockb /tmp/$PACKAGE_NAME/ 2>/dev/null || true
cp next.config.ts /tmp/$PACKAGE_NAME/
cp tsconfig.json /tmp/$PACKAGE_NAME/
cp tailwind.config.ts /tmp/$PACKAGE_NAME/ 2>/dev/null || true
cp postcss.config.mjs /tmp/$PACKAGE_NAME/ 2>/dev/null || true
cp components.json /tmp/$PACKAGE_NAME/ 2>/dev/null || true

# Scripts de deploy
cp build-production.sh /tmp/$PACKAGE_NAME/
cp prepare-ftp-deploy.sh /tmp/$PACKAGE_NAME/
cp configurar-locaweb.sh /tmp/$PACKAGE_NAME/
cp docker-compose.yml /tmp/$PACKAGE_NAME/
cp Dockerfile /tmp/$PACKAGE_NAME/
cp server.js /tmp/$PACKAGE_NAME/

# Documentação
cp DEPLOYMENT.md /tmp/$PACKAGE_NAME/
cp DEPLOY-LOCAWEB.md /tmp/$PACKAGE_NAME/
cp CONFIGURACAO-LOCAWEB.md /tmp/$PACKAGE_NAME/
cp README-LOCAWEB.md /tmp/$PACKAGE_NAME/
cp DIAGNOSTICO.md /tmp/$PACKAGE_NAME/

# Criar .env.example
cat > /tmp/$PACKAGE_NAME/.env.example << 'EOF'
# Sigma DOCs - Configuração
# Copie para .env.local ou .env.production

# Banco de dados SQLite
DATABASE_URL=file:./data/sigmadocs.db

# URL do sistema (ALTERE PARA SEU DOMÍNIO)
NEXTAUTH_URL=http://localhost:3000

# Chave secreta para sessões (gere uma nova)
# Execute: openssl rand -base64 32
NEXTAUTH_SECRET=sua-chave-secreta-aqui

# Email SMTP (opcional)
SMTP_HOST=smtp.seu-servidor.com
SMTP_PORT=587
SMTP_USER=seu-email
SMTP_PASS=sua-senha
SMTP_FROM_EMAIL=noreply@seu-dominio.com
SMTP_FROM_NAME=Sigma DOCs

# Secret para cron jobs
CRON_SECRET=secret-para-cron-jobs
EOF

# Criar README principal
cat > /tmp/$PACKAGE_NAME/README.md << 'EOF'
# Sigma DOCs - Sistema de Gestão Eletrônica de Documentos

## 🚀 Instalação Rápida

### Pré-requisitos
- Node.js 18+
- Bun (recomendado) ou npm

### Passos

```bash
# 1. Instalar dependências
bun install

# 2. Configurar ambiente
cp .env.example .env.local
# Edite o .env.local com suas configurações

# 3. Configurar banco de dados
bunx prisma generate
bunx prisma db push

# 4. Iniciar desenvolvimento
bun run dev

# 5. Acessar
# http://localhost:3000
```

## 🔐 Login Padrão
- Email: admin@sigmadocs.com.br
- Senha: admin123

⚠️ **ALTERE A SENHA APÓS PRIMEIRO LOGIN!**

## 📦 Deploy em Produção

Veja os arquivos:
- `DEPLOY-LOCAWEB.md` - Deploy na Locaweb
- `DEPLOYMENT.md` - Deploy com Docker
- `build-production.sh` - Script de build

## 📞 Suporte
- Email: suporte@sigmadocs.com.br
EOF

# Criar ZIP
echo "📦 Compactando..."
cd /tmp
zip -r /home/z/my-project/${PACKAGE_NAME}.zip $PACKAGE_NAME

# Limpar
rm -rf /tmp/$PACKAGE_NAME

echo ""
echo "✅ Pacote criado: ${PACKAGE_NAME}.zip"
echo ""
echo "📋 O arquivo ZIP contém todo o código fonte pronto para uso."
