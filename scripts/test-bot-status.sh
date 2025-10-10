#!/bin/bash

# Script de teste completo para funções de status do bot
# Testa todas as APIs relacionadas ao controle e monitoramento do bot

echo "🧪 Testando Funções de Status do Bot - Voetur WhatsApp Bot"
echo "================================================================"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script no diretório raiz do projeto${NC}"
    exit 1
fi

# Função para fazer login e obter token
get_token() {
    echo -e "\n${BLUE}🔐 Fazendo login...${NC}"
    RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin123"}')
    
    TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ Falha no login${NC}"
        echo "Resposta: $RESPONSE"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Login realizado com sucesso${NC}"
    echo "Token: ${TOKEN:0:20}..."
}

# Função para testar endpoint
test_endpoint() {
    local METHOD=$1
    local ENDPOINT=$2
    local DESCRIPTION=$3
    
    echo -e "\n${YELLOW}📡 Testando: $DESCRIPTION${NC}"
    echo "Endpoint: $METHOD $ENDPOINT"
    
    if [ "$METHOD" = "GET" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:4000$ENDPOINT \
            -H "Authorization: Bearer $TOKEN")
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X $METHOD http://localhost:4000$ENDPOINT \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    echo "Status HTTP: $HTTP_CODE"
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Sucesso${NC}"
        echo "Resposta: $(echo $BODY | head -c 200)..."
        
        # Verificar se é JSON válido
        if echo "$BODY" | jq . > /dev/null 2>&1; then
            SUCCESS=$(echo "$BODY" | jq -r '.success')
            if [ "$SUCCESS" = "true" ]; then
                echo -e "${GREEN}✅ API retornou success: true${NC}"
            else
                echo -e "${YELLOW}⚠️  API retornou success: false${NC}"
                MESSAGE=$(echo "$BODY" | jq -r '.message')
                echo "Mensagem: $MESSAGE"
            fi
        fi
    else
        echo -e "${RED}❌ Falha (HTTP $HTTP_CODE)${NC}"
        echo "Resposta: $BODY"
    fi
}

# Obter token de autenticação
get_token

echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}         TESTANDO APIS DE STATUS DO BOT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

# Teste 1: Verificar status do bot
test_endpoint "GET" "/api/bot/status" "Status do Bot"

# Teste 2: Verificar health check
test_endpoint "GET" "/api/bot/health" "Health Check do Sistema"

# Teste 3: Verificar estatísticas
test_endpoint "GET" "/api/bot/stats" "Estatísticas do Bot"

# Teste 4: Verificar logs
test_endpoint "GET" "/api/bot/logs?lines=10" "Logs do Bot (10 linhas)"

# Teste 5: Verificar debug info
test_endpoint "GET" "/api/bot/debug" "Informações de Debug"

echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}         TESTANDO CONTROLES DO BOT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

# Perguntar se deseja testar controles (start/stop/restart)
echo -e "\n${YELLOW}⚠️  Os próximos testes irão controlar o bot (start/stop/restart)${NC}"
read -p "Deseja continuar? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    # Teste 6: Parar bot
    test_endpoint "POST" "/api/bot/stop" "Parar Bot"
    sleep 3
    
    # Verificar status após parar
    test_endpoint "GET" "/api/bot/status" "Status após Parar"
    sleep 2
    
    # Teste 7: Iniciar bot
    test_endpoint "POST" "/api/bot/start" "Iniciar Bot"
    sleep 3
    
    # Verificar status após iniciar
    test_endpoint "GET" "/api/bot/status" "Status após Iniciar"
    sleep 2
    
    # Teste 8: Reiniciar bot
    test_endpoint "POST" "/api/bot/restart" "Reiniciar Bot"
    sleep 3
    
    # Verificar status após reiniciar
    test_endpoint "GET" "/api/bot/status" "Status após Reiniciar"
else
    echo -e "${YELLOW}⏭️  Pulando testes de controle${NC}"
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}         VERIFICANDO PROCESSOS PM2${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}📊 Processos PM2 ativos:${NC}"
pm2 list

echo -e "\n${YELLOW}📈 Monitoramento PM2:${NC}"
pm2 jlist | jq '.[] | select(.name=="voetur-whatsapp-bot" or .name=="voetur-web-admin") | {name, status: .pm2_env.status, pid, uptime: .pm2_env.pm_uptime, restarts: .pm2_env.restart_time, memory: .monit.memory, cpu: .monit.cpu}'

echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}         TESTES CONCLUÍDOS${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"

echo -e "\n📋 Resumo:"
echo "• Todas as APIs de status foram testadas"
echo "• Verifique os resultados acima para identificar problemas"
echo "• Logs detalhados disponíveis no console"

echo -e "\n💡 Dicas:"
echo "• Use 'pm2 logs voetur-whatsapp-bot' para ver logs em tempo real"
echo "• Use 'pm2 monit' para monitoramento interativo"
echo "• Acesse http://localhost:4000 para o painel web"

echo ""
