# 🎫 Integração Freshservice - Criação Automática de Tickets

## 📋 Visão Geral

Esta integração permite que o bot WhatsApp crie tickets automaticamente no Freshservice quando usuários solicitarem atendimento. Os tickets são direcionados automaticamente para a fila de atendimento dos analistas.

---

## ⚙️ Configuração

### 1. Obter API Key do Freshservice

1. Faça login no seu Freshservice
2. Clique no seu avatar (canto superior direito)
3. Selecione **"Perfil"**
4. Role até **"Sua chave de API"**
5. Copie a chave de API

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env`:

```env
# Freshservice Configuration
FRESHSERVICE_DOMAIN=suaempresa.freshservice.com
FRESHSERVICE_API_KEY=sua_api_key_aqui
FRESHSERVICE_WORKSPACE_ID=  # Apenas para MSP
```

**Exemplo:**
```env
FRESHSERVICE_DOMAIN=nextbot.freshservice.com
FRESHSERVICE_API_KEY=AbCdEfGh123456789
```

### 3. Instalar Dependências

```bash
cd /home/kaiqueadm/Zabbix-whatsapp-bot/Zabbix-whatsapp-bot
npm install
```

### 4. Reiniciar o Bot

```bash
pm2 restart nextbot-whatsapp-bot
```

---

## 🚀 Como Usar

### Usuário no WhatsApp:

**1. Solicitar Atendimento:**
```
!atendimento
```
ou
```
!ticket
```

**2. Bot Responde:**
```
🎫 Abertura de Chamado

Por favor, descreva seu problema ou solicitação em uma mensagem.

Exemplo: Preciso de ajuda para configurar meu email
```

**3. Usuário Descreve o Problema:**
```
Meu computador não está conectando na rede WiFi
```

**4. Bot Cria o Ticket:**
```
✅ Chamado criado com sucesso!

📋 Número do Chamado: #1234
🔗 Link: https://nextbot.freshservice.com/helpdesk/tickets/1234

📝 Descrição: Meu computador não está conectando na rede WiFi

👨‍💼 Próximos passos:
• Seu chamado foi direcionado para a fila de atendimento
• Um analista entrará em contato em breve
• Você receberá atualizações por email

Guarde o número do chamado (#1234) para referência futura.
```

---

## 📊 Informações do Ticket Criado

### Campos Enviados:

| Campo | Valor |
|-------|-------|
| **Subject** | [WhatsApp] Atendimento - Nome do Contato |
| **Description** | Mensagem do usuário + informações de contato |

**Nota:** O Freshservice criará automaticamente um **Incidente** com os campos padrão do sistema (Status, Prioridade, Tipo, etc.) baseado nas configurações da sua conta.

---

## 🎯 Fluxo Completo

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuário envia: !atendimento                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Bot solicita descrição do problema                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Usuário descreve o problema                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Bot cria ticket no Freshservice via API             │
│    POST /api/v2/tickets                                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Freshservice cria ticket e direciona para fila      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Bot envia confirmação com número do ticket          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Analista recebe ticket na fila de atendimento       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 API Endpoint

**Endpoint utilizado:**
```
POST https://seu-dominio.freshservice.com/api/v2/tickets
```

**Payload enviado:**
```json
{
  "subject": "[WhatsApp] Atendimento - Nome do Contato",
  "description": "Descrição completa do atendimento"
}
```

**Autenticação:** Basic Auth (API Key como username, "X" como password)

---

## 📝 Exemplo de Ticket Criado

### No Freshservice:

**Número:** #1234  
**Assunto:** [WhatsApp] Atendimento - João Silva  
**Status:** Aberto  
**Prioridade:** Média  
**Origem:** Chat  

**Descrição:**
```
Solicitação de atendimento via WhatsApp

Contato: João Silva
Telefone: 5511999887766

Mensagem:
Meu computador não está conectando na rede WiFi

---
Ticket criado automaticamente pelo bot WhatsApp
```

---

## 🧪 Testando a Integração

### 1. Teste Manual:

```bash
# No WhatsApp, envie para o bot:
!atendimento

# Aguarde resposta e envie:
Teste de criação de ticket via WhatsApp
```

### 2. Verificar Logs:

```bash
pm2 logs nextbot-whatsapp-bot --lines 50
```

### 3. Verificar no Freshservice:

1. Acesse seu Freshservice
2. Vá para **Tickets**
3. Procure por tickets com origem **Chat**
4. Verifique se o ticket foi criado corretamente

---

## ❌ Solução de Problemas

### Erro: "Freshservice não configurado"

**Causa:** Variáveis de ambiente não configuradas  
**Solução:** Adicione `FRESHSERVICE_DOMAIN` e `FRESHSERVICE_API_KEY` no `.env`

### Erro: "401 Unauthorized"

**Causa:** API Key inválida  
**Solução:** Verifique se a API Key está correta no `.env`

### Erro: "404 Not Found"

**Causa:** Domínio incorreto  
**Solução:** Verifique se `FRESHSERVICE_DOMAIN` está correto (sem https://)

### Ticket não aparece no Freshservice

**Causa:** Possível erro na criação  
**Solução:** Verifique os logs do bot com `pm2 logs nextbot-whatsapp-bot`

---

## 📚 Referências

- [Freshservice API Documentation](https://api.freshservice.com/)
- [Freshservice Tickets API](https://api.freshservice.com/#create_ticket)
- [WhatsApp Web.js Documentation](https://wwebjs.dev/)

---

## ✅ Checklist de Configuração

- [ ] API Key do Freshservice obtida
- [ ] Variáveis de ambiente configuradas no `.env`
- [ ] Dependências instaladas (`npm install`)
- [ ] Bot reiniciado (`pm2 restart nextbot-whatsapp-bot`)
- [ ] Teste realizado enviando `!atendimento`
- [ ] Ticket criado com sucesso no Freshservice
- [ ] Logs verificados sem erros

---

## 🎉 Pronto!

Sua integração com Freshservice está configurada e funcionando!

Agora todos os usuários podem solicitar atendimento via WhatsApp e os tickets serão criados automaticamente na fila de atendimento dos analistas.
