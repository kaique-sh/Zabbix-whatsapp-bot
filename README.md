#  Zabbix + WhatsApp Bot – Voetur Assistente

Bot WhatsApp 24h que recebe alertas do Zabbix e envia para grupo específico, com menu interativo, apresentação profissional e logs estruturados.

##  Funcionalidades
-  Alertas Zabbix → WhatsApp 24h  
-  Menu interativo `!menu`  
-  Apresentação automática na primeira mensagem  
-  Identidade visual Voetur (emojis, cores, texto)  
-  Código separado por arquivos (menu, comandos, etc.)  
-  **Logs estruturados com Pino** (JSON em produção, colorido em dev)
-  **Autenticação por token** no endpoint `/zabbix`
-  **Healthcheck** em `/health` para monitoramento
-  **Configuração flexível** via variáveis de ambiente
-  **Performance otimizada** (debounce de I/O, validações)

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

### 2. Configure o `.env`
Copie o exemplo e edite:
```bash
cp .env.example .env
```

**Variáveis obrigatórias:**
- `GROUP_ID` - ID do grupo WhatsApp (formato: `5511999999999-1234567890@g.us`)
- `API_TOKEN` - Token secreto para proteger o endpoint `/zabbix`

**Variáveis opcionais:**
- `PORT` (default: 3000)
- `HEADLESS` (default: true)
- `NODE_ENV` (development/production)
- `COMPANY_NAME`, `ASSISTANT_DISPLAY_NAME`, `MENU_COMMAND`, `CONTACT_NAME`

### 3. Execute

**Configuração automática:**
```bash
npm run setup  # Assistente interativo
```

**Validação:**
```bash
npm run validate  # Verifica configuração
```

**Execução:**
```bash
# Desenvolvimento (logs coloridos)
npm run dev

# Produção simples
npm start

# Produção com PM2 (recomendado)
npm run pm2:start
npm run pm2:logs    # Ver logs
npm run pm2:monit   # Monitoramento

# Healthcheck
npm run test:health
```

##  Segurança
O endpoint `/zabbix` agora requer autenticação via header:
```bash
curl -X POST http://localhost:3000/zabbix \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"subject": "Alerta", "message": "Servidor offline"}'
```

##  Monitoramento
```bash
# Healthcheck
curl http://localhost:3000/health
# Resposta: {"status":"ok","whatsapp":true}
```

##  Melhorias Implementadas
- **Performance**: Debounce de gravações em disco (1s), validações antecipadas
- **Observabilidade**: Logs estruturados com contexto (userId, duration, errors)
- **Resiliência**: Validação de prontidão do cliente, tratamento de erros robusto
- **Configurabilidade**: Todas as mensagens e comportamentos via `.env`
- **Segurança**: Autenticação opcional por token, logs de tentativas não autorizadas  

##  Contatos no Menu
- Infra: Kaique, Eron, João, Carlos, Ricardo  
- Sistemas: Nicolas, Erick, Henrique  
- Suporte: https://suporte.voetur.com.br/support/home
## 📄 Licença
MIT – uso livre para a comunidade Voetur.
