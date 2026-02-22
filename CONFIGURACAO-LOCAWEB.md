# Sigma DOCs - Configuração para Locaweb

## 🎯 Visão Geral

Este guia mostra como configurar o sistema para funcionar corretamente no domínio da Locaweb.

---

## 📋 Tipos de Hospedagem Locaweb e Configuração

### Opção A: Cloud Server / VPS (Com SSH)

Você tem controle total do servidor. Siga o guia `DEPLOY-LOCAWEB.md`.

### Opção B: Hospedagem Compartilhada (Sem SSH)

Configuração via painel e arquivos de configuração.

---

## 🌐 Passo 1: Configurar o Domínio

### No Painel da Locaweb

1. Acesse: https://painel.locaweb.com.br
2. Vá em **Domínios** → Selecione seu domínio
3. Configure o **Apontamento DNS**:

| Tipo | Nome | Valor |
|------|------|-------|
| A | @ | IP do servidor |
| A | www | IP do servidor |

Se usar hospedagem compartilhada:
- O apontamento é automático para o diretório `/public_html/`

---

## ⚙️ Passo 2: Configurar Variáveis de Ambiente

Crie o arquivo `.env.production` com as configurações do seu domínio:

```env
# ================================================
# Sigma DOCs - Configuração para Locaweb
# ================================================

# Banco de dados (SQLite - arquivo local)
DATABASE_URL=file:./data/sigmadocs.db

# URL do sistema (SEU DOMÍNIO NA LOCAWEB)
NEXTAUTH_URL=https://seu-dominio.com.br

# Chave secreta (GERE UMA NOVA!)
# Execute: openssl rand -base64 32
NEXTAUTH_SECRET=COLE_AQUI_SUA_CHAVE_SECRETA_GERADA

# Email SMTP (Configure com dados da Locaweb ou outro)
SMTP_HOST=smtp.locaweb.com.br
SMTP_PORT=587
SMTP_USER=seu-email@seu-dominio.com.br
SMTP_PASS=sua-senha-email
SMTP_FROM_EMAIL=noreply@seu-dominio.com.br
SMTP_FROM_NAME=Sigma DOCs

# Secret para cron jobs
CRON_SECRET=cole_aqui_um_secret_para_cron

# Porta (geralmente 3000 ou a porta designada pela Locaweb)
PORT=3000
```

---

## 🔀 Passo 3: Configurar Redirecionamento

### Para Hospedagem com Apache (.htaccess)

Crie um arquivo `.htaccess` na raiz do site:

```apache
# Sigma DOCs - Configuração Apache/Locaweb

# Ativar rewrite engine
RewriteEngine On

# Forçar HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Redirecionar para aplicação Node.js
# A Locaweb geralmente usa Passenger ou proxy reverso

# Se usar Passenger (Node.js):
PassengerEnabled On
PassengerAppRoot /caminho/para/sigmadocs
PassengerStartupFile server.js

# Se usar Proxy Reverso:
# RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]

# Configurações de segurança
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
```

### Para Hospedagem com Nginx

Se você tem VPS/Cloud Server com Nginx:

```nginx
# /etc/nginx/sites-available/sigmadocs

server {
    listen 80;
    server_name seu-dominio.com.br www.seu-dominio.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com.br www.seu-dominio.com.br;

    # SSL (configure seus certificados)
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem;

    # Limite de upload
    client_max_body_size 100M;

    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache para arquivos estáticos
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

---

## 📂 Passo 4: Estrutura de Diretórios na Locaweb

### Hospedagem Compartilhada

```
/public_html/
├── sigmadocs/
│   ├── .next/
│   ├── data/
│   ├── uploads/
│   ├── public/
│   ├── prisma/
│   ├── .env.production
│   ├── server.js
│   ├── package.json
│   └── .htaccess
```

### Cloud Server / VPS

```
/var/www/sigmadocs/
├── .next/
├── data/
├── uploads/
├── public/
├── prisma/
├── .env.production
├── server.js
└── package.json
```

---

## 🔧 Passo 5: Configurar no Painel da Locaweb

### Ativar Node.js

1. No painel da Locaweb, procure por **"Node.js"** ou **"Aplicação"**
2. Configure:
   - **Diretório**: `/sigmadocs` ou `/public_html/sigmadocs`
   - **Versão Node**: 18.x ou superior
   - **Comando de início**: `node server.js`
   - **Porta**: 3000 (ou a designada)

### Ativar SSL

1. No painel, acesse **SSL**
2. Ative o **SSL Gratuito** (Let's Encrypt) ou SSL pago
3. Aguarde a ativação

---

## 🔄 Passo 6: Configurar Aplicação para Domínio

### Atualizar next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // Configurar para domínio da Locaweb
  assetPrefix: process.env.NODE_ENV === 'production' ? '/' : '',
  
  // Domínios permitidos
  images: {
    domains: ['seu-dominio.com.br', 'www.seu-dominio.com.br'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'seu-dominio.com.br',
      },
    ],
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## 🚀 Passo 7: Fazer o Deploy

### 1. Preparar o pacote

```bash
# Execute localmente
./prepare-ftp-deploy.sh
```

### 2. Configurar para seu domínio

Edite `deploy-ftp/.env.production`:
```env
NEXTAUTH_URL=https://seu-dominio.com.br
```

### 3. Fazer upload

- Use FileZilla ou WinSCP
- Envie todos os arquivos para a pasta configurada

### 4. Reiniciar aplicação

Via SSH ou painel da Locaweb:
```bash
pm2 restart sigmadocs
# ou
./install.sh
```

---

## ✅ Verificar se Está Funcionando

1. Acesse: `https://seu-dominio.com.br`
2. Verifique se a tela de login aparece
3. Teste o login: `admin@sigmadocs.com.br` / `admin123`
4. Verifique se a logo aparece corretamente

### Se Não Funcionar

1. **Verifique os logs**:
   ```bash
   pm2 logs sigmadocs
   ```

2. **Verifique as variáveis de ambiente**:
   ```bash
   cat .env.production
   ```

3. **Verifique se o Node.js está rodando**:
   ```bash
   pm2 status
   curl http://localhost:3000/api/health
   ```

4. **Contate o suporte da Locaweb**:
   - Telefone: 4003-9450
   - Chat: No painel de controle

---

## 📞 Informações Importantes

### Credenciais Padrão
- **Email**: admin@sigmadocs.com.br
- **Senha**: admin123
- ⚠️ **ALTERE APÓS PRIMEIRO LOGIN!**

### Suporte Locaweb
- **Painel**: https://painel.locaweb.com.br
- **Wiki**: https://wiki.locaweb.com.br/
- **Telefone**: 4003-9450 (capitais) / 0800-887-9450

---

## 🔄 Atualizações

Sempre que atualizar o sistema:

1. Execute localmente: `./prepare-ftp-deploy.sh`
2. Configure o `.env.production` com seu domínio
3. Faça upload dos novos arquivos
4. Reinicie: `pm2 restart sigmadocs`
