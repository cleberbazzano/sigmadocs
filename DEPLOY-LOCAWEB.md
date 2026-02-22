# Sigma DOCs - Deploy na Locaweb

## 📋 Opções de Hospedagem na Locaweb

A Locaweb oferece diferentes tipos de hospedagem. Veja qual se adapta melhor:

| Tipo | Compatibilidade | Recomendação |
|------|-----------------|--------------|
| **Cloud Server Pro** | ✅ Totalmente compatível | ⭐⭐⭐ Melhor opção |
| **VPS Locaweb** | ✅ Totalmente compatível | ⭐⭐⭐ Recomendado |
| **Cloud Sites** | ⚠️ Limitado | ⭐ Não recomendado |
| **Hospedagem Compartilhada** | ❌ Incompatível | ❌ Não suporta Node.js |

---

## 🚀 Opção 1: Cloud Server Pro (Recomendado)

### Passo 1: Contratar o Serviço
1. Acesse: https://www.locaweb.com.br/cloud/cloud-server/
2. Escolha o plano **mínimo 2GB RAM**
3. Selecione sistema operacional **Ubuntu 22.04**

### Passo 2: Acessar o Servidor via SSH

```bash
ssh root@seu-ip-do-servidor
```

### Passo 3: Instalar Dependências

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Instalar Node.js 20 (alternativa sem Docker)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Instalar PM2 (gerenciador de processos)
npm install -g pm2
```

### Passo 4: Clonar e Configurar

```bash
# Criar diretório do app
mkdir -p /var/www/sigmadocs
cd /var/www/sigmadocs

# Clonar repositório (ou fazer upload via FTP/SFTP)
git clone <seu-repositorio> .

# Criar arquivo de ambiente
cat > .env.production << EOF
DATABASE_URL=file:/var/www/sigmadocs/data/sigmadocs.db
NEXTAUTH_URL=https://seu-dominio.com.br
NEXTAUTH_SECRET=$(openssl rand -base64 32)
SMTP_HOST=smtp.seu-servidor.com
SMTP_PORT=587
SMTP_USER=seu-email@dominio.com
SMTP_PASS=sua-senha
SMTP_FROM_EMAIL=noreply@seu-dominio.com.br
SMTP_FROM_NAME=Sigma DOCs
CRON_SECRET=$(openssl rand -base64 16)
EOF

# Criar diretórios necessários
mkdir -p data uploads backups
```

### Passo 5: Deploy com Docker (Recomendado)

```bash
cd /var/www/sigmadocs

# Build e iniciar
docker compose up -d --build

# Verificar status
docker compose ps
docker compose logs -f sigmadocs
```

### Passo 6: Deploy sem Docker (Alternativa)

```bash
cd /var/www/sigmadocs

# Instalar dependências
bun install

# Gerar Prisma
bunx prisma generate

# Build de produção
NODE_ENV=production bun run build

# Iniciar com PM2
pm2 start npm --name "sigmadocs" -- start

# Salvar configuração do PM2
pm2 save
pm2 startup
```

---

## 🌐 Configurar Domínio na Locaweb

### Passo 1: Apontar DNS

No painel da Locaweb:

1. Acesse **Painel de Controle** → **Domínios**
2. Selecione seu domínio
3. Configure os registros DNS:

| Tipo | Nome | Valor |
|------|------|-------|
| A | @ | IP do seu servidor |
| A | www | IP do seu servidor |
| MX | @ | seu-servidor-mail (se tiver email) |

### Passo 2: Aguardar Propagação

A propagação DNS pode levar até 48 horas (geralmente 1-4 horas).

---

## 🔒 Configurar SSL com Let's Encrypt

### Opção A: Com Nginx (Recomendado)

```bash
# Instalar Nginx
apt install nginx -y

# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Parar temporariamente para obter certificado
systemctl stop nginx

# Obter certificado
certbot certonly --standalone -d seu-dominio.com.br -d www.seu-dominio.com.br

# Configurar Nginx
cat > /etc/nginx/sites-available/sigmadocs << 'EOF'
server {
    listen 80;
    server_name seu-dominio.com.br www.seu-dominio.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com.br www.seu-dominio.com.br;

    ssl_certificate /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Ativar site
ln -s /etc/nginx/sites-available/sigmadocs /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Testar e reiniciar
nginx -t
systemctl restart nginx
systemctl enable nginx

# Configurar renovação automática
crontab -e
# Adicionar:
0 0 1 * * certbot renew --quiet && systemctl reload nginx
```

### Opção B: SSL da Locaweb

1. No painel da Locaweb, acesse **SSL**
2. Ative o **SSL Gratuito** (Let's Encrypt gerenciado pela Locaweb)
3. Ou contrate um SSL pago

---

## 🔄 Configurar Tarefas Agendadas (Cron Jobs)

```bash
# Editar crontab
crontab -e

# Adicionar as linhas:
# Verificar vencimentos (a cada hora)
0 * * * * curl -X POST -H "X-Cron-Secret: SEU_SECRET" https://seu-dominio.com.br/api/alerts/process

# Backup diário (2h da manhã)
0 2 * * * curl -X POST -H "X-Cron-Secret: SEU_SECRET" https://seu-dominio.com.br/api/backup

# Limpeza de logs (semanal, domingo às 3h)
0 3 * * 0 curl -X POST -H "X-Cron-Secret: SEU_SECRET" https://seu-dominio.com.br/api/tasks/cleanup
```

---

## 📊 Monitoramento

### Verificar Status da Aplicação

```bash
# Com Docker
docker compose ps
docker compose logs -f sigmadocs

# Com PM2
pm2 status
pm2 logs sigmadocs
pm2 monit
```

### Verificar Recursos

```bash
# Memória e CPU
htop

# Espaço em disco
df -h

# Tamanho dos diretórios
du -sh /var/www/sigmadocs/*
```

---

## 🔧 Manutenção

### Atualizar Aplicação

```bash
cd /var/www/sigmadocs

# Com Docker
docker compose down
git pull
docker compose up -d --build

# Com PM2
git pull
bun install
bunx prisma generate
bun run build
pm2 restart sigmadocs
```

### Backup Manual

```bash
# Backup do banco
cp /var/www/sigmadocs/data/sigmadocs.db /var/www/sigmadocs/backups/backup-$(date +%Y%m%d).db

# Backup completo
tar -czf /root/backup-sigmadocs-$(date +%Y%m%d).tar.gz /var/www/sigmadocs
```

### Restaurar Backup

```bash
# Parar aplicação
docker compose down
# ou
pm2 stop sigmadocs

# Restaurar
cp /var/www/sigmadocs/backups/backup-20250115.db /var/www/sigmadocs/data/sigmadocs.db

# Iniciar aplicação
docker compose up -d
# ou
pm2 start sigmadocs
```

---

## 🚨 Troubleshooting

### Erro: "Cannot connect to database"
```bash
# Verificar permissões
chown -R www-data:www-data /var/www/sigmadocs/data
chmod 755 /var/www/sigmadocs/data
```

### Erro: "Port 3000 already in use"
```bash
# Verificar processo
lsof -i :3000
# Matar processo
kill -9 <PID>
```

### Erro: "Out of memory"
```bash
# Aumentar swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Erro 502 Bad Gateway
```bash
# Verificar se aplicação está rodando
docker compose ps
# ou
pm2 status

# Verificar logs
docker compose logs sigmadocs
# ou
pm2 logs sigmadocs

# Reiniciar nginx
systemctl restart nginx
```

---

## 📞 Suporte Locaweb

- **Telefone**: 4003-9450 (capitais) ou 0800-887-9450 (demais localidades)
- **Chat**: Disponível no painel de controle
- **E-mail**: suporte@locaweb.com.br
- **Documentação**: https://wiki.locaweb.com.br/

---

## ✅ Checklist de Deploy Locaweb

- [ ] Contratar Cloud Server Pro ou VPS
- [ ] Acessar servidor via SSH
- [ ] Instalar Docker ou Node.js/Bun
- [ ] Clonar repositório
- [ ] Configurar variáveis de ambiente
- [ ] Executar build
- [ ] Configurar domínio (DNS)
- [ ] Configurar SSL
- [ ] Configurar Nginx
- [ ] Configurar cron jobs
- [ ] Testar acesso ao sistema
- [ ] Alterar senha do admin
- [ ] Cadastrar dados da empresa
