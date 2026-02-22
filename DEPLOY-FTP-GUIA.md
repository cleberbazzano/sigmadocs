# Sigma DOCs - Deploy via FTP/SFTP (Guia Completo)

## 📋 Pré-requisitos no Servidor

Antes de começar, verifique com o suporte da Locaweb se sua hospedagem possui:

- ✅ **Node.js 18+** instalado
- ✅ **Acesso SSH** (recomendado) ou painel de controle
- ✅ **Porta 3000** disponível ou proxy reverso configurado

⚠️ **Se sua hospedagem NÃO suporta Node.js**, você precisará migrar para um plano que suporte (Cloud Server ou VPS).

---

## 🚀 Passo 1: Preparar o Pacote Localmente

### 1.1 Execute o script de preparação

Na sua máquina local, execute:

```bash
# Dar permissão ao script
chmod +x prepare-ftp-deploy.sh

# Executar
./prepare-ftp-deploy.sh
```

### 1.2 Configure o ambiente de produção

Edite o arquivo `deploy-ftp/.env.production` com suas configurações:

```env
# IMPORTANTE: Altere para seu domínio!
DATABASE_URL=file:./data/sigmadocs.db
NEXTAUTH_URL=https://seu-dominio.com.br
NEXTAUTH_SECRET=cole-aqui-um-secret-gerado

# Email (opcional)
SMTP_HOST=smtp.seu-servidor.com
SMTP_PORT=587
SMTP_USER=seu-email
SMTP_PASS=sua-senha
```

Para gerar o NEXTAUTH_SECRET, execute:
```bash
openssl rand -base64 32
```

---

## 📁 Passo 2: Criar Pacote para Upload

### Windows (PowerShell)

```powershell
# Após executar o prepare-ftp-deploy.sh
Compress-Archive -Path deploy-ftp -DestinationPath sigmadocs.zip
```

### Linux/Mac

```bash
# Criar arquivo zip
cd deploy-ftp
zip -r ../sigmadocs.zip .
cd ..
```

---

## 📤 Passo 3: Upload via FTP/SFTP

### 3.1 Usando FileZilla (Windows/Mac/Linux)

1. **Baixe o FileZilla**: https://filezilla-project.org/download.php

2. **Conecte ao servidor**:
   - Host: `ftp.seu-dominio.com.br` ou IP do servidor
   - Usuário: (fornecido pela Locaweb)
   - Senha: (fornecida pela Locaweb)
   - Porta: `21` (FTP) ou `22` (SFTP)

3. **Navegue até o diretório do site**:
   - Geralmente: `/public_html/` ou `/www/`

4. **Faça upload**:
   - Crie uma pasta `sigmadocs` no servidor
   - Arraste todos os arquivos da pasta `deploy-ftp` para esta pasta

### 3.2 Usando WinSCP (Windows)

1. Baixe: https://winscp.net/
2. Conecte ao servidor
3. Arraste os arquivos para o diretório do site

### 3.3 Usando SCP (Linha de comando)

```bash
scp -r deploy-ftp/* usuario@seu-servidor:/caminho/do/diretorio/
```

---

## 🔧 Passo 4: Configurar no Servidor

### 4.1 Se tiver acesso SSH

```bash
# Conectar ao servidor
ssh usuario@seu-servidor

# Navegar até o diretório do app
cd /caminho/para/sigmadocs

# Instalar dependências (se não subiu node_modules)
npm install --production

# Gerar Prisma Client
npx prisma generate

# Inicializar banco de dados
npx prisma db push

# Instalar PM2 (gerenciador de processos)
npm install -g pm2

# Iniciar aplicação
pm2 start server.js --name sigmadocs

# Salvar configuração
pm2 save

# Configurar para iniciar automaticamente
pm2 startup
```

### 4.2 Se NÃO tiver acesso SSH

Use o painel de controle da Locaweb:

1. Acesse o painel da Locaweb
2. Procure por "Node.js" ou "Aplicação"
3. Configure:
   - Diretório: `/sigmadocs`
   - Comando de início: `npm start`
   - Porta: `3000`

---

## 🌐 Passo 5: Configurar Domínio

### 5.1 Painel da Locaweb

1. Acesse **Domínios** no painel
2. Selecione seu domínio
3. Configure para apontar para a pasta do app

### 5.2 Se necessário configurar Proxy Reverso

Crie um arquivo `.htaccess` na raiz do site:

```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

---

## 🔒 Passo 6: Configurar SSL (HTTPS)

### Opção A: SSL Gratuito da Locaweb

1. No painel da Locaweb, acesse **SSL**
2. Ative o **SSL Gratuito (Let's Encrypt)**
3. Aguarde a ativação (pode levar algumas horas)

### Opção B: SSL Pago

1. Compre um certificado SSL
2. Instale seguindo as instruções da Locaweb

---

## ✅ Passo 7: Testar

1. Acesse: `https://seu-dominio.com.br`
2. Faça login com:
   - Email: `admin@sigmadocs.com.br`
   - Senha: `admin123`
3. **ALTERE A SENHA IMEDIATAMENTE!**
4. Cadastre os dados da empresa

---

## 🔄 Atualizações Futuras

Para atualizar o sistema:

1. Execute localmente:
   ```bash
   git pull
   npm run build
   ```

2. Crie novo pacote:
   ```bash
   ./prepare-ftp-deploy.sh
   ```

3. Faça upload dos novos arquivos via FTP

4. Reinicie a aplicação:
   ```bash
   pm2 restart sigmadocs
   ```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `pm2 logs sigmadocs`
2. Contate o suporte da Locaweb
3. Verifique se o Node.js está instalado corretamente

---

## 📋 Checklist Final

- [ ] Script de preparação executado
- [ ] .env.production configurado
- [ ] Arquivos compactados
- [ ] Upload via FTP concluído
- [ ] Dependências instaladas
- [ ] Banco de dados inicializado
- [ ] Aplicação iniciada
- [ ] Domínio configurado
- [ ] SSL ativo
- [ ] Login testado
- [ ] Senha do admin alterada
- [ ] Dados da empresa cadastrados
