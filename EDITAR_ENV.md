# 🔧 Como Editar o .env com suas Credenciais

## ⚠️ IMPORTANTE: Você precisa substituir os valores de exemplo pelos valores reais!

---

## 📝 Passo a Passo:

### 1. Abrir o arquivo .env para edição:

```bash
nano /home/kaiqueadm/Zabbix-whatsapp-bot/Zabbix-whatsapp-bot/.env
```

### 2. Procurar estas linhas no final do arquivo:

```env
# Freshservice Configuration
FRESHSERVICE_DOMAIN=your-domain.freshservice.com
FRESHSERVICE_API_KEY=your-api-key-here
FRESHSERVICE_WORKSPACE_ID=
```

### 3. Substituir pelos valores reais:

**ANTES (valores de exemplo):**
```env
FRESHSERVICE_DOMAIN=your-domain.freshservice.com
FRESHSERVICE_API_KEY=your-api-key-here
```

**DEPOIS (valores reais):**
```env
FRESHSERVICE_DOMAIN=suaempresa.freshservice.com
FRESHSERVICE_API_KEY=AbCdEfGh123456789
```

---

## 🔑 Como Obter os Valores:

### **FRESHSERVICE_DOMAIN:**

1. Acesse seu Freshservice
2. Olhe a URL no navegador
3. Copie apenas o domínio

**Exemplo:**
- URL completa: `https://nextbot.freshservice.com/helpdesk/tickets`
- Domínio para usar: `nextbot.freshservice.com`

### **FRESHSERVICE_API_KEY:**

1. No Freshservice, clique no seu **avatar** (canto superior direito)
2. Selecione **"Perfil"** ou **"Profile"**
3. Role até **"Sua chave de API"** ou **"Your API Key"**
4. Clique em **"Mostrar"** ou **"Show"**
5. **Copie a chave**

**Exemplo de API Key:**
```
AbCdEfGh123456789XyZ
```

---

## 💻 Comandos para Editar:

### Opção 1: Usando nano (Recomendado)

```bash
nano /home/kaiqueadm/Zabbix-whatsapp-bot/Zabbix-whatsapp-bot/.env
```

**Como usar o nano:**
1. Use as setas para navegar
2. Edite os valores
3. Pressione `Ctrl + O` para salvar
4. Pressione `Enter` para confirmar
5. Pressione `Ctrl + X` para sair

### Opção 2: Usando vi/vim

```bash
vi /home/kaiqueadm/Zabbix-whatsapp-bot/Zabbix-whatsapp-bot/.env
```

**Como usar o vi:**
1. Pressione `i` para entrar no modo de inserção
2. Edite os valores
3. Pressione `Esc`
4. Digite `:wq` e pressione `Enter`

### Opção 3: Usando sed (Linha de comando)

```bash
# Substituir domínio
sed -i 's/your-domain.freshservice.com/SEU_DOMINIO_AQUI/g' .env

# Substituir API Key
sed -i 's/your-api-key-here/SUA_API_KEY_AQUI/g' .env
```

---

## ✅ Exemplo Completo:

### Antes da edição:
```env
PORT=3000
COMPANY_NAME=NextBot Solutions

# Freshservice Configuration
FRESHSERVICE_DOMAIN=your-domain.freshservice.com
FRESHSERVICE_API_KEY=your-api-key-here
FRESHSERVICE_WORKSPACE_ID=
```

### Depois da edição:
```env
PORT=3000
COMPANY_NAME=NextBot Solutions

# Freshservice Configuration
FRESHSERVICE_DOMAIN=nextbot.freshservice.com
FRESHSERVICE_API_KEY=AbCdEfGh123456789XyZ
FRESHSERVICE_WORKSPACE_ID=
```

---

## 🔄 Após Editar, Reinicie o Bot:

```bash
pm2 restart nextbot-whatsapp-bot
```

---

## 🧪 Verificar se Funcionou:

### 1. Ver os logs:
```bash
pm2 logs nextbot-whatsapp-bot --lines 20
```

### 2. Procurar por:
- ✅ **"Freshservice integração inicializada"** → Sucesso!
- ❌ **"Freshservice não configurado"** → Ainda não configurado

### 3. Testar no WhatsApp:
```
!atendimento
```

---

## 📋 Checklist:

```
[ ] Abri o arquivo .env
[ ] Encontrei as linhas do Freshservice
[ ] Substituí FRESHSERVICE_DOMAIN pelo meu domínio real
[ ] Substituí FRESHSERVICE_API_KEY pela minha API Key real
[ ] Salvei o arquivo
[ ] Reiniciei o bot (pm2 restart nextbot-whatsapp-bot)
[ ] Verifiquei os logs
[ ] Testei com !atendimento no WhatsApp
```

---

## ❌ Se Ainda Não Funcionar:

### Verificar se as variáveis estão corretas:
```bash
grep FRESHSERVICE /home/kaiqueadm/Zabbix-whatsapp-bot/Zabbix-whatsapp-bot/.env
```

### Deve mostrar algo como:
```
FRESHSERVICE_DOMAIN=nextbot.freshservice.com
FRESHSERVICE_API_KEY=AbCdEfGh123456789XyZ
FRESHSERVICE_WORKSPACE_ID=
```

### Se ainda mostrar "your-domain" ou "your-api-key":
```
❌ Você não editou o arquivo corretamente!
Edite novamente e substitua pelos valores reais.
```

---

## 🎯 Resumo Rápido:

```bash
# 1. Editar .env
nano /home/kaiqueadm/Zabbix-whatsapp-bot/Zabbix-whatsapp-bot/.env

# 2. Substituir:
#    FRESHSERVICE_DOMAIN=your-domain.freshservice.com
#    por
#    FRESHSERVICE_DOMAIN=seu-dominio-real.freshservice.com

# 3. Substituir:
#    FRESHSERVICE_API_KEY=your-api-key-here
#    por
#    FRESHSERVICE_API_KEY=sua-api-key-real

# 4. Salvar (Ctrl+O, Enter, Ctrl+X)

# 5. Reiniciar
pm2 restart nextbot-whatsapp-bot

# 6. Testar
# No WhatsApp: !atendimento
```

---

## 🆘 Precisa de Ajuda?

Se você não tem acesso ao Freshservice ou não sabe onde obter a API Key, entre em contato com o administrador do Freshservice da sua empresa.
