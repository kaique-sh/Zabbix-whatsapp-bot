# 🤖 Zabbix WhatsApp Bot – Voetur Assistente

Bot WhatsApp profissional que recebe alertas do Zabbix e envia para grupo específico, com menu interativo, apresentação automática e arquitetura robusta.

## ✨ Funcionalidades

### 🚨 Alertas Zabbix
- Recebe alertas via API REST protegida
- Formatação automática de mensagens
- Sanitização de conteúdo para WhatsApp
- Retry automático com backoff exponencial

### 💬 Assistente Inteligente
- Menu interativo com comando `!menu`
- Apresentação automática na primeira mensagem
- Controle de flood (uma apresentação por usuário)
- Identidade visual personalizada da Voetur

### 🔧 Arquitetura Robusta
- **Logs estruturados** com Pino (JSON em produção, colorido em dev)
- **Autenticação por token** no endpoint `/zabbix`
- **Healthcheck** em `/health` para monitoramento
- **Configuração centralizada** via variáveis de ambiente
- **Tratamento de erros** robusto em todas as camadas

##  Tecnologias
- Node.js 20  
- whatsapp-web.js 1.34.1  
- Express 4.18  
- Pino (logs estruturados)
- Systemd (serviço 24h)  

##  Instalação e Uso

### 1. Clone e instale
```bash
git clone <repo>
cd Zabbix-whatsapp-bot
npm install
```

### 2. Configure automaticamente
Use o assistente de configuração interativo:
```bash
npm run setup
```

Ou configure manualmente criando o arquivo `.env`:
```bash
# Configuração do Zabbix WhatsApp Bot
GROUP_ID=seu_group_id_aqui@g.us

# Configuração da API
PORT=3000
API_TOKEN=seu_token_seguro_aqui

# Configuração do Puppeteer
HEADLESS=true
NODE_ENV=development

# Personalização do Bot
COMPANY_NAME=Voetur
ASSISTANT_DISPLAY_NAME=VOETUR ASSISTENTE
MENU_COMMAND=!menu
CONTACT_NAME=Voetur Assistente

# Configuração de Arquivos
FIRST_MESSAGES_PATH=./firstMessages.json
```

### 3. Execute

**Validação da configuração:**
```bash
npm run validate  # Verifica se tudo está correto
```

**Execução em desenvolvimento:**
```bash
npm run dev       # Com nodemon e logs coloridos
```

**Execução em produção:**
```bash
npm start         # Simples
npm run pm2:start # Com PM2 (recomendado)
```

**Comandos úteis:**
```bash
npm run test:health    # Testa se o serviço está funcionando
npm run test:zabbix    # Testa o endpoint do Zabbix
npm run pm2:logs       # Ver logs do PM2
npm run pm2:monit      # Monitoramento PM2
npm run logs:clean     # Limpar logs antigos
npm run clean          # Limpeza completa do projeto
```

## 🔒 Segurança

### Autenticação da API
O endpoint `/zabbix` requer autenticação via Bearer token:

```bash
curl -X POST http://localhost:3000/zabbix \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Alerta Crítico",
    "message": "Servidor indisponível há 5 minutos"
  }'
```

### Configuração no Zabbix
Configure o Zabbix para enviar alertas para:
- **URL**: `http://seu-servidor:3000/zabbix`
- **Método**: POST
- **Headers**: `Authorization: Bearer SEU_TOKEN`
- **Content-Type**: `application/json`

## 📊 Monitoramento

### Healthcheck
```bash
curl http://localhost:3000/health
# Resposta: {"status":"ok","whatsapp":true}
```

### Logs Estruturados
```bash
# Ver logs em tempo real
npm run pm2:logs

# Logs incluem contexto completo:
# - Timestamp ISO
# - Nível de log (info, warn, error)
# - Contexto (userId, duration, etc.)
# - Stack traces em erros
```

## 🚀 Melhorias Implementadas

### ✅ Arquitetura
- **Configuração centralizada** em `src/config/`
- **Logger unificado** evitando duplicação
- **Constantes centralizadas** para fácil manutenção
- **Estrutura modular** com separação de responsabilidades

### ✅ Performance
- **Debounce de I/O** (1s para salvamento de arquivos)
- **Validações antecipadas** de configuração
- **Retry com backoff** exponencial
- **Sanitização de texto** para WhatsApp

### ✅ Observabilidade
- **Logs estruturados** com contexto completo
- **Métricas de duração** em operações críticas
- **Healthcheck** com status do WhatsApp
- **Scripts de teste** automatizados

### ✅ Resiliência
- **Tratamento robusto de erros** em todas as camadas
- **Validação de prontidão** do cliente WhatsApp
- **Graceful shutdown** com salvamento de dados
- **Configuração flexível** via variáveis de ambiente

## 📞 Contatos Configurados
- **Infraestrutura**: Kaique, Eron, João, Carlos, Ricardo
- **Sistemas**: Nicolas, Erick, Henrique
- **Suporte**: https://suporte.voetur.com.br/support/home

## 📁 Estrutura do Projeto
```
├── src/
│   ├── config/
│   │   ├── logger.js      # Logger centralizado
│   │   └── constants.js   # Configurações centralizadas
│   └── utils/
│       └── helpers.js     # Funções utilitárias
├── menu/
│   ├── menuCommand.js     # Comando !menu
│   └── menuButtons.js     # Botões interativos
├── scripts/
│   └── test-zabbix.js     # Script de teste
├── index.js               # Arquivo principal
├── firstMessage.js        # Mensagem de boas-vindas
├── setup.js              # Configuração interativa
├── validate-config.js     # Validador de configuração
└── ecosystem.config.js    # Configuração PM2
```

## 📄 Licença
MIT – Uso livre para a comunidade Voetur.
