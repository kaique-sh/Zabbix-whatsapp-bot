# ⚡ Configuração Rápida do Zabbix

## 🎯 Resumo da Configuração

**Servidores:**
- Zabbix: `10.1.50.31`
- WhatsApp Bot: `10.168.217.43:3000`

## 📋 Checklist de Configuração

### ✅ 1. Media Type
```
Nome: WhatsApp Bot
Tipo: Webhook
URL: http://10.168.217.43:3000/zabbix
Token: [SEU_TOKEN_AQUI]
```

### ✅ 2. Usuário
```
Usuário: ti_alerts_group
Media: WhatsApp Bot
Severidades: High, Disaster
```

### ✅ 3. Action
```
Nome: Envio WhatsApp – Problemas High/Disaster
Condição: Trigger severity >= High
Operação: Send message via WhatsApp Bot
```

## 🚀 Comandos de Teste

```bash
# 1. Testar WhatsApp Bot
npm run test:health

# 2. Testar integração completa
npm run test:integration

# 3. Teste manual do endpoint
curl -X POST http://10.168.217.43:3000/zabbix \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Teste","message":"Mensagem de teste"}'
```

## 📝 Templates Prontos

### Subject (Problema):
```
🚨 {TRIGGER.SEVERITY}: {TRIGGER.NAME}
```

### Message (Problema):
```
🔴 *PROBLEMA DETECTADO*

📊 *Host*: {HOST.NAME}
🏷️ *Item*: {ITEM.NAME}
⚠️ *Severidade*: {TRIGGER.SEVERITY}
🕐 *Horário*: {EVENT.DATE} {EVENT.TIME}

📝 *Descrição*: {TRIGGER.DESCRIPTION}
💡 *Valor*: {ITEM.LASTVALUE}

🔗 http://10.1.50.31/zabbix/tr_events.php?triggerid={TRIGGER.ID}
```

### Recovery Subject:
```
✅ RESOLVIDO: {TRIGGER.NAME}
```

### Recovery Message:
```
✅ *PROBLEMA RESOLVIDO*

📊 *Host*: {HOST.NAME}
🕐 *Resolvido*: {EVENT.RECOVERY.DATE} {EVENT.RECOVERY.TIME}
⏱️ *Duração*: {EVENT.DURATION}
💡 *Valor*: {ITEM.LASTVALUE}
```

## 🔧 Troubleshooting Rápido

| Erro | Solução |
|------|---------|
| 401 Unauthorized | Verificar token no Media Type |
| 503 Service Unavailable | WhatsApp desconectado - escanear QR |
| Timeout | Verificar conectividade de rede |
| Mensagem não chega | Verificar GROUP_ID no .env |

## 📞 Contatos de Suporte

- **Infraestrutura**: Kaique (61) 9261-9515
- **Sistemas**: Nicolas (11) 96302-5383
- **Suporte**: https://suporte.voetur.com.br
