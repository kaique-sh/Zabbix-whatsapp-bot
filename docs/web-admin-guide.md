# 🌐 Painel Web de Administração - Guia Completo

## 📋 Visão Geral

O Painel Web de Administração permite gerenciar o bot WhatsApp através de uma interface web moderna e intuitiva, com sistema completo de autenticação e controle em tempo real.

## ✨ Funcionalidades

### 🔐 **Sistema de Autenticação**
- Login seguro com JWT
- Controle de sessões
- Rate limiting para segurança
- Logout automático por inatividade

### 🎛️ **Controle do Bot**
- **Ligar/Desligar** o bot remotamente
- **Reiniciar** serviços via PM2
- **Monitorar** status em tempo real
- **Visualizar** estatísticas de uso

### 📊 **Dashboard Interativo**
- Status do bot em tempo real
- Estatísticas de mensagens
- Health check do sistema
- Logs em tempo real via WebSocket

### 📈 **Monitoramento**
- Logs em tempo real
- Estatísticas de uso
- Performance do sistema
- Histórico de atividades

## 🚀 Instalação e Configuração

### 1. **Instalação Automática:**
```bash
bash scripts/install-web-admin.sh
```

### 2. **Instalação Manual:**
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
echo "WEB_ADMIN_PORT=4000" >> .env
echo "JWT_SECRET=seu-jwt-secret-aqui" >> .env
```

### 3. **Iniciar o Painel:**
```bash
# Modo produção
npm run web:start

# Modo desenvolvimento
npm run web:dev
```

## 🔧 Configuração

### **Variáveis de Ambiente (.env):**
```env
# Painel Web
WEB_ADMIN_PORT=4000
JWT_SECRET=voetur-whatsapp-bot-secret-2024

# Opcional
WEB_ADMIN_HOST=0.0.0.0
SESSION_TIMEOUT=24
MAX_LOGIN_ATTEMPTS=5
```

### **Portas Utilizadas:**
- **4000**: Painel Web (padrão)
- **3000**: Bot WhatsApp API
- **WebSocket**: Logs em tempo real

## 🎯 Como Usar

### **1. Acesso Inicial:**
1. Acesse: `http://localhost:4000`
2. Login: `admin`
3. Senha: `admin123`
4. **⚠️ ALTERE A SENHA IMEDIATAMENTE!**

### **2. Dashboard Principal:**
- **Status do Bot**: Verde (online), Vermelho (offline)
- **Controles**: Iniciar, Parar, Reiniciar
- **Estatísticas**: Mensagens, comandos, consultas CNPJ
- **Health Check**: Verificação da saúde do sistema
- **Logs**: Visualização em tempo real

### **3. Controles Disponíveis:**

#### **🟢 Iniciar Bot:**
- Inicia o bot via PM2
- Verifica configurações
- Mostra status de inicialização

#### **🔄 Reiniciar Bot:**
- Reinicia o processo do bot
- Mantém configurações
- Útil para aplicar mudanças

#### **🔴 Parar Bot:**
- Para o bot graciosamente
- Salva estado atual
- Libera recursos

## 📊 Funcionalidades Detalhadas

### **Dashboard em Tempo Real:**
```
┌─────────────────┬─────────────────┬─────────────────┐
│   Status Bot    │   Estatísticas  │   Health Check  │
│                 │                 │                 │
│ 🟢 Online       │ 📨 1,234 msgs   │ ✅ Saudável     │
│ PID: 12345      │ 🤖 456 cmds     │ WhatsApp: OK    │
│ Uptime: 2h 30m  │ 🏢 89 CNPJs     │ API: OK         │
│                 │ 🚨 12 alertas   │                 │
│ [Iniciar] [Parar] [Reiniciar]     │                 │
└─────────────────┴─────────────────┴─────────────────┘

┌─────────────────────────────────────────────────────┐
│                 📋 Logs em Tempo Real               │
│                                                     │
│ [09:30:15] INFO: WhatsApp BOT conectado             │
│ [09:30:16] INFO: Comando !cnpj recebido             │
│ [09:30:17] INFO: Consulta CNPJ processada           │
│ [09:30:18] ERROR: Erro na consulta API              │
│                                                     │
│ [Atualizar] [Limpar] [Exportar]                     │
└─────────────────────────────────────────────────────┘
```

### **Sistema de Logs:**
- **Tempo Real**: Via WebSocket
- **Filtros**: Por tipo (INFO, WARN, ERROR)
- **Exportação**: Download de logs
- **Histórico**: Últimas 100 entradas

### **Estatísticas:**
- **Mensagens Enviadas**: Total de mensagens do bot
- **Mensagens Recebidas**: Comandos processados
- **Consultas CNPJ**: Número de consultas realizadas
- **Alertas Zabbix**: Alertas enviados

## 🔒 Segurança

### **Medidas Implementadas:**
- ✅ **Autenticação JWT** com expiração
- ✅ **Rate Limiting** para login
- ✅ **Helmet.js** para headers de segurança
- ✅ **CORS** configurado
- ✅ **Sanitização** de inputs
- ✅ **Logs de auditoria**

### **Configurações de Segurança:**
```javascript
// Rate Limiting
- Login: 5 tentativas por 15 minutos
- API: 100 requests por 15 minutos

// JWT
- Expiração: 24 horas
- Algoritmo: HS256
- Refresh automático

// Headers de Segurança
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
```

## 🗄️ Banco de Dados

### **Estrutura SQLite:**
```sql
-- Usuários
users (id, username, password, email, role, created_at, last_login, active)

-- Sessões
sessions (id, user_id, token, expires_at, created_at)

-- Comandos Customizados
custom_commands (id, command, response, description, active, created_by)

-- Configurações
settings (id, key, value, description, updated_at, updated_by)

-- Logs de Atividade
activity_logs (id, user_id, action, details, ip_address, created_at)

-- Estatísticas
bot_stats (id, date, messages_sent, messages_received, commands_executed)
```

### **Backup Automático:**
```bash
# Backup diário do banco
cp web-admin/database/admin.db backups/admin-$(date +%Y%m%d).db
```

## 🔧 API REST

### **Endpoints Disponíveis:**

#### **Autenticação:**
```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/change-password
```

#### **Controle do Bot:**
```http
GET  /api/bot/status
POST /api/bot/start
POST /api/bot/stop
POST /api/bot/restart
GET  /api/bot/logs
GET  /api/bot/health
GET  /api/bot/stats
```

### **Exemplo de Uso da API:**
```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
});

const { token } = await response.json();

// Controlar bot
await fetch('/api/bot/restart', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 🧪 Testes

### **Executar Testes:**
```bash
# Testar painel web
npm run test:web

# Testar todas as funcionalidades
npm run test:health
npm run test:cnpj
npm run test:menu
npm run test:web
```

### **Testes Incluídos:**
- ✅ Página de login
- ✅ Autenticação (válida/inválida)
- ✅ Dashboard
- ✅ APIs protegidas
- ✅ WebSocket de logs

## 📱 Interface Responsiva

### **Suporte a Dispositivos:**
- 💻 **Desktop**: Layout completo
- 📱 **Mobile**: Interface adaptada
- 📟 **Tablet**: Visualização otimizada

### **Recursos Mobile:**
- Menu hambúrguer
- Cards empilhados
- Botões touch-friendly
- Logs scrolláveis

## 🚀 Deploy em Produção

### **1. Configuração de Produção:**
```bash
# Variáveis de ambiente
export NODE_ENV=production
export WEB_ADMIN_PORT=4000
export JWT_SECRET="seu-jwt-secret-super-seguro"

# Iniciar com PM2
pm2 start web-admin/server.js --name "voetur-web-admin"
```

### **2. Nginx (Opcional):**
```nginx
server {
    listen 80;
    server_name admin.voetur.com.br;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **3. SSL/HTTPS:**
```bash
# Certbot (Let's Encrypt)
certbot --nginx -d admin.voetur.com.br
```

## 🔧 Troubleshooting

### **Problemas Comuns:**

#### **1. Painel não inicia:**
```bash
# Verificar dependências
npm install

# Verificar porta
netstat -tulpn | grep 4000

# Logs de erro
npm run web:start
```

#### **2. Login não funciona:**
```bash
# Verificar banco de dados
ls -la web-admin/database/

# Recriar usuário admin
rm web-admin/database/admin.db
npm run web:start
```

#### **3. WebSocket não conecta:**
```bash
# Verificar firewall
sudo ufw allow 4000

# Testar conectividade
curl http://localhost:4000/socket.io/
```

#### **4. Bot não responde aos comandos:**
```bash
# Verificar se bot está rodando
pm2 status

# Verificar logs do bot
npm run pm2:logs

# Reiniciar via painel
# Ou: pm2 restart zabbix-whatsapp-bot
```

## 📞 Suporte

### **Contatos:**
- **Email**: suporte@voetur.com.br
- **Documentação**: `docs/`
- **Issues**: GitHub Issues

### **Logs Importantes:**
```bash
# Logs do painel web
tail -f logs/web-admin.log

# Logs do bot
npm run pm2:logs

# Logs do sistema
journalctl -u voetur-bot
```

## 🎯 Roadmap Futuro

### **Funcionalidades Planejadas:**
- 📊 **Gráficos avançados** de estatísticas
- 👥 **Múltiplos usuários** com permissões
- 🔧 **Editor de comandos** customizados
- 📱 **App mobile** nativo
- 🔄 **Backup automático**
- 📈 **Relatórios** em PDF
- 🌐 **Multi-idioma**
- 🔔 **Notificações** push

---

**🤖 Voetur Bot - Painel Web de Administração v1.0**  
*Sistema completo de gerenciamento para bots WhatsApp*
