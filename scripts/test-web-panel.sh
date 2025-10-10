#!/bin/bash

# Script para testar o painel web

echo "🧪 Testando Painel Web - Voetur Bot"
echo "=" $(printf "%0.s=" {1..40})

# Verificar se o painel está rodando
echo "1. Verificando se o painel web está rodando..."
if curl -s http://localhost:4000 > /dev/null; then
    echo "✅ Painel web está acessível em http://localhost:4000"
else
    echo "❌ Painel web não está acessível"
    echo "💡 Tente iniciar com: npm run web:start"
    exit 1
fi

# Testar login
echo ""
echo "2. Testando endpoint de login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ Endpoint de login funcionando"
    
    # Extrair token (método simples)
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$TOKEN" ]; then
        echo "✅ Token obtido com sucesso"
        
        # Testar status do bot
        echo ""
        echo "3. Testando status do bot..."
        STATUS_RESPONSE=$(curl -s http://localhost:4000/api/bot/status \
          -H "Authorization: Bearer $TOKEN")
        
        if echo "$STATUS_RESPONSE" | grep -q "success"; then
            echo "✅ Endpoint de status funcionando"
            echo "📊 Resposta: $STATUS_RESPONSE"
        else
            echo "❌ Endpoint de status com problema"
            echo "📊 Resposta: $STATUS_RESPONSE"
        fi
        
        # Testar debug
        echo ""
        echo "4. Testando debug do sistema..."
        DEBUG_RESPONSE=$(curl -s http://localhost:4000/api/bot/debug \
          -H "Authorization: Bearer $TOKEN")
        
        if echo "$DEBUG_RESPONSE" | grep -q "success"; then
            echo "✅ Endpoint de debug funcionando"
            echo "📊 PM2 disponível: $(echo "$DEBUG_RESPONSE" | grep -o '"pm2_available":[^,]*' | cut -d':' -f2)"
        else
            echo "❌ Endpoint de debug com problema"
            echo "📊 Resposta: $DEBUG_RESPONSE"
        fi
        
    else
        echo "❌ Não foi possível extrair o token"
    fi
else
    echo "❌ Endpoint de login com problema"
    echo "📊 Resposta: $LOGIN_RESPONSE"
fi

echo ""
echo "5. Verificando processos PM2..."
if command -v pm2 >/dev/null 2>&1; then
    echo "✅ PM2 instalado"
    pm2 list
else
    echo "❌ PM2 não encontrado"
    echo "💡 Instale com: npm install -g pm2"
fi

echo ""
echo "🎯 Resumo do Teste:"
echo "• Painel Web: http://localhost:4000"
echo "• Login: admin / admin123"
echo "• Para testar manualmente:"
echo "  1. Abra http://localhost:4000 no navegador"
echo "  2. Faça login com admin/admin123"
echo "  3. Clique no botão 'Debug API'"
echo "  4. Abra o console do navegador (F12)"
echo "  5. Teste os botões de controle do bot"

echo ""
echo "📋 Se houver problemas:"
echo "• Reiniciar painel: pm2 restart voetur-web-admin"
echo "• Ver logs: pm2 logs voetur-web-admin"
echo "• Iniciar sistema completo: npm run start:complete"
