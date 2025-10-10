# 📝 Templates de Mensagens do Zabbix

## 🚨 Template para Problemas (Default Message)

### Subject:
```
🚨 {TRIGGER.SEVERITY}: {TRIGGER.NAME}
```

### Message:
```
🔴 *PROBLEMA DETECTADO*

📊 *Host*: {HOST.NAME}
🏷️ *Item*: {ITEM.NAME}
⚠️ *Severidade*: {TRIGGER.SEVERITY}
🕐 *Horário*: {EVENT.DATE} {EVENT.TIME}

📝 *Descrição*:
{TRIGGER.DESCRIPTION}

💡 *Valor Atual*: {ITEM.LASTVALUE}

🔗 *Zabbix*: http://10.1.50.31/zabbix/tr_events.php?triggerid={TRIGGER.ID}&eventid={EVENT.ID}

---
🤖 *Voetur Assistente* - Alerta automático
```

## ✅ Template para Recovery (Recovery Message)

### Recovery Subject:
```
✅ RESOLVIDO: {TRIGGER.NAME}
```

### Recovery Message:
```
✅ *PROBLEMA RESOLVIDO*

📊 *Host*: {HOST.NAME}
🏷️ *Item*: {ITEM.NAME}
🕐 *Resolvido em*: {EVENT.RECOVERY.DATE} {EVENT.RECOVERY.TIME}
⏱️ *Duração*: {EVENT.DURATION}

💡 *Valor Atual*: {ITEM.LASTVALUE}

🔗 *Zabbix*: http://10.1.50.31/zabbix/tr_events.php?triggerid={TRIGGER.ID}&eventid={EVENT.ID}

---
🤖 *Voetur Assistente* - Recuperação automática
```

## 🔄 Template para Update (Update Message)

### Update Subject:
```
🔄 ATUALIZAÇÃO: {TRIGGER.NAME}
```

### Update Message:
```
🔄 *PROBLEMA ATUALIZADO*

📊 *Host*: {HOST.NAME}
🏷️ *Item*: {ITEM.NAME}
⚠️ *Severidade*: {TRIGGER.SEVERITY}
🕐 *Atualizado em*: {EVENT.UPDATE.DATE} {EVENT.UPDATE.TIME}
⏱️ *Duração*: {EVENT.DURATION}

📝 *Descrição*:
{TRIGGER.DESCRIPTION}

💡 *Valor Atual*: {ITEM.LASTVALUE}

🔗 *Zabbix*: http://10.1.50.31/zabbix/tr_events.php?triggerid={TRIGGER.ID}&eventid={EVENT.ID}

---
🤖 *Voetur Assistente* - Atualização automática
```

## 🎯 Templates Específicos por Severidade

### 🔴 DISASTER
```
🚨 *CRÍTICO - AÇÃO IMEDIATA NECESSÁRIA*

📊 *Host*: {HOST.NAME}
🏷️ *Item*: {ITEM.NAME}
🕐 *Horário*: {EVENT.DATE} {EVENT.TIME}

⚠️ *SEVERIDADE: DISASTER*

📝 *Problema*:
{TRIGGER.DESCRIPTION}

💡 *Valor*: {ITEM.LASTVALUE}

🔔 *Contatos de Emergência*:
• Kaique: (61) 9261-9515
• Eron: (21) 99200-7701

🔗 *Link*: http://10.1.50.31/zabbix/tr_events.php?triggerid={TRIGGER.ID}
```

### 🟠 HIGH
```
🚨 *ALTA PRIORIDADE*

📊 *Host*: {HOST.NAME}
🏷️ *Item*: {ITEM.NAME}
🕐 *Horário*: {EVENT.DATE} {EVENT.TIME}

⚠️ *SEVERIDADE: HIGH*

📝 *Problema*:
{TRIGGER.DESCRIPTION}

💡 *Valor*: {ITEM.LASTVALUE}

🔗 *Link*: http://10.1.50.31/zabbix/tr_events.php?triggerid={TRIGGER.ID}
```

## 📊 Templates por Tipo de Problema

### 💾 Problemas de Disco
```
💾 *ALERTA DE DISCO*

📊 *Servidor*: {HOST.NAME}
📁 *Partição*: {ITEM.NAME}
🕐 *Horário*: {EVENT.DATE} {EVENT.TIME}

⚠️ *Status*: {TRIGGER.SEVERITY}
💡 *Espaço Livre*: {ITEM.LASTVALUE}

📝 *Ação Recomendada*:
• Verificar logs em /var/log
• Limpar arquivos temporários
• Expandir partição se necessário

🔗 *Zabbix*: http://10.1.50.31/zabbix/tr_events.php?triggerid={TRIGGER.ID}
```

### 🖥️ Problemas de CPU
```
🖥️ *ALERTA DE CPU*

📊 *Servidor*: {HOST.NAME}
⚡ *Métrica*: {ITEM.NAME}
🕐 *Horário*: {EVENT.DATE} {EVENT.TIME}

⚠️ *Status*: {TRIGGER.SEVERITY}
💡 *Uso Atual*: {ITEM.LASTVALUE}%

📝 *Ação Recomendada*:
• Verificar processos com 'top'
• Analisar logs de aplicação
• Considerar escalonamento

🔗 *Zabbix*: http://10.1.50.31/zabbix/tr_events.php?triggerid={TRIGGER.ID}
```

### 🧠 Problemas de Memória
```
🧠 *ALERTA DE MEMÓRIA*

📊 *Servidor*: {HOST.NAME}
💾 *Métrica*: {ITEM.NAME}
🕐 *Horário*: {EVENT.DATE} {EVENT.TIME}

⚠️ *Status*: {TRIGGER.SEVERITY}
💡 *Uso Atual*: {ITEM.LASTVALUE}

📝 *Ação Recomendada*:
• Verificar processos com 'free -h'
• Analisar memory leaks
• Reiniciar serviços se necessário

🔗 *Zabbix*: http://10.1.50.31/zabbix/tr_events.php?triggerid={TRIGGER.ID}
```

### 🌐 Problemas de Rede
```
🌐 *ALERTA DE REDE*

📊 *Equipamento*: {HOST.NAME}
🔌 *Interface*: {ITEM.NAME}
🕐 *Horário*: {EVENT.DATE} {EVENT.TIME}

⚠️ *Status*: {TRIGGER.SEVERITY}
💡 *Estado*: {ITEM.LASTVALUE}

📝 *Ação Recomendada*:
• Verificar cabos e conexões
• Testar conectividade com ping
• Verificar configuração de switch

🔗 *Zabbix*: http://10.1.50.31/zabbix/tr_events.php?triggerid={TRIGGER.ID}
```

### 🔧 Problemas de Serviço
```
🔧 *ALERTA DE SERVIÇO*

📊 *Servidor*: {HOST.NAME}
⚙️ *Serviço*: {ITEM.NAME}
🕐 *Horário*: {EVENT.DATE} {EVENT.TIME}

⚠️ *Status*: {TRIGGER.SEVERITY}
💡 *Estado*: {ITEM.LASTVALUE}

📝 *Ação Recomendada*:
• Verificar status: systemctl status {ITEM.KEY}
• Analisar logs: journalctl -u {ITEM.KEY}
• Reiniciar se necessário

🔗 *Zabbix*: http://10.1.50.31/zabbix/tr_events.php?triggerid={TRIGGER.ID}
```

## 🎨 Emojis Recomendados

### Por Severidade:
- 🔴 **DISASTER**: Crítico
- 🟠 **HIGH**: Alto
- 🟡 **AVERAGE**: Médio
- 🔵 **WARNING**: Aviso
- ⚪ **INFORMATION**: Info
- ✅ **RESOLVED**: Resolvido

### Por Tipo:
- 🖥️ **CPU**: Processador
- 🧠 **Memory**: Memória
- 💾 **Disk**: Disco
- 🌐 **Network**: Rede
- 🔧 **Service**: Serviço
- 📊 **Host**: Servidor
- 🕐 **Time**: Horário
- 💡 **Value**: Valor
- 📝 **Description**: Descrição
- 🔗 **Link**: Link

## 📋 Macros Úteis do Zabbix

### Informações do Host:
- `{HOST.NAME}` - Nome do host
- `{HOST.IP}` - IP do host
- `{HOST.DNS}` - DNS do host

### Informações do Item:
- `{ITEM.NAME}` - Nome do item
- `{ITEM.KEY}` - Chave do item
- `{ITEM.LASTVALUE}` - Último valor

### Informações do Trigger:
- `{TRIGGER.NAME}` - Nome do trigger
- `{TRIGGER.SEVERITY}` - Severidade
- `{TRIGGER.DESCRIPTION}` - Descrição
- `{TRIGGER.ID}` - ID do trigger

### Informações do Evento:
- `{EVENT.DATE}` - Data do evento
- `{EVENT.TIME}` - Hora do evento
- `{EVENT.DURATION}` - Duração do problema
- `{EVENT.ID}` - ID do evento
- `{EVENT.RECOVERY.DATE}` - Data da recuperação
- `{EVENT.RECOVERY.TIME}` - Hora da recuperação

### Links Úteis:
- `{TRIGGER.URL}` - URL personalizada do trigger
- `http://10.1.50.31/zabbix/tr_events.php?triggerid={TRIGGER.ID}&eventid={EVENT.ID}` - Link direto para o evento
