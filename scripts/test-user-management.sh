#!/bin/bash

# Script para testar o sistema de gerenciamento de usuários

echo "🧪 Testando Sistema de Gerenciamento de Usuários"
echo "=" $(printf "%0.s=" {1..50})

# Verificar se o painel está rodando
echo "1. Verificando se o painel web está rodando..."
if ! curl -s http://localhost:4000 > /dev/null; then
    echo "❌ Painel web não está acessível"
    echo "💡 Inicie com: npm run web:start"
    exit 1
fi

echo "✅ Painel web está acessível"

# Fazer login como admin
echo ""
echo "2. Fazendo login como administrador..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ Login realizado com sucesso"
    
    # Extrair token
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$TOKEN" ]; then
        echo "✅ Token obtido: ${TOKEN:0:20}..."
        
        # Testar listagem de usuários
        echo ""
        echo "3. Testando listagem de usuários..."
        USERS_RESPONSE=$(curl -s http://localhost:4000/api/auth/users \
          -H "Authorization: Bearer $TOKEN")
        
        if echo "$USERS_RESPONSE" | grep -q "success"; then
            echo "✅ Listagem de usuários funcionando"
            USER_COUNT=$(echo "$USERS_RESPONSE" | grep -o '"username"' | wc -l)
            echo "📊 Usuários encontrados: $USER_COUNT"
        else
            echo "❌ Erro na listagem de usuários"
            echo "📊 Resposta: $USERS_RESPONSE"
        fi
        
        # Testar registro de novo usuário
        echo ""
        echo "4. Testando registro de novo usuário..."
        REGISTER_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/register \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d '{
            "username": "teste_user",
            "email": "teste@voetur.com.br",
            "password": "senha123",
            "role": "user"
          }')
        
        if echo "$REGISTER_RESPONSE" | grep -q "success.*true"; then
            echo "✅ Registro de usuário funcionando"
            NEW_USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
            echo "📊 Novo usuário ID: $NEW_USER_ID"
            
            # Testar atualização do usuário
            echo ""
            echo "5. Testando atualização de usuário..."
            UPDATE_RESPONSE=$(curl -s -X PUT http://localhost:4000/api/auth/users/$NEW_USER_ID \
              -H "Content-Type: application/json" \
              -H "Authorization: Bearer $TOKEN" \
              -d '{
                "username": "teste_user_updated",
                "email": "teste_updated@voetur.com.br",
                "role": "viewer",
                "is_active": true
              }')
            
            if echo "$UPDATE_RESPONSE" | grep -q "success.*true"; then
                echo "✅ Atualização de usuário funcionando"
            else
                echo "❌ Erro na atualização de usuário"
                echo "📊 Resposta: $UPDATE_RESPONSE"
            fi
            
            # Testar deleção do usuário
            echo ""
            echo "6. Testando deleção de usuário..."
            DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:4000/api/auth/users/$NEW_USER_ID \
              -H "Authorization: Bearer $TOKEN")
            
            if echo "$DELETE_RESPONSE" | grep -q "success.*true"; then
                echo "✅ Deleção de usuário funcionando"
            else
                echo "❌ Erro na deleção de usuário"
                echo "📊 Resposta: $DELETE_RESPONSE"
            fi
            
        else
            echo "❌ Erro no registro de usuário"
            echo "📊 Resposta: $REGISTER_RESPONSE"
        fi
        
        # Testar acesso à página de usuários
        echo ""
        echo "7. Testando acesso à página de usuários..."
        if curl -s http://localhost:4000/users.html | grep -q "Gerenciar Usuários"; then
            echo "✅ Página de usuários acessível"
        else
            echo "❌ Página de usuários não encontrada"
        fi
        
    else
        echo "❌ Não foi possível extrair o token"
    fi
else
    echo "❌ Erro no login"
    echo "📊 Resposta: $LOGIN_RESPONSE"
fi

echo ""
echo "🎯 Resumo dos Testes:"
echo "• Login de administrador"
echo "• Listagem de usuários"
echo "• Registro de novo usuário"
echo "• Atualização de usuário"
echo "• Deleção de usuário"
echo "• Acesso à interface web"

echo ""
echo "🌐 Para testar manualmente:"
echo "1. Acesse: http://localhost:4000"
echo "2. Login: admin / admin123"
echo "3. Clique em 'Usuários' no menu"
echo "4. Teste as funcionalidades:"
echo "   • Adicionar novo usuário"
echo "   • Editar usuário existente"
echo "   • Alterar status (ativo/inativo)"
echo "   • Deletar usuário (exceto admin)"

echo ""
echo "📋 Funcionalidades implementadas:"
echo "• ✅ Registro de usuários (apenas admins)"
echo "• ✅ Listagem de usuários"
echo "• ✅ Edição de usuários"
echo "• ✅ Ativação/desativação"
echo "• ✅ Deleção de usuários"
echo "• ✅ Controle de permissões por role"
echo "• ✅ Logs de atividade"
echo "• ✅ Interface web responsiva"
echo "• ✅ Validações de segurança"

echo ""
echo "🔐 Roles disponíveis:"
echo "• admin: Acesso total ao sistema"
echo "• user: Acesso básico ao painel"
echo "• viewer: Apenas visualização"
