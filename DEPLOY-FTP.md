# Sigma DOCs - Deploy via FTP/SFTP (Manual)

## 📋 Quando Usar Este Método

Este método é recomendado quando:
- Você não tem acesso SSH ao servidor
- Sua hospedagem não suporta Docker
- Você prefere fazer upload manual dos arquivos

⚠️ **Importante**: A hospedagem deve suportar **Node.js 18+**.

---

## 🚀 Passo a Passo

### 1. Preparar os Arquivos Localmente

Na sua máquina local:

```bash
# Instalar dependências
bun install

# Gerar Prisma
bunx prisma generate

# Build de produção
NODE_ENV=production bun run build

# Criar arquivo de ambiente
cp .env.example .env.production
# Edite o arquivo com suas configurações
```

### 2. Criar Pacote para Upload

```bash
# Criar diretório de deploy
mkdir -p ../sigmadocs-deploy

# Copiar arquivos necessários
cp -r .next ../sigmadocs-deploy/
cp -r public ../sigmadocs-deploy/
cp -r prisma ../sigmadocs-deploy/
cp -r node_modules ../sigmadocs-deploy/
cp package.json ../sigmadocs-deploy/
cp .env.production ../sigmadocs-deploy/
cp next.config.ts ../sigmadocs-deploy/

# Criar diretórios de dados
mkdir -p ../sigmadocs-deploy/data
mkdir -p ../sigmadocs-deploy/uploads
mkdir -p ../sigmadocs-deploy/backups

# Compactar
cd ..
tar -czf sigmadocs-deploy.tar.gz sigmadocs-deploy/
```

### 3. Fazer Upload via FTP/SFTP

#### Usando FileZilla (GUI)

1. Baixe e instale o [FileZilla](https://filezilla-project.org/)
2. Conecte ao servidor:
   - Host: `ftp.seu-dominio.com.br` ou IP do servidor
   - Usuário: fornecido pela Locaweb
   - Senha: fornecida pela Locaweb
   - Porta: 21 (FTP) ou 22 (SFTP)
3. Navegue até `/public_html/` ou diretório do app
4. Upload do arquivo `sigmadocs-deploy.tar.gz`
5. Descompacte (se tiver acesso SSH) ou extraia localmente e faça upload dos arquivos

#### Usando SCP (Linha de comando)

```bash
scp sigmadocs-deploy.tar.gz usuario@seu-servidor:/var/www/
```

### 4. Configurar no Servidor

Se tiver acesso SSH:

```bash
# Acessar servidor
ssh usuario@seu-servidor

# Navegar até o diretório
cd /var/www/sigmadocs-deploy

# Descompactar
tar -xzf sigmadocs-deploy.tar.gz

# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start npm --name "sigmadocs" -- start

# Salvar configuração
pm2 save
pm2 startup
```

### 5. Configurar Domínio

No painel da Locaweb:

1. Acesse o painel de controle
2. Configure o domínio para apontar para o diretório do app
3. Configure SSL (Let's Encrypt gratuito)

---

## 🔧 Arquivos Necessários para Upload

```
sigmadocs-deploy/
├── .next/              # Build da aplicação
│   ├── standalone/     # Servidor standalone
│   └── static/         # Arquivos estáticos
├── public/             # Arquivos públicos
├── prisma/             # Schema do banco
│   └── schema.prisma
├── node_modules/       # Dependências (ou instalar no servidor)
├── data/               # Banco de dados SQLite
├── uploads/            # Arquivos enviados
├── backups/            # Backups
├── package.json        # Dependências
├── .env.production     # Configurações
└── next.config.ts      # Configuração Next.js
```

---

## ⚠️ Limitações

Este método tem algumas limitações:

- **Sem Docker**: Não usa containerização
- **Atualização manual**: Cada atualização requer novo upload
- **Migrações**: Devem ser executadas manualmente
- **Backup**: Deve ser feito manualmente

---

## 📞 Alternativa Recomendada

Se sua hospedagem não suporta Node.js nativamente, considere:

1. **Migrar para VPS/Cloud Server** (Locaweb Cloud Server Pro)
2. **Usar Docker** (ver DEPLOYMENT.md)
3. **Usar serviço PaaS** como Vercel ou Railway

---

## ✅ Checklist Deploy FTP

- [ ] Build local executado
- [ ] .env.production configurado
- [ ] Arquivos compactados
- [ ] Upload via FTP/SFTP concluído
- [ ] Dependências instaladas no servidor
- [ ] Aplicação iniciada com PM2
- [ ] Domínio configurado
- [ ] SSL ativo
- [ ] Teste de login realizado
