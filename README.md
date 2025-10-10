# 🤖 Zabbix WhatsApp Bot – Voetur Assistente

Bot WhatsApp profissional que recebe alertas do Zabbix e envia para grupo específico, com menu interativo, apresentação automática e arquitetura robusta.

## ✨ Funcionalidades

### 🚨 Alertas Zabbix
- Recebe alertas via API REST protegida
- Formatação automática de mensagens
- Sanitização de conteúdo para WhatsApp
- Retry automático com backoff exponencial

### 💬 Assistente Inteligente
- **Menu estruturado** com navegação por categorias
- **Consulta CNPJ** com comando `!cnpj [número]`
- Navegação intuitiva por números (1-4)
- Apresentação automática na primeira mensagem
- Controle de flood (uma apresentação por usuário)
- Identidade visual personalizada da Voetur

### 🌐 Painel Web de Administração
- **Interface web moderna** para gerenciar o bot
- **Sistema de login** seguro com JWT
- **Controle remoto** (ligar/desligar/reiniciar)
- **Dashboard em tempo real** com estatísticas
- **Logs ao vivo** via WebSocket
- **API REST** completa para integração

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
npm run start:complete  # Sistema completo (recomendado)
npm run pm2:start       # Apenas com PM2
npm start               # Apenas o bot (simples)
```

**Comandos úteis:**
```bash
npm run test:health    # Testa se o serviço está funcionando
npm run test:zabbix    # Testa o endpoint do Zabbix
npm run test:server    # Testa conectividade do servidor
npm run test:cnpj      # Testa funcionalidade CNPJ
npm run test:menu      # Testa sistema de menu
npm run test:web       # Testa painel web
npm run pm2:logs       # Ver todos os logs
npm run pm2:logs:bot   # Ver logs do bot
npm run pm2:logs:web   # Ver logs do painel web
npm run pm2:monit      # Monitoramento PM2
npm run logs:clean     # Limpar logs antigos
npm run clean          # Limpeza completa do projeto
```

**Deploy no servidor:**
```bash
bash scripts/deploy-server.sh  # Deploy automatizado
```

**Teste de integração Zabbix:**
```bash
npm run test:integration  # Testa integração completa
```

**Painel Web:**
```bash
npm run web:start  # Iniciar painel web
npm run web:dev    # Modo desenvolvimento
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
- **URL**: `http://10.168.217.43:3000/zabbix`
- **Método**: POST
- **Headers**: `Authorization: Bearer SEU_TOKEN`
- **Content-Type**: `application/json`

### Exemplo de Configuração no Zabbix
```bash
# Teste manual do endpoint
curl -X POST http://10.168.217.43:3000/zabbix \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Alerta Crítico - Teste",
    "message": "Servidor indisponível há 5 minutos"
  }'
```

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
│   ├── menuCommand.js     # Menu principal estruturado
│   ├── menuButtons.js     # Botões interativos (legacy)
│   └── menuNavigation.js  # Sistema de navegação por números
├── scripts/
│   ├── test-zabbix.js           # Script de teste básico
│   ├── test-server.js           # Teste de conectividade
│   ├── test-zabbix-integration.js # Teste integração Zabbix
│   ├── test-cnpj.js             # Teste funcionalidade CNPJ
│   ├── test-menu.js             # Teste sistema de menu
│   └── deploy-server.sh         # Deploy automatizado
├── docs/
│   ├── zabbix-config.md         # Configuração do Zabbix
│   ├── zabbix-media-type-script.js # Script do Media Type
│   └── zabbix-message-templates.md # Templates de mensagem
├── index.js               # Arquivo principal
├── firstMessage.js        # Mensagem de boas-vindas
├── setup.js              # Configuração interativa
├── validate-config.js     # Validador de configuração
└── ecosystem.config.js    # Configuração PM2
```

## 📊 Configuração do Zabbix

### Informações da Integração:
- **Servidor Zabbix**: `10.1.50.31`
- **WhatsApp Bot**: `10.168.217.43:3000`
- **Media Type**: WhatsApp Bot
- **Action**: Envio WhatsApp – Problemas High/Disaster
- **Usuário**: ti_alerts_group

### Documentação Completa:
- 📖 **Configuração**: `docs/zabbix-config.md`
- 🔧 **Script Media Type**: `docs/zabbix-media-type-script.js`
- 📝 **Templates**: `docs/zabbix-message-templates.md`

### Teste Rápido:
```bash
npm run test:integration  # Testa todos os cenários de alerta
```

## 🏢 Funcionalidade CNPJ

### Como Usar:
```
!cnpj 27865757000102
!cnpj 27.865.757/0001-02
```

### Informações Retornadas:
- 🏛️ **Razão Social**
- 🏪 **Nome Fantasia**
- 📊 **Situação Cadastral**
- 🏭 **CNAE Principal**
- 📍 **Endereço Completo**
- 📞 **Telefone**
- 📧 **Email**
- 💰 **Capital Social**
- 📅 **Data de Abertura**

### API Utilizada:
- **Fonte**: https://www.cnpj.ws
- **Método**: GET
- **Timeout**: 10 segundos
- **Validação**: Dígitos verificadores

### Teste da Funcionalidade:
```bash
npm run test:cnpj  # Testa validação e API
```

## 📋 Sistema de Menu Estruturado

### Como Usar:
```
!menu                    # Exibe menu principal
1                        # Serviços
2                        # Contatos  
3                        # Comandos
4                        # Ajuda
```

### Estrutura de Navegação:
```
📋 Menu Principal
├── 1️⃣ Serviços
│   ├── Abertura de chamados
│   ├── Consulta CNPJ
│   └── Suporte técnico
├── 2️⃣ Contatos
│   ├── Analistas de Infraestrutura
│   ├── Analistas de Sistemas
│   └── Contatos de emergência
├── 3️⃣ Comandos
│   ├── Lista de comandos
│   ├── Como usar o bot
│   └── Exemplos práticos
└── 4️⃣ Ajuda
    ├── Como usar o menu
    ├── Dicas e informações
    └── Contatos de suporte
```

### Funcionalidades:
- ✅ **Navegação intuitiva** por números
- ✅ **Categorização** de informações
- ✅ **Retorno fácil** ao menu principal
- ✅ **Logs detalhados** de navegação
- ✅ **Tratamento de erros** robusto

### Teste do Sistema:
```bash
npm run test:menu  # Testa estrutura do menu
```

## 🌐 Painel Web de Administração

### Instalação Rápida:
```bash
bash scripts/install-web-admin.sh  # Instalação automática
npm run web:start                  # Iniciar painel
```

### Acesso:
- **URL**: http://localhost:4000
- **Login**: admin
- **Senha**: admin123
- **⚠️ Altere a senha após primeiro acesso!**

### Funcionalidades:
```
📊 Dashboard
├── 🟢 Status do Bot (Online/Offline)
├── 🎛️ Controles (Iniciar/Parar/Reiniciar)
├── 📈 Estatísticas em Tempo Real
├── 🏥 Health Check do Sistema
└── 📋 Logs ao Vivo (WebSocket)

🔐 Sistema de Login
├── 🛡️ Autenticação JWT
├── 🚫 Rate Limiting
├── 📝 Logs de Auditoria
└── ⏰ Sessões com Timeout

🔧 API REST
├── 📡 Controle Remoto do Bot
├── 📊 Endpoints de Estatísticas
├── 📋 Gerenciamento de Logs
└── 🔒 Autenticação por Token
```

### Comandos:
```bash
npm run web:start      # Iniciar painel (produção)
npm run web:dev        # Modo desenvolvimento
npm run test:web       # Testar funcionalidades
```

### Páginas Disponíveis:
- 🏠 **Dashboard**: Status, controles e estatísticas
- 🖥️ **Comandos**: Gerenciar comandos customizados
- ⚙️ **Configurações**: Sistema e backup

### Documentação Completa:
- 📖 **Guia**: `docs/web-admin-guide.md`
- 🔧 **API**: Endpoints REST documentados
- 🧪 **Testes**: Scripts de validação incluídos

### Instalação Rápida:
```bash
bash scripts/install-web-admin.sh  # Instala tudo automaticamente
npm run web:start                  # Inicia o painel
# Acesse: http://localhost:4000
# Login: admin / admin123
```

---

## 👨‍💻 Desenvolvedor

**Desenvolvido pelo Analista Kaique Rodrigues**

Sistema de alertas Zabbix via WhatsApp com painel web de administração completo.

## 📝 Licença

Este projeto está sob a licença ISC.
