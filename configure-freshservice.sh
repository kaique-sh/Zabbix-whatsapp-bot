#!/bin/bash

# Script para configurar Freshservice no bot WhatsApp
# Execute: bash configure-freshservice.sh

echo "================================================"
echo "🎫 Configuração do Freshservice"
echo "================================================"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "Criando arquivo .env..."
    touch .env
fi

echo "📋 Por favor, forneça as seguintes informações:"
echo ""

# Solicitar domínio
read -p "1️⃣  Domínio do Freshservice (ex: suaempresa.freshservice.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo "❌ Domínio não pode estar vazio!"
    exit 1
fi

# Solicitar API Key
read -p "2️⃣  API Key do Freshservice: " API_KEY
if [ -z "$API_KEY" ]; then
    echo "❌ API Key não pode estar vazia!"
    exit 1
fi

# Solicitar Workspace ID (opcional)
read -p "3️⃣  Workspace ID (deixe em branco se não for MSP): " WORKSPACE_ID

echo ""
echo "================================================"
echo "✅ Configurando Freshservice..."
echo "================================================"

# Verificar se já existe configuração do Freshservice
if grep -q "FRESHSERVICE_DOMAIN" .env; then
    echo "⚠️  Configuração do Freshservice já existe no .env"
    read -p "Deseja sobrescrever? (s/n): " OVERWRITE
    if [ "$OVERWRITE" != "s" ]; then
        echo "❌ Configuração cancelada"
        exit 0
    fi
    
    # Remover configurações antigas
    sed -i '/FRESHSERVICE_DOMAIN/d' .env
    sed -i '/FRESHSERVICE_API_KEY/d' .env
    sed -i '/FRESHSERVICE_WORKSPACE_ID/d' .env
fi

# Adicionar configurações ao .env
echo "" >> .env
echo "# Freshservice Configuration" >> .env
echo "FRESHSERVICE_DOMAIN=$DOMAIN" >> .env
echo "FRESHSERVICE_API_KEY=$API_KEY" >> .env
if [ ! -z "$WORKSPACE_ID" ]; then
    echo "FRESHSERVICE_WORKSPACE_ID=$WORKSPACE_ID" >> .env
else
    echo "FRESHSERVICE_WORKSPACE_ID=" >> .env
fi

echo ""
echo "✅ Configuração adicionada ao .env com sucesso!"
echo ""
echo "================================================"
echo "🔄 Reiniciando o bot..."
echo "================================================"

# Reiniciar o bot
pm2 restart nextbot-whatsapp-bot

echo ""
echo "✅ Bot reiniciado!"
echo ""
echo "================================================"
echo "🧪 Como testar:"
echo "================================================"
echo "1. Abra o WhatsApp"
echo "2. Envie para o bot: !atendimento"
echo "3. Descreva um problema de teste"
echo "4. Verifique se o ticket foi criado no Freshservice"
echo ""
echo "📋 Verificar logs:"
echo "   pm2 logs nextbot-whatsapp-bot --lines 50"
echo ""
echo "================================================"
echo "✅ Configuração concluída!"
echo "================================================"
