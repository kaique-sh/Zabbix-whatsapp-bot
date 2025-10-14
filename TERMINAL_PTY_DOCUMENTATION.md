# Terminal PTY Dedicado - NextBot Solutions

## 📋 Visão Geral

Sistema de terminal PTY (Pseudo-Terminal) dedicado que permite que cada usuário do painel web tenha acesso a sessões de terminal isoladas e completas no servidor Linux, com todas as funcionalidades de um shell interativo real.

## 🎯 Características

### ✅ Sessões Isoladas por Usuário
- Cada usuário pode ter até **5 sessões simultâneas**
- Sessões completamente isoladas entre usuários
- Gerenciamento automático de recursos

### ✅ Terminal Completo
- **Shell real**: bash/zsh com todas as funcionalidades
- **Ambiente completo**: Acesso total ao Ubuntu/Linux
- **Interatividade**: Suporte a aplicações interativas (vim, nano, htop, etc.)
- **Cores e formatação**: Suporte completo a ANSI colors

### ✅ Execução de Scripts e Bots
- Execute scripts Python, Node.js, etc.
- Mantenha processos em execução
- Persistência de sessão (reconexão possível)
- Suporte a processos de longa duração

### ✅ Gerenciamento Inteligente
- **Timeout automático**: Sessões inativas são encerradas após 30 minutos
- **Limpeza automática**: Processo de cleanup a cada 5 minutos
- **Reconexão**: Possibilidade de reconectar a sessões existentes
- **Múltiplas sessões**: Gerencie várias sessões simultaneamente

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Browser)                      │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ XTerm.js   │  │ Terminal     │  │ WebSocket        │    │
│  │ (UI)       │◄─┤ Client       │◄─┤ Connection       │    │
│  └────────────┘  └──────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ WebSocket (/terminal namespace)
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js Server)                  │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────┐ │
│  │ Terminal Socket  │  │ Terminal       │  │ node-pty    │ │
│  │ Handler          │─►│ Manager        │─►│ (PTY)       │ │
│  └──────────────────┘  └────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Spawn Process
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Sistema Operacional (Linux)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ bash/zsh     │  │ Python       │  │ Node.js      │     │
│  │ Shell        │  │ Scripts      │  │ Scripts      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Estrutura de Arquivos

```
web-admin/
├── services/
│   ├── terminalManager.js      # Gerenciador de sessões PTY
│   └── terminalSocket.js       # Handler WebSocket
├── routes/
│   └── terminalPty.js          # Rotas REST API
├── public/
│   ├── js/
│   │   └── terminal-client.js  # Cliente JavaScript
│   └── terminal-pty.html       # Interface do usuário
└── server.js                   # Integração no servidor
```

## 🔧 Componentes

### 1. Terminal Manager (`terminalManager.js`)

Gerenciador central de sessões PTY.

**Principais Métodos:**
- `createSession(userId, options)` - Cria nova sessão
- `getSession(userId, sessionId)` - Obtém sessão existente
- `writeToSession(userId, sessionId, data)` - Envia dados
- `resizeSession(userId, sessionId, cols, rows)` - Redimensiona
- `destroySession(userId, sessionId)` - Destrói sessão
- `listUserSessions(userId)` - Lista sessões do usuário
- `cleanupInactiveSessions()` - Limpa sessões inativas

**Configurações:**
```javascript
{
    shell: '/bin/bash',              // Shell padrão
    defaultCwd: '/home/user',        // Diretório padrão
    maxSessionsPerUser: 5,           // Máximo de sessões por usuário
    sessionTimeout: 30 * 60 * 1000,  // 30 minutos
    cleanupInterval: 5 * 60 * 1000   // 5 minutos
}
```

### 2. Terminal Socket Handler (`terminalSocket.js`)

Gerencia comunicação WebSocket em tempo real.

**Eventos do Cliente → Servidor:**
- `create-session` - Criar nova sessão
- `attach-session` - Conectar a sessão existente
- `terminal-input` - Enviar dados para terminal
- `terminal-resize` - Redimensionar terminal
- `destroy-session` - Destruir sessão
- `list-sessions` - Listar sessões

**Eventos do Servidor → Cliente:**
- `terminal-output` - Dados de saída do terminal
- `terminal-exit` - Terminal encerrado
- `terminal-error` - Erro ocorrido

### 3. Terminal Client (`terminal-client.js`)

Cliente JavaScript para o frontend.

**Exemplo de Uso:**
```javascript
// Criar cliente
const client = new TerminalClient();

// Conectar
await client.connect(authToken, user);

// Criar sessão
const session = await client.createSession({
    cols: 80,
    rows: 24,
    cwd: '/home/user/project'
});

// Configurar callbacks
client.onOutput((data) => {
    xterm.write(data);
});

client.onExit((data) => {
    console.log('Terminal encerrado:', data);
});

// Enviar dados
client.write('ls -la\n');

// Redimensionar
client.resize(100, 30);

// Destruir sessão
await client.destroySession();
```

## 🚀 Como Usar

### 1. Instalação

```bash
# Instalar dependências
cd /path/to/Zabbix-whatsapp-bot
npm install

# A dependência node-pty será instalada automaticamente
```

### 2. Iniciar o Servidor

```bash
# Modo desenvolvimento
npm run web:dev

# Modo produção
npm run web:start

# Com PM2
pm2 start ecosystem.config.js
```

### 3. Acessar o Terminal PTY

1. Faça login no painel: `http://localhost:4000`
2. Navegue para: **Terminal PTY** no menu
3. Clique em **"Nova Sessão"**
4. Use o terminal normalmente!

## 💡 Casos de Uso

### 1. Executar Script Python

```bash
# Criar e executar script
echo 'print("Hello from Python!")' > test.py
python3 test.py

# Executar bot Python
cd /path/to/bot
python3 bot.py
```

### 2. Executar Script Node.js

```bash
# Criar e executar script
echo 'console.log("Hello from Node!");' > test.js
node test.js

# Instalar dependências e executar
npm install
npm start
```

### 3. Gerenciar Processos PM2

```bash
# Listar processos
pm2 list

# Ver logs
pm2 logs

# Reiniciar bot
pm2 restart bot-name
```

### 4. Editar Arquivos

```bash
# Usar nano
nano config.json

# Usar vim
vim script.py

# Usar cat para visualizar
cat README.md
```

### 5. Monitorar Sistema

```bash
# Ver processos
htop

# Ver uso de disco
df -h

# Ver memória
free -h

# Ver logs em tempo real
tail -f /var/log/syslog
```

## 🔒 Segurança

### Isolamento de Sessões
- Cada sessão é isolada por usuário
- Sessões não podem acessar dados de outros usuários
- Autenticação JWT obrigatória

### Variáveis de Ambiente
Cada sessão PTY recebe:
```javascript
{
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
    HOME: '/home/user',
    USER: 'nextbot',
    SHELL: '/bin/bash',
    PATH: process.env.PATH,
    LANG: 'en_US.UTF-8'
}
```

### Timeouts e Limites
- **Timeout de inatividade**: 30 minutos
- **Máximo de sessões**: 5 por usuário
- **Limpeza automática**: A cada 5 minutos

## 🔧 Configuração Avançada

### Alterar Shell Padrão

Edite `web-admin/services/terminalManager.js`:

```javascript
this.config = {
    shell: '/bin/zsh',  // Mudar para zsh
    // ...
}
```

### Alterar Timeout

```javascript
this.config = {
    sessionTimeout: 60 * 60 * 1000,  // 60 minutos
    // ...
}
```

### Alterar Limite de Sessões

```javascript
this.config = {
    maxSessionsPerUser: 10,  // 10 sessões
    // ...
}
```

## 🐛 Troubleshooting

### Erro: "node-pty não encontrado"

```bash
# Reinstalar node-pty
npm install node-pty@1.0.0

# Se falhar, instalar dependências de build
sudo apt-get install -y make python3 g++ build-essential
npm install node-pty@1.0.0
```

### Erro: "Limite de sessões atingido"

- Destrua sessões antigas usando "Listar Sessões"
- Ou aguarde o timeout automático (30 min)

### Terminal não responde

1. Verifique a conexão WebSocket no console do navegador
2. Tente criar uma nova sessão
3. Reinicie o servidor se necessário

### Caracteres estranhos no terminal

- Certifique-se de que o XTerm.js está carregado corretamente
- Verifique se o tema está configurado
- Limpe o cache do navegador

## 📊 Monitoramento

### Ver Estatísticas (Admin)

```bash
# Via API
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/terminal-pty/stats
```

**Resposta:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 3,
    "totalSessions": 7,
    "maxSessionsPerUser": 5,
    "sessionTimeout": 1800000,
    "userStats": [
      { "userId": 1, "sessionCount": 3 },
      { "userId": 2, "sessionCount": 2 },
      { "userId": 3, "sessionCount": 2 }
    ]
  }
}
```

## 🔄 API REST

### Criar Sessão
```http
POST /api/terminal-pty/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "cols": 80,
  "rows": 24,
  "cwd": "/home/user"
}
```

### Listar Sessões
```http
GET /api/terminal-pty/sessions
Authorization: Bearer <token>
```

### Redimensionar
```http
POST /api/terminal-pty/resize
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "term_123456",
  "cols": 100,
  "rows": 30
}
```

### Destruir Sessão
```http
DELETE /api/terminal-pty/session/:sessionId
Authorization: Bearer <token>
```

## 🎨 Personalização do Frontend

### Alterar Tema do Terminal

Edite `terminal-pty.html`:

```javascript
xterm = new Terminal({
    theme: {
        background: '#1e1e1e',  // Fundo escuro
        foreground: '#d4d4d4',  // Texto claro
        cursor: '#00ff00',      // Cursor verde
        // ... mais cores
    }
});
```

### Alterar Fonte

```javascript
xterm = new Terminal({
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontSize: 16,
});
```

## 📝 Notas Importantes

1. **Persistência**: Sessões persistem mesmo após desconexão do WebSocket (até o timeout)
2. **Reconexão**: Use `attachSession(sessionId)` para reconectar
3. **Processos**: Processos continuam rodando mesmo após fechar o navegador
4. **Cleanup**: Sessões inativas são automaticamente limpas
5. **Segurança**: Sempre use HTTPS em produção

## 🚀 Próximos Passos

- [ ] Adicionar suporte a múltiplas abas de terminal
- [ ] Implementar histórico de comandos persistente
- [ ] Adicionar upload/download de arquivos
- [ ] Implementar compartilhamento de sessões (para suporte)
- [ ] Adicionar gravação de sessões (audit log)

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique os logs do servidor: `pm2 logs`
- Console do navegador (F12)
- Documentação do node-pty: https://github.com/microsoft/node-pty

---

**NextBot Solutions** - Terminal PTY Dedicado v1.0.0
