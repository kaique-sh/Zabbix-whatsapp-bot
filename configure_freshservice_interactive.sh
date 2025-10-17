#\!/bin/bash
echo "🎫 Configuração Interativa do Freshservice"
echo "=========================================="

# Solicitar domínio
echo -n "Digite o domínio do Freshservice (ex: suaempresa.freshservice.com): "
read FRESHSERVICE_DOMAIN

# Solicitar API Key
echo -n "Digite sua API Key do Freshservice: "
read FRESHSERVICE_API_KEY

# Solicitar Workspace ID (opcional)
echo -n "Digite o Workspace ID (deixe em branco se não usar MSP): "
read FRESHSERVICE_WORKSPACE_ID

# Atualizar .env
sed -i '/^FRESHSERVICE_DOMAIN=/d' .env
sed -i '/^FRESHSERVICE_API_KEY=/d' .env
sed -i '/^FRESHSERVICE_WORKSPACE_ID=/d' .env

echo "FRESHSERVICE_DOMAIN=$FRESHSERVICE_DOMAIN" >> .env
echo "FRESHSERVICE_API_KEY=$FRESHSERVICE_API_KEY" >> .env
echo "FRESHSERVICE_WORKSPACE_ID=$FRESHSERVICE_WORKSPACE_ID" >> .env

echo "✅ Configuração salva no arquivo .env"
echo "🔄 Reiniciando o bot..."

# Reiniciar o bot
pm2 restart nextbot-whatsapp-bot 2>/dev/null || echo "Certifique-se de que o PM2 está instalado e o bot está rodando"

echo "🎉 Pronto\! Sistema de atendimento ativado."
echo "📱 Teste enviando '\!atendimento' no WhatsApp"
