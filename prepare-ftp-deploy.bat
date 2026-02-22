@echo off
REM Sigma DOCs - Preparar Deploy FTP (Windows)
REM Execute este script no PowerShell ou CMD

echo ====================================
echo  Sigma DOCs - Preparando Deploy FTP
echo ====================================
echo.

REM Verificar se bun está instalado
where bun >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Erro: Bun nao encontrado!
    echo Instale em: https://bun.sh
    pause
    exit /b 1
)

REM Diretório de deploy
set DEPLOY_DIR=deploy-ftp

echo [1/6] Limpando builds anteriores...
if exist %DEPLOY_DIR% rmdir /s /q %DEPLOY_DIR%
if exist .next rmdir /s /q .next

echo [2/6] Instalando dependencias...
bun install

echo [3/6] Gerando Prisma Client...
bunx prisma generate

echo [4/6] Executando build de producao...
set NODE_ENV=production
bun run build

echo [5/6] Criando estrutura de diretorios...
mkdir %DEPLOY_DIR%
mkdir %DEPLOY_DIR%\data
mkdir %DEPLOY_DIR%\uploads\logos
mkdir %DEPLOY_DIR%\uploads\documents
mkdir %DEPLOY_DIR%\backups
mkdir %DEPLOY_DIR%\logs
mkdir %DEPLOY_DIR%\.next\static

echo [6/6] Copiando arquivos...

REM Copiar build standalone
xcopy /E /I /Y .next\standalone %DEPLOY_DIR%
xcopy /E /I /Y .next\static %DEPLOY_DIR%\.next\static

REM Copiar arquivos públicos
xcopy /E /I /Y public %DEPLOY_DIR%\public

REM Copiar Prisma
xcopy /E /I /Y prisma %DEPLOY_DIR%\prisma

REM Copiar configurações
copy /Y package.json %DEPLOY_DIR%\
copy /Y next.config.ts %DEPLOY_DIR%\

echo.
echo ====================================
echo  PACOTE CRIADO COM SUCESSO!
echo ====================================
echo.
echo Pasta de deploy: %DEPLOY_DIR%\
echo.
echo PROXIMOS PASSOS:
echo.
echo 1. Edite o arquivo .env.production na pasta %DEPLOY_DIR%
echo    - Configure NEXTAUTH_URL para seu dominio
echo    - Configure SMTP se desejar enviar emails
echo.
echo 2. Compacte a pasta deploy-ftp em um arquivo ZIP
echo.
echo 3. Faca upload via FTP para o servidor
echo.
echo 4. No servidor, execute os comandos de instalacao
echo.
echo Documentacao completa: DEPLOY-FTP-GUIA.md
echo.
pause
