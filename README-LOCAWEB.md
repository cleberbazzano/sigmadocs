# Sigma DOCs - Deploy na Locaweb (Resumo Rápido)

## ⚡ Início Rápido

### 1. Configurar para seu domínio
```bash
chmod +x configurar-locaweb.sh
./configurar-locaweb.sh
```
Digite seu domínio quando solicitado.

### 2. Preparar pacote para upload
```bash
./prepare-ftp-deploy.sh
```

### 3. Fazer upload via FTP
- Use FileZilla ou WinSCP
- Envie a pasta `deploy-ftp` para o servidor

### 4. Configurar na Locaweb
No painel da Locaweb:
- Ative Node.js
- Configure o diretório
- Ative SSL

---

## 📁 Arquivos Importantes

| Arquivo | Função |
|---------|--------|
| `.env.production` | Configurações do sistema |
| `server.js` | Servidor Node.js |
| `.htaccess` | Redirecionamento Apache |
| `install.sh` | Script de instalação |

---

## 🔧 Configuração do Domínio

### No Painel da Locaweb

1. **DNS**: Aponte o domínio para o servidor
2. **Node.js**: Ative o suporte a Node.js
3. **SSL**: Ative o certificado SSL

### No Arquivo .env.production

```env
NEXTAUTH_URL=https://seu-dominio.com.br
```

---

## 📤 Upload via FileZilla

1. **Host**: ftp.seu-dominio.com.br
2. **Usuário**: (fornecido pela Locaweb)
3. **Senha**: (fornecida pela Locaweb)
4. **Porta**: 21

Arraste os arquivos da pasta `deploy-ftp` para:
- `/public_html/` ou
- Diretório configurado no painel

---

## 🚀 Iniciar a Aplicação

### Com SSH
```bash
cd /caminho/para/sigmadocs
chmod +x install.sh
./install.sh
```

### Sem SSH
No painel da Locaweb:
- Configure o comando de início: `node server.js`
- Defina a porta: 3000

---

## ✅ Verificar

Acesse: `https://seu-dominio.com.br`

**Login padrão:**
- Email: admin@sigmadocs.com.br
- Senha: admin123

⚠️ **ALTERE A SENHA APÓS O PRIMEIRO LOGIN!**

---

## 🔧 Problemas Comuns

### Tela em branco / Erro 500
1. Verifique se Node.js está ativo
2. Verifique o arquivo `.env.production`
3. Contate o suporte da Locaweb

### Logo não aparece
- Verifique se a pasta `public` foi enviada
- Verifique as permissões de arquivo

### SSL não funciona
- Aguarde a propagação (até 48h)
- Contate a Locaweb para ativar

---

## 📞 Suporte

**Locaweb:**
- Painel: https://painel.locaweb.com.br
- Telefone: 4003-9450
- Chat: Disponível no painel

---

## 📚 Documentação Completa

- `CONFIGURACAO-LOCAWEB.md` - Configuração detalhada
- `DEPLOY-FTP-GUIA.md` - Guia de upload FTP
- `DEPLOY-LOCAWEB.md` - Todas as opções de hospedagem
