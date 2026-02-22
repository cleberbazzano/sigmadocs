# Sigma DOCs - Guia de Deploy em Produção

## 📋 Requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Servidor Linux (Ubuntu 22.04+ recomendado)
- Mínimo 2GB RAM, 10GB disco
- Portas 80 e 443 disponíveis

---

## 🚀 Instalação Rápida

### 1. Clone o repositório no servidor

```bash
git clone <seu-repositorio> sigmadocs
cd sigmadocs
```

### 2. Configure as variáveis de ambiente

```bash
# Criar arquivo .env.production
cat > .env.production << EOF
DATABASE_URL=file:/app/data/sigmadocs.db
NEXTAUTH_URL=https://seu-dominio.com.br
NEXTAUTH_SECRET=$(openssl rand -base64 32)
SMTP_HOST=smtp.seu-servidor.com
SMTP_PORT=587
SMTP_USER=seu-email@dominio.com
SMTP_PASS=sua-senha-smtp
SMTP_FROM_EMAIL=noreply@seu-dominio.com.br
SMTP_FROM_NAME=Sigma DOCs
CRON_SECRET=$(openssl rand -base64 16)
EOF
```

### 3. Inicie os containers

```bash
docker compose up -d --build
```

### 4. Verifique se está funcionando

```bash
# Verificar status
docker compose ps

# Verificar logs
docker compose logs -f sigmadocs

# Testar health check
curl http://localhost:3000/api/health
```

---

## 🔒 Configuração com SSL (HTTPS)

### Opção 1: Certificados próprios

1. Coloque seus certificados na pasta `ssl/`:
```bash
mkdir -p ssl
cp seu-certificado.pem ssl/cert.pem
cp sua-chave.pem ssl/key.pem
```

2. Inicie com nginx:
```bash
docker compose --profile production up -d
```

### Opção 2: Let's Encrypt (Recomendado)

1. Instale o Certbot:
```bash
sudo apt install certbot
```

2. Gere os certificados:
```bash
sudo certbot certonly --standalone -d seu-dominio.com.br
```

3. Copie os certificados:
```bash
mkdir -p ssl
sudo cp /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem ssl/key.pem
sudo chown -R $USER:$USER ssl/
```

4. Configure renovação automática:
```bash
# Adicionar ao crontab
crontab -e

# Adicionar linha:
0 0 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem /path/to/sigmadocs/ssl/cert.pem && cp /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem /path/to/sigmadocs/ssl/key.pem && docker compose restart nginx
```

---

## ⚙️ Configuração Avançada

### Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `DATABASE_URL` | Caminho do banco SQLite | Sim |
| `NEXTAUTH_URL` | URL pública do sistema | Sim |
| `NEXTAUTH_SECRET` | Chave secreta para sessões | Sim |
| `SMTP_HOST` | Servidor SMTP | Não |
| `SMTP_PORT` | Porta SMTP | Não |
| `SMTP_USER` | Usuário SMTP | Não |
| `SMTP_PASS` | Senha SMTP | Não |
| `SMTP_FROM_EMAIL` | Email remetente | Não |
| `SMTP_FROM_NAME` | Nome remetente | Não |
| `CRON_SECRET` | Secret para cron jobs | Recomendado |

### Volumes

| Volume | Descrição |
|--------|-----------|
| `sigmadocs-data` | Banco de dados SQLite |
| `sigmadocs-uploads` | Arquivos enviados |
| `sigmadocs-backups` | Backups automáticos |

### Portas

| Porta | Serviço |
|-------|---------|
| 3000 | Aplicação (interno) |
| 80 | Nginx HTTP |
| 443 | Nginx HTTPS |

---

## 📊 Monitoramento

### Health Check

```bash
curl http://localhost:3000/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T00:00:00.000Z",
  "service": "Sigma DOCs"
}
```

### Logs

```bash
# Ver logs em tempo real
docker compose logs -f sigmadocs

# Ver últimos 100 logs
docker compose logs --tail=100 sigmadocs
```

### Status dos Containers

```bash
docker compose ps
```

---

## 🔧 Manutenção

### Backup Manual

```bash
# Backup do banco de dados
docker compose exec sigmadocs cp /app/data/sigmadocs.db /app/backups/backup-$(date +%Y%m%d).db

# Ou via API (se autenticado)
curl -X POST http://localhost:3000/api/backup \
  -H "Cookie: session_token=SEU_TOKEN"
```

### Restauração

```bash
# Parar a aplicação
docker compose stop sigmadocs

# Restaurar banco
docker compose exec sigmadocs cp /app/backups/backup-20250115.db /app/data/sigmadocs.db

# Iniciar a aplicação
docker compose start sigmadocs
```

### Atualização

```bash
# Parar containers
docker compose down

# Atualizar código
git pull

# Reconstruir e iniciar
docker compose up -d --build

# Executar migrações (se houver)
docker compose exec sigmadocs npx prisma migrate deploy
```

### Limpeza

```bash
# Remover containers e volumes
docker compose down -v

# Limpar imagens antigas
docker image prune -f
```

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

```bash
# Verificar se o volume existe
docker volume ls | grep sigmadocs

# Recriar container
docker compose down
docker compose up -d
```

### Erro: "Permission denied" nos uploads

```bash
# Corrigir permissões
docker compose exec sigmadocs chown -R nextjs:nodejs /app/uploads
```

### Erro: "Port already in use"

```bash
# Verificar o que está usando a porta
sudo lsof -i :3000
sudo lsof -i :80
sudo lsof -i :443

# Matar processo se necessário
sudo kill -9 <PID>
```

### Memória insuficiente

```bash
# Aumentar limite de memória do container
# Adicionar ao docker-compose.yml:
services:
  sigmadocs:
    deploy:
      resources:
        limits:
          memory: 2G
```

---

## 📦 Deploy sem Docker

### Requisitos
- Node.js 20+
- Bun
- PM2 (recomendado)

### Passos

```bash
# Instalar dependências
bun install

# Gerar Prisma Client
bunx prisma generate

# Build de produção
bun run build

# Iniciar com PM2
pm2 start npm --name "sigmadocs" -- start
pm2 save
pm2 startup
```

---

## 🔄 Cron Jobs

Configure cron jobs no servidor para tarefas automáticas:

```bash
# Editar crontab
crontab -e

# Adicionar linhas:
# Verificar vencimentos (a cada hora)
0 * * * * curl -X POST -H "X-Cron-Secret: SEU_SECRET" https://seu-dominio.com.br/api/alerts/process

# Backup diário (2h da manhã)
0 2 * * * curl -X POST -H "X-Cron-Secret: SEU_SECRET" https://seu-dominio.com.br/api/backup
```

---

## 📞 Suporte

Para suporte técnico, entre em contato:
- Email: suporte@sigmadocs.com.br
- Documentação: https://docs.sigmadocs.com.br

---

## ✅ Checklist de Deploy

- [ ] Servidor configurado (Docker instalado)
- [ ] Variáveis de ambiente configuradas
- [ ] SSL/HTTPS configurado
- [ ] Health check funcionando
- [ ] Backup configurado
- [ ] Cron jobs configurados
- [ ] Monitoramento configurado
- [ ] Login testado (admin@sigmadocs.com.br / admin123)
- [ ] Senha admin alterada
- [ ] Empresa cadastrada
