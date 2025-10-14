# 🚀 Terminal PTY - Guia Rápido

## ⚡ Instalação Rápida

### 1. Instalar Dependências

```bash
cd /home/kaiqueadm/Zabbix-whatsapp-bot/Zabbix-whatsapp-bot
npm install
```

Se houver erro com `node-pty`, instale as dependências de build:

```bash
sudo apt-get update
sudo apt-get install -y make python3 g++ build-essential
npm install node-pty@1.0.0
```

### 2. Iniciar o Servidor

```bash
# Desenvolvimento
npm run web:dev

# Produção
npm run web:start

# Com PM2
pm2 restart all
```

### 3. Acessar o Terminal

1. Abra o navegador: `http://localhost:4000`
2. Faça login (admin / admin123)
3. Clique em **"Terminal PTY"** no menu
4. Clique em **"Nova Sessão"**
5. Pronto! Use o terminal normalmente 🎉

## 📋 Teste Rápido

Após criar uma sessão, teste os comandos:

```bash
# Ver diretório atual
pwd

# Listar arquivos
ls -la

# Ver informações do sistema
uname -a

# Testar Python
python3 --version
python3 -c "print('Hello from Python!')"

# Testar Node.js
node --version
node -e "console.log('Hello from Node!')"

# Ver processos PM2
pm2 list

# Editar arquivo
nano test.txt
```

## 🎯 Recursos Principais

✅ **Terminal completo** - Bash/Zsh com todas as funcionalidades  
✅ **Múltiplas sessões** - Até 5 sessões por usuário  
✅ **Scripts e bots** - Execute Python, Node.js, etc.  
✅ **Processos persistentes** - Mantenha processos rodando  
✅ **Reconexão** - Reconecte a sessões existentes  
✅ **Auto-cleanup** - Sessões inativas são limpas automaticamente  

## 🔧 Comandos Úteis

### Gerenciar Sessões

- **Nova Sessão**: Botão "Nova Sessão"
- **Listar Sessões**: Botão "Listar Sessões"
- **Encerrar Sessão**: Botão "Encerrar Sessão"
- **Limpar Tela**: Botão "Limpar" ou `Ctrl+L`

### Atalhos do Terminal

- `Ctrl+C` - Interromper comando
- `Ctrl+D` - Sair do shell (encerra sessão)
- `Ctrl+L` - Limpar tela
- `Ctrl+A` - Início da linha
- `Ctrl+E` - Fim da linha
- `Tab` - Auto-completar

## 🐛 Problemas Comuns

### Erro: "node-pty não encontrado"

```bash
npm install node-pty@1.0.0
```

### Erro: "Limite de sessões atingido"

- Clique em "Listar Sessões" e encerre sessões antigas
- Ou aguarde 30 minutos (timeout automático)

### Terminal não responde

1. Verifique se o servidor está rodando: `pm2 list`
2. Verifique os logs: `pm2 logs voetur-web-admin`
3. Reinicie o servidor: `pm2 restart voetur-web-admin`

## 📚 Documentação Completa

Para mais detalhes, veja: `TERMINAL_PTY_DOCUMENTATION.md`

## ✅ Verificação

Para verificar se tudo está funcionando:

```bash
# Ver logs do servidor
pm2 logs voetur-web-admin

# Deve mostrar:
# ✅ Terminal WebSocket inicializado
# ✅ Rotas de terminal PTY registradas
```

---

**Pronto!** Agora você tem um terminal Linux completo no seu painel web! 🎉
