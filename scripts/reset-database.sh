#!/bin/bash

# Script para resetar e recriar o banco de dados do painel web

echo "🔄 Resetando Banco de Dados do Painel Web"
echo "=" $(printf "%0.s=" {1..45})

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Parar o painel web se estiver rodando
echo "🛑 Parando painel web..."
pm2 stop voetur-web-admin > /dev/null 2>&1 || true

# Remover banco de dados existente
echo "🗑️  Removendo banco de dados existente..."
rm -f web-admin/database/admin.db

# Criar diretório se não existir
mkdir -p web-admin/database

# Reiniciar o painel para recriar o banco
echo "🚀 Reiniciando painel web para recriar banco..."
npm run web:start &
WEB_PID=$!

# Aguardar alguns segundos para o banco ser criado
echo "⏳ Aguardando inicialização..."
sleep 5

# Parar o processo
kill $WEB_PID > /dev/null 2>&1 || true

# Verificar se o banco foi criado
if [ -f "web-admin/database/admin.db" ]; then
    echo "✅ Banco de dados recriado com sucesso!"
    
    # Mostrar informações do banco
    echo ""
    echo "📊 Informações do banco:"
    echo "• Localização: web-admin/database/admin.db"
    echo "• Usuário padrão: admin"
    echo "• Senha padrão: admin123"
    echo "• Dados de exemplo: Inseridos"
    
    echo ""
    echo "🎯 Próximos passos:"
    echo "1. Iniciar painel: npm run web:start"
    echo "2. Acessar: http://localhost:4000"
    echo "3. Login: admin / admin123"
    echo "4. Verificar estatísticas no dashboard"
    
else
    echo "❌ Erro ao criar banco de dados"
    exit 1
fi

echo ""
echo "✅ Reset do banco concluído!"
