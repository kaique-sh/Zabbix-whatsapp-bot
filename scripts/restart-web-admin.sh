#!/bin/bash

# Script para reiniciar o painel web admin

echo "🔄 Reiniciando Painel Web Admin"
echo "=" $(printf "%0.s=" {1..35})

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Parar processo existente
echo "🛑 Parando processo existente..."
pm2 stop voetur-web-admin > /dev/null 2>&1 || true
pkill -f "node web-admin/server.js" > /dev/null 2>&1 || true

# Aguardar um momento
sleep 2

# Iniciar novamente
echo "🚀 Iniciando painel web..."
npm run web:start &
WEB_PID=$!

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 5

# Verificar se está rodando
if curl -s http://localhost:4000 > /dev/null; then
    echo "✅ Painel web iniciado com sucesso!"
    echo "🌐 Acesse: http://localhost:4000"
    echo "🔐 Login: admin / admin123"
    
    # Testar rotas de usuários
    echo ""
    echo "🧪 Testando rotas de usuários..."
    
    # Fazer login
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"admin","password":"admin123"}')
    
    if echo "$LOGIN_RESPONSE" | grep -q "token"; then
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        
        # Testar rota de usuários
        USERS_RESPONSE=$(curl -s http://localhost:4000/api/auth/users \
          -H "Authorization: Bearer $TOKEN")
        
        if echo "$USERS_RESPONSE" | grep -q "success"; then
            echo "✅ Rota /api/auth/users funcionando"
        else
            echo "❌ Erro na rota /api/auth/users"
            echo "📊 Resposta: $USERS_RESPONSE"
        fi
        
        # Testar página de usuários
        if curl -s http://localhost:4000/users.html | grep -q "Gerenciar Usuários"; then
            echo "✅ Página /users.html funcionando"
        else
            echo "❌ Erro na página /users.html"
        fi
        
    else
        echo "❌ Erro no login para teste"
    fi
    
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Acesse: http://localhost:4000/users.html"
    echo "2. Faça login: admin / admin123"
    echo "3. Teste o gerenciamento de usuários"
    
else
    echo "❌ Erro ao iniciar painel web"
    echo "📊 Verificando logs..."
    
    # Mostrar possíveis erros
    if [ ! -z "$WEB_PID" ]; then
        kill $WEB_PID > /dev/null 2>&1 || true
    fi
    
    echo "💡 Tente executar manualmente:"
    echo "   npm run web:start"
    exit 1
fi
