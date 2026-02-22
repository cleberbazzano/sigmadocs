# 🔧 Diagnóstico de Problemas - Sigma DOCs na Locaweb

## ❌ Erro: "Desculpe, houve um problema ao implantar o código"

Este erro indica que houve uma falha durante o deploy. Veja como resolver:

---

## 📋 Checklist de Verificação

### 1. Verificar Requisitos da Hospedagem

**A Locaweb suporta Node.js?**

A maioria das hospedagens compartilhadas da Locaweb **NÃO suporta Node.js**.

| Tipo de Hospedagem | Suporta Node.js? |
|-------------------|------------------|
| Hospedagem Compartilhada | ❌ NÃO |
| Cloud Sites | ❌ NÃO |
| Cloud Server Pro | ✅ SIM |
| VPS | ✅ SIM |

**Se você tem hospedagem compartilhada**, precisará:
- Migrar para **Cloud Server Pro** ou **VPS**
- Ou usar o Docker (se tiver acesso SSH)

---

## 🔍 Diagnóstico Passo a Passo

### Passo 1: Verificar Tipo de Hospedagem

1. Acesse o painel: https://painel.locaweb.com.br
2. Veja qual produto você contratou
3. Se for "Hospedagem de Sites" ou "Cloud Sites", **NÃO funcionará**

### Passo 2: Verificar se Node.js Está Disponível

No painel da Locaweb:
1. Procure por **"Node.js"** ou **"Aplicações"**
2. Se não encontrar, sua hospedagem não suporta

### Passo 3: Verificar Logs de Erro

Se tiver acesso SSH:
```bash
# Ver logs do PM2
pm2 logs

# Ver logs do sistema
tail -f /var/log/syslog
```

---

## ✅ Soluções Possíveis

### Solução A: Usar Docker (Cloud Server / VPS)

Se você tem Cloud Server ou VPS:

```bash
# No servidor
cd /var/www/sigmadocs
docker compose up -d --build
docker compose logs -f
```

### Solução B: Usar PM2 (Cloud Server / VPS)

```bash
# No servidor
cd /var/www/sigmadocs
npm install
npx prisma generate
npm run build
pm2 start server.js --name sigmadocs
pm2 save
```

### Solução C: Migrar para VPS/Cloud Server

1. No painel da Locaweb, contrate **Cloud Server Pro**
2. Mínimo recomendado: 2GB RAM
3. Sistema operacional: Ubuntu 22.04
4. Siga o guia `DEPLOY-LOCAWEB.md`

---

## 🚀 Deploy Simplificado

Criei um script único que prepara tudo:

```bash
# 1. Executar o script de build
chmod +x build-production.sh
./build-production.sh
```

---

## 📞 Contato Locaweb

Se não conseguir resolver, contate a Locaweb:

- **Telefone**: 4003-9450 (capitais)
- **Telefone**: 0800-887-9450 (demais localidades)
- **Chat**: Painel de controle
- **Pergunte**: "Minha hospedagem suporta Node.js?"

---

## ❓ Perguntas Frequentes

### "O sistema não abre após upload"
- Verifique se a hospedagem suporta Node.js
- Verifique se o build foi feito corretamente
- Verifique os logs de erro

### "Erro 500 ao acessar"
- Verifique o arquivo `.env.production`
- Verifique se o banco de dados foi criado
- Verifique as permissões de arquivo

### "Tela em branco"
- Verifique se a pasta `.next` foi enviada
- Verifique se o Node.js está rodando
- Verifique os logs do navegador (F12)

---

## 🔄 Reconstruir o Projeto

Para garantir que tudo está correto:

```bash
# Limpar tudo
rm -rf .next node_modules deploy-ftp

# Reinstalar
bun install

# Reconstruir
bun run build

# Preparar deploy
./prepare-ftp-deploy.sh
```
