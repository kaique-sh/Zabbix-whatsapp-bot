#!/bin/bash
# Script de deploy para servidor 10.168.217.43
# Executa: bash scripts/deploy-server.sh

set -e

echo "🚀 Deploy do Zabbix WhatsApp Bot - Servidor"
echo "=========================================="

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado"
    echo "📋 Criando a partir do template..."
    cp env-production-template.txt .env
    echo "✅ Arquivo .env criado. Configure as variáveis necessárias:"
    echo "   - GROUP_ID"
    echo "   - API_TOKEN"
    echo ""
    echo "Execute: nano .env"
    exit 1
fi

# Validar configuração
echo "🔍 Validando configuração..."
npm run validate

# Instalar dependências
echo "📦 Instalando dependências..."
npm install --production

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p logs
mkdir -p wwebjs_auth

# Parar serviços existentes (se houver)
echo "🛑 Parando serviços existentes..."
npm run pm2:stop 2>/dev/null || true
npm run pm2:delete 2>/dev/null || true

# Limpar cache antigo
echo "🧹 Limpando cache..."
rm -rf .wwebjs_cache

# Testar conectividade
echo "🧪 Testando conectividade..."
npm run test:server

# Iniciar com PM2
echo "🚀 Iniciando serviço com PM2..."
npm run pm2:start

# Aguardar inicialização
echo "⏳ Aguardando inicialização (30s)..."
sleep 30

# Teste final
echo "✅ Teste final..."
npm run test:health

echo ""
echo "🎉 Deploy concluído com sucesso!"
echo ""
echo "📊 Comandos úteis:"
echo "  npm run pm2:logs     # Ver logs"
echo "  npm run pm2:monit    # Monitoramento"
echo "  npm run pm2:restart  # Reiniciar"
echo "  npm run test:server  # Testar conectividade"
echo ""
echo "🔗 Endpoints:"
echo "  Health: http://10.168.217.43:3000/health"
echo "  Zabbix: http://10.168.217.43:3000/zabbix"
