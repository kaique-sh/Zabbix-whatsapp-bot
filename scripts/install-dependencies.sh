#!/bin/bash

# Script para instalar dependências do painel web

echo "🚀 Instalando Dependências do Painel Web"
echo "=" $(printf "%0.s=" {1..40})

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Instalar dependências básicas primeiro
echo "📦 Instalando dependências básicas..."
npm install bcryptjs@2.4.3 --save

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar bcryptjs"
    exit 1
fi

npm install jsonwebtoken@9.0.2 --save

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar jsonwebtoken"
    exit 1
fi

npm install express-rate-limit@6.10.0 --save

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar express-rate-limit"
    exit 1
fi

npm install helmet@7.0.0 --save

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar helmet"
    exit 1
fi

npm install cors@2.8.5 --save

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar cors"
    exit 1
fi

npm install socket.io@4.7.2 --save

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar socket.io"
    exit 1
fi

npm install sqlite3@5.1.6 --save

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar sqlite3"
    exit 1
fi

echo "✅ Todas as dependências instaladas com sucesso!"

# Criar diretórios necessários
echo "📁 Criando estrutura de diretórios..."
mkdir -p web-admin/database
mkdir -p web-admin/public
mkdir -p logs

# Configurar variáveis de ambiente
echo "⚙️ Configurando variáveis de ambiente..."

# Adicionar configurações do painel web ao .env se não existirem
if [ -f ".env" ]; then
    if ! grep -q "WEB_ADMIN_PORT" .env; then
        echo "" >> .env
        echo "# Painel Web de Administração" >> .env
        echo "WEB_ADMIN_PORT=4000" >> .env
        echo "JWT_SECRET=voetur-whatsapp-bot-secret-$(date +%s)" >> .env
        echo "✅ Configurações adicionadas ao .env"
    else
        echo "✅ Configurações já existem no .env"
    fi
else
    echo "⚠️  Arquivo .env não encontrado. Criando..."
    cat > .env << EOF
# Configurações do Bot WhatsApp
PORT=3000
GROUP_ID=
API_TOKEN=
ASSISTANT_DISPLAY_NAME=Voetur Assistente
COMPANY_NAME=Voetur
CONTACT_NAME=Voetur Bot

# Painel Web de Administração
WEB_ADMIN_PORT=4000
JWT_SECRET=voetur-whatsapp-bot-secret-$(date +%s)
EOF
    echo "✅ Arquivo .env criado"
fi

echo ""
echo "🎉 Instalação concluída com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Iniciar painel web: npm run web:start"
echo "2. Acessar: http://localhost:4000"
echo "3. Login padrão: admin / admin123"
echo ""
echo "🔧 Comandos disponíveis:"
echo "• npm run web:start    # Iniciar painel web"
echo "• npm run web:dev      # Modo desenvolvimento"
echo "• npm run test:web     # Testar funcionalidades"
echo ""
echo "🔐 Credenciais padrão:"
echo "• Usuário: admin"
echo "• Senha: admin123"
echo "• ⚠️  ALTERE A SENHA APÓS O PRIMEIRO LOGIN!"

exit 0
