# 📊 Configuração do Zabbix para WhatsApp Bot

## 🔧 Informações da Configuração

- **Servidor Zabbix**: `10.1.50.31`
- **WhatsApp Bot**: `10.168.217.43:3000`
- **Media Type**: WhatsApp Bot
- **Action**: Envio WhatsApp – Problemas High/Disaster
- **Usuário**: ti_alerts_group

## 📋 Passo a Passo da Configuração

### 1. 🔗 Criar Media Type

**Administração → Media Types → Create Media Type**

```
Name: WhatsApp Bot
Type: Webhook
Script name: whatsapp_bot

Parameters:
- HTTPProxy: (deixar vazio)
- Message: {ALERT.MESSAGE}
- Subject: {ALERT.SUBJECT}
- To: {ALERT.SENDTO}
- URL: http://10.168.217.43:3000/zabbix
- Token: SEU_TOKEN_AQUI

Script:
```

### 2. 📝 Script do Webhook

```javascript
var WhatsApp = {
    url: null,
    token: null,

    sendMessage: function (subject, message) {
        var params = {
            'subject': subject,
            'message': message
        },
        data,
        response,
        request = new CurlHttpRequest(),
        url = this.url;

        if (typeof this.HTTPProxy === 'string' && this.HTTPProxy.trim() !== '') {
            request.setProxy(this.HTTPProxy);
        }

        request.addHeader('Content-Type: application/json');
        
        if (typeof this.token === 'string' && this.token.trim() !== '') {
            request.addHeader('Authorization: Bearer ' + this.token);
        }

        data = JSON.stringify(params);

        Zabbix.Log(4, '[WhatsApp Webhook] URL: ' + url);
        Zabbix.Log(4, '[WhatsApp Webhook] params: ' + data);
        
        response = request.post(url, data);

        Zabbix.Log(4, '[WhatsApp Webhook] HTTP code: ' + request.getStatus());
        Zabbix.Log(4, '[WhatsApp Webhook] response: ' + response);

        if (request.getStatus() !== 200) {
            throw 'Response code: ' + request.getStatus();
        }

        if (response !== null) {
            try {
                response = JSON.parse(response);
            } catch (error) {
                Zabbix.Log(4, '[WhatsApp Webhook] response parse error');
            }
        }

        if (typeof response !== 'object' || response.status !== 'success') {
            throw 'WhatsApp notification failed: ' + JSON.stringify(response);
        }
    }
};

try {
    var params = JSON.parse(value);

    if (typeof params.URL === 'undefined') {
        throw 'Incorrect webhook URL parameter given: ' + params.URL;
    }

    WhatsApp.url = params.URL;
    
    if (typeof params.HTTPProxy !== 'undefined') {
        WhatsApp.HTTPProxy = params.HTTPProxy;
    }
    
    if (typeof params.Token !== 'undefined') {
        WhatsApp.token = params.Token;
    }

    WhatsApp.sendMessage(params.Subject, params.Message);

    return 'OK';
} catch (error) {
    Zabbix.Log(4, '[WhatsApp Webhook] notification failed: ' + error);
    throw 'WhatsApp notification failed: ' + error;
}
```

### 3. 👤 Configurar Usuário

**Administração → Users → ti_alerts_group**

Na aba **Media**:
```
Type: WhatsApp Bot
Send to: grupo_whatsapp (pode ser qualquer valor, não é usado)
When active: 1-7,00:00-24:00
Use if severity: 
  ☑ High
  ☑ Disaster
Status: Enabled
```

### 4. ⚡ Criar Action

**Configuration → Actions → Trigger actions → Create Action**

#### Aba Action:
```
Name: Envio WhatsApp – Problemas High/Disaster
Event source: Triggers

Conditions:
- Trigger severity >= High

Enabled: ✓
```

#### Aba Operations:
```
Default operation step duration: 60s

Operations:
1. Send message
   - Send to users: ti_alerts_group
   - Send only to: WhatsApp Bot
   
Default subject:
🚨 {TRIGGER.SEVERITY}: {TRIGGER.NAME}

Default message:
🔴 *PROBLEMA DETECTADO*

📊 *Host*: {HOST.NAME}
🏷️ *Item*: {ITEM.NAME}
⚠️ *Severidade*: {TRIGGER.SEVERITY}
🕐 *Horário*: {EVENT.DATE} {EVENT.TIME}

📝 *Descrição*:
{TRIGGER.DESCRIPTION}

💡 *Valor Atual*: {ITEM.LASTVALUE}

🔗 *Link*: {TRIGGER.URL}
```

#### Aba Recovery Operations:
```
Recovery operations:
1. Send message
   - Send to users: ti_alerts_group
   - Send only to: WhatsApp Bot

Recovery subject:
✅ RESOLVIDO: {TRIGGER.NAME}

Recovery message:
✅ *PROBLEMA RESOLVIDO*

📊 *Host*: {HOST.NAME}
🏷️ *Item*: {ITEM.NAME}
🕐 *Resolvido em*: {EVENT.RECOVERY.DATE} {EVENT.RECOVERY.TIME}
⏱️ *Duração*: {EVENT.DURATION}

💡 *Valor Atual*: {ITEM.LASTVALUE}
```

## 🧪 Teste da Configuração

### 1. Teste Manual via cURL:
```bash
curl -X POST http://10.168.217.43:3000/zabbix \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "🚨 HIGH: Teste de Conectividade",
    "message": "📊 Host: servidor-teste\n🏷️ Item: CPU Usage\n⚠️ Severidade: HIGH\n🕐 Horário: 2024-01-09 17:40:00\n\n📝 Descrição: Teste de integração Zabbix-WhatsApp\n\n💡 Valor Atual: 95%"
  }'
```

### 2. Teste no Zabbix:
1. Vá em **Monitoring → Problems**
2. Crie um problema de teste ou aguarde um alerta real
3. Verifique se a mensagem chegou no WhatsApp

### 3. Verificar Logs:
```bash
# No servidor do WhatsApp Bot
npm run pm2:logs

# No Zabbix Server
tail -f /var/log/zabbix/zabbix_server.log | grep -i whatsapp
```

## 🔍 Troubleshooting

### Problemas Comuns:

#### 1. **Erro 401 - Unauthorized**
```
Solução: Verificar se o Token está correto no Media Type
```

#### 2. **Erro 503 - Service Unavailable**
```
Solução: WhatsApp não está conectado
- Verificar QR Code
- Executar: npm run test:health
```

#### 3. **Timeout de Conexão**
```
Solução: Verificar conectividade de rede
- Ping entre servidores: ping 10.168.217.43
- Testar porta: telnet 10.168.217.43 3000
```

#### 4. **Mensagem não chega no WhatsApp**
```
Solução: Verificar GROUP_ID
- Confirmar ID do grupo no .env
- Testar com: npm run test:server
```

## 📊 Monitoramento

### Métricas Importantes:
1. **Taxa de Sucesso**: Verificar logs de envio
2. **Latência**: Tempo de resposta do webhook
3. **Disponibilidade**: Status do WhatsApp Bot
4. **Conectividade**: Ping entre servidores

### Comandos de Monitoramento:
```bash
# Status do bot
curl http://10.168.217.43:3000/health

# Logs em tempo real
npm run pm2:logs

# Teste completo
npm run test:server
```

## 🔐 Segurança

### Recomendações:
1. **Token forte**: Use tokens de 32+ caracteres
2. **Firewall**: Libere apenas IPs necessários
3. **HTTPS**: Configure SSL/TLS em produção
4. **Logs**: Monitore tentativas de acesso

### Configuração de Firewall:
```bash
# Permitir apenas o servidor Zabbix
iptables -A INPUT -p tcp --dport 3000 -s 10.1.50.31 -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j DROP
```

## 📝 Checklist de Configuração

- [ ] Media Type criado com script correto
- [ ] Usuário ti_alerts_group configurado
- [ ] Action criada para High/Disaster
- [ ] Token configurado no Zabbix e no Bot
- [ ] Teste manual funcionando
- [ ] WhatsApp conectado e funcionando
- [ ] Logs sendo gerados corretamente
- [ ] Firewall configurado
- [ ] Monitoramento ativo
