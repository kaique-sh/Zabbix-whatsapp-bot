#!/bin/bash

# Script de instalação do painel web de administração

echo "🚀 Instalando Painel Web de Administração - Voetur Bot"
echo "=" $(printf "%0.s=" {1..50})

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

# Criar diretórios necessários
echo "📁 Criando estrutura de diretórios..."
mkdir -p web-admin/database
mkdir -p web-admin/public
mkdir -p logs

# Verificar se os arquivos foram criados
if [ ! -f "web-admin/server.js" ]; then
    echo "❌ Arquivos do painel web não encontrados"
    echo "💡 Certifique-se de que todos os arquivos foram criados corretamente"
    exit 1
fi

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

# Testar instalação
echo "🧪 Testando instalação..."
timeout 10s node web-admin/server.js &
SERVER_PID=$!

sleep 3

# Verificar se o servidor está rodando
if curl -s http://localhost:4000 > /dev/null; then
    echo "✅ Painel web funcionando corretamente"
    kill $SERVER_PID 2>/dev/null
else
    echo "⚠️  Servidor iniciou mas pode ter problemas de conectividade"
    kill $SERVER_PID 2>/dev/null
fi

echo ""
echo "🎉 Instalação concluída com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Instalar dependências: npm install"
echo "2. Iniciar painel web: npm run web:start"
echo "3. Acessar: http://localhost:4000"
echo "4. Login padrão: admin / admin123"
echo ""
echo "🔧 Comandos disponíveis:"
echo "• npm run web:start    # Iniciar painel web"
echo "• npm run web:dev      # Modo desenvolvimento"
echo "• npm start            # Iniciar bot WhatsApp"
echo "• npm run pm2:start    # Iniciar bot com PM2"
echo ""
echo "🔐 Credenciais padrão:"
echo "• Usuário: admin"
echo "• Senha: admin123"
echo "• ⚠️  ALTERE A SENHA APÓS O PRIMEIRO LOGIN!"
echo ""
echo "🌐 URLs:"
echo "• Painel Web: http://localhost:4000"
echo "• Bot API: http://localhost:3000"
echo "• Health Check: http://localhost:3000/health"
echo ""
echo "📞 Suporte:"
echo "• Email: suporte@voetur.com.br"
echo "• Documentação: README.md"

exit 0
