#!/bin/bash

# Script para iniciar o sistema completo (Bot + Painel Web)

echo "🚀 Iniciando Sistema Completo - Voetur Bot + Painel Web"
echo "=" $(printf "%0.s=" {1..55})

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar dependências"
        exit 1
    fi
fi

# Verificar se as dependências do painel web estão instaladas
echo "🔍 Verificando dependências do painel web..."
MISSING_DEPS=""

# Verificar cada dependência necessária
for dep in bcryptjs jsonwebtoken express-rate-limit helmet cors socket.io sqlite3; do
    if ! npm list $dep > /dev/null 2>&1; then
        MISSING_DEPS="$MISSING_DEPS $dep"
    fi
done

if [ ! -z "$MISSING_DEPS" ]; then
    echo "📦 Instalando dependências faltantes do painel web:$MISSING_DEPS"
    bash scripts/install-dependencies.sh
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar dependências do painel web"
        exit 1
    fi
fi

# Validar configuração
echo "⚙️ Validando configuração..."
npm run validate
if [ $? -ne 0 ]; then
    echo "❌ Configuração inválida. Execute 'npm run setup' primeiro"
    exit 1
fi

# Criar diretório de logs
echo "📁 Criando diretório de logs..."
npm run logs:create

# Parar processos existentes (se houver)
echo "🔄 Parando processos existentes..."
pm2 delete all > /dev/null 2>&1 || true

# Iniciar sistema completo com PM2
echo "🚀 Iniciando sistema completo..."
pm2 start ecosystem.config.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Sistema iniciado com sucesso!"
    echo ""
    echo "📊 Status dos serviços:"
    pm2 status
    echo ""
    echo "🌐 URLs disponíveis:"
    echo "• Bot API: http://localhost:3000"
    echo "• Painel Web: http://localhost:4000"
    echo "• Health Check: http://localhost:3000/health"
    echo ""
    echo "🔐 Acesso ao Painel Web:"
    echo "• URL: http://localhost:4000"
    echo "• Login: admin"
    echo "• Senha: admin123"
    echo "• ⚠️  ALTERE A SENHA APÓS O PRIMEIRO LOGIN!"
    echo ""
    echo "📋 Comandos úteis:"
    echo "• pm2 status           # Ver status dos serviços"
    echo "• pm2 logs             # Ver todos os logs"
    echo "• pm2 logs zabbix-whatsapp-bot  # Logs do bot"
    echo "• pm2 logs voetur-web-admin     # Logs do painel web"
    echo "• pm2 monit            # Monitor em tempo real"
    echo "• pm2 restart all      # Reiniciar todos os serviços"
    echo "• pm2 stop all         # Parar todos os serviços"
    echo ""
    echo "🎯 Próximos passos:"
    echo "1. Acesse o painel web: http://localhost:4000"
    echo "2. Faça login com admin/admin123"
    echo "3. Altere a senha padrão"
    echo "4. Configure o bot através do painel"
    echo "5. Teste os comandos no WhatsApp"
else
    echo "❌ Erro ao iniciar o sistema"
    echo "📋 Verificar logs:"
    echo "• pm2 logs"
    echo "• cat logs/*.log"
    exit 1
fi
