#\!/bin/bash

# Script para iniciar o bot WhatsApp com variáveis de ambiente
echo "🚀 Iniciando Voetur WhatsApp Bot..."

# Definir variáveis de ambiente
export FRESHSERVICE_DOMAIN="voetur1.freshservice.com"
export FRESHSERVICE_API_KEY="mOIDpHLZY1EITgT0Rfnh"
export FRESHSERVICE_WORKSPACE_ID="18"

echo "✅ Variáveis de ambiente configuradas"
echo "🔗 Freshservice Domain: $FRESHSERVICE_DOMAIN"
echo "🔑 Freshservice API Key: $(echo $FRESHSERVICE_API_KEY | cut -c1-10)..."

# Iniciar o bot
exec pm2 start ecosystem.config.js --name nextbot-whatsapp-bot
