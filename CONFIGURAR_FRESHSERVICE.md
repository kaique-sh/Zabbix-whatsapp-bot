# 🎫 Como Configurar o Freshservice

## ⚡ Configuração Rápida (Recomendado)

### Execute o script automático:

```bash
cd /home/kaiqueadm/Zabbix-whatsapp-bot/Zabbix-whatsapp-bot
bash configure-freshservice.sh
```

O script irá solicitar:
1. **Domínio do Freshservice** (ex: suaempresa.freshservice.com)
2. **API Key** (sua chave de API)
3. **Workspace ID** (opcional, apenas para MSP)

---

## 📋 Configuração Manual

### 1. Obter API Key do Freshservice

1. Acesse seu Freshservice
2. Clique no seu **avatar** (canto superior direito)
3. Selecione **"Perfil"** ou **"Profile"**
4. Role até **"Sua chave de API"** ou **"Your API Key"**
5. **Copie a chave**

### 2. Editar arquivo .env

```bash
nano .env
```

### 3. Adicionar as seguintes linhas:

```env
# Freshservice Configuration
FRESHSERVICE_DOMAIN=suaempresa.freshservice.com
FRESHSERVICE_API_KEY=sua_api_key_aqui
FRESHSERVICE_WORKSPACE_ID=
```

**Exemplo:**
```env
# Freshservice Configuration
FRESHSERVICE_DOMAIN=nextbot.freshservice.com
FRESHSERVICE_API_KEY=AbCdEfGh123456789
FRESHSERVICE_WORKSPACE_ID=
```

### 4. Salvar e sair

- Pressione `Ctrl + O` para salvar
- Pressione `Enter` para confirmar
- Pressione `Ctrl + X` para sair

### 5. Reiniciar o bot

```bash
pm2 restart nextbot-whatsapp-bot
```

---

## 🧪 Testar a Integração

### 1. No WhatsApp, envie para o bot:

```
!atendimento
```

### 2. O bot deve responder:

```
🎫 Abertura de Chamado

Por favor, descreva seu problema ou solicitação em uma mensagem.

Exemplo: Preciso de ajuda para configurar meu email
```

### 3. Envie uma mensagem de teste:

```
Teste de integração com Freshservice
```

### 4. O bot deve criar o ticket e responder:

```
✅ Chamado criado com sucesso!

📋 Número do Chamado: #1234
🔗 Link: https://suaempresa.freshservice.com/helpdesk/tickets/1234
...
```

---

## 🔍 Verificar Logs

```bash
pm2 logs nextbot-whatsapp-bot --lines 50
```

**Procure por:**
- ✅ "Freshservice integração inicializada"
- ✅ "Criando ticket no Freshservice"
- ✅ "Ticket criado com sucesso"

---

## ❌ Solução de Problemas

### Erro: "Serviço de atendimento indisponível"

**Causa:** Variáveis de ambiente não configuradas

**Solução:**
```bash
# Verificar se as variáveis estão no .env
grep FRESHSERVICE .env

# Se não aparecer nada, adicione as variáveis
bash configure-freshservice.sh
```

### Erro: "401 Unauthorized"

**Causa:** API Key inválida

**Solução:**
1. Verifique se copiou a API Key corretamente
2. Gere uma nova API Key no Freshservice
3. Atualize o .env
4. Reinicie o bot

### Erro: "404 Not Found"

**Causa:** Domínio incorreto

**Solução:**
1. Verifique se o domínio está correto
2. **NÃO** inclua `https://`
3. Exemplo correto: `suaempresa.freshservice.com`
4. Exemplo errado: `https://suaempresa.freshservice.com`

---

## 📝 Exemplo Completo

### Arquivo .env deve conter:

```env
# Outras configurações...
PORT=3000
COMPANY_NAME=NextBot Solutions

# Freshservice Configuration
FRESHSERVICE_DOMAIN=nextbot.freshservice.com
FRESHSERVICE_API_KEY=AbCdEfGh123456789
FRESHSERVICE_WORKSPACE_ID=
```

---

## ✅ Checklist

- [ ] API Key obtida do Freshservice
- [ ] Variáveis adicionadas ao .env
- [ ] Bot reiniciado
- [ ] Teste enviado (!atendimento)
- [ ] Ticket criado com sucesso
- [ ] Ticket aparece no Freshservice

---

## 🆘 Precisa de Ajuda?

### Verificar configuração:
```bash
grep FRESHSERVICE .env
```

### Ver logs em tempo real:
```bash
pm2 logs nextbot-whatsapp-bot
```

### Reiniciar bot:
```bash
pm2 restart nextbot-whatsapp-bot
```

---

## 🎉 Pronto!

Após configurar, seu bot estará pronto para criar tickets automaticamente no Freshservice!
