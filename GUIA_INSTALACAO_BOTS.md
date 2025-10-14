# 🤖 Guia de Instalação de Bots WhatsApp

## 📋 Visão Geral

Este guia mostra como instalar e executar bots WhatsApp usando o Terminal PTY do painel web.

---

## 🚀 Método 1: Terminal PTY (RECOMENDADO)

### **Por que usar o Terminal PTY?**
- ✅ **SEM restrições** - Funciona como SSH direto
- ✅ **Totalmente interativo** - Suporta editores (nano, vim)
- ✅ **Processos persistentes** - Bots continuam rodando
- ✅ **Sessões dedicadas** - Isoladas por usuário

### **Como Acessar**
1. Acesse: `http://localhost:4000/terminal-pty.html`
2. Faça login
3. Clique em **"Nova Sessão"**
4. Pronto! Use como se fosse SSH

---

## 📦 Instalando um Bot - Exemplo Completo

### **Exemplo: Gaara-Ultra-MD**

```bash
# 1. Criar diretório para bots
mkdir -p ~/bots
cd ~/bots

# 2. Clonar repositório
git clone https://github.com/xzzys26/Gaara-Ultra-MD
cd Gaara-Ultra-MD

# 3. Instalar dependências
npm install

# 4. Configurar (se necessário)
nano config.js
# ou
vim config.js

# 5. Executar bot
npm start
# ou
node index.js
# ou
node .
```

### **Exemplo: Bot com Python**

```bash
# 1. Criar diretório
mkdir -p ~/bots/meu-bot-python
cd ~/bots/meu-bot-python

# 2. Clonar repositório
git clone https://github.com/usuario/bot-python
cd bot-python

# 3. Criar ambiente virtual (opcional)
python3 -m venv venv
source venv/bin/activate

# 4. Instalar dependências
pip install -r requirements.txt

# 5. Executar bot
python3 bot.py
```

---

## 🔧 Comandos Comuns para Instalação de Bots

### **Gerenciadores de Pacotes do Sistema**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install git nodejs npm python3 python3-pip ffmpeg imagemagick -y

# Fedora/RHEL
sudo dnf install git nodejs npm python3 python3-pip ffmpeg ImageMagick -y

# Arch Linux
sudo pacman -S git nodejs npm python python-pip ffmpeg imagemagick

# Termux (Android)
pkg update
pkg install git nodejs ffmpeg imagemagick -y
```

### **Node.js e NPM**

```bash
# Instalar dependências do bot
npm install

# Instalar dependência específica
npm install whatsapp-web.js
npm install @whiskeysockets/baileys

# Instalar globalmente
npm install -g pm2

# Limpar cache
npm cache clean --force

# Reinstalar tudo
rm -rf node_modules package-lock.json
npm install
```

### **Python e PIP**

```bash
# Instalar dependências
pip install -r requirements.txt

# Instalar biblioteca específica
pip install selenium
pip install playwright

# Atualizar pip
pip install --upgrade pip

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate
```

### **Git**

```bash
# Clonar repositório
git clone https://github.com/usuario/repo.git

# Clonar branch específica
git clone -b branch-name https://github.com/usuario/repo.git

# Atualizar repositório
git pull

# Ver status
git status

# Configurar git
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

---

## 🎯 Executando Bots com PM2

### **Por que usar PM2?**
- ✅ Mantém bot rodando em background
- ✅ Reinicia automaticamente se cair
- ✅ Gerencia múltiplos bots
- ✅ Logs organizados

### **Comandos PM2**

```bash
# Instalar PM2 (se não tiver)
npm install -g pm2

# Iniciar bot
pm2 start index.js --name "meu-bot"

# Iniciar com Node.js
pm2 start "npm start" --name "meu-bot"

# Listar bots rodando
pm2 list

# Ver logs
pm2 logs meu-bot

# Parar bot
pm2 stop meu-bot

# Reiniciar bot
pm2 restart meu-bot

# Deletar bot
pm2 delete meu-bot

# Salvar configuração
pm2 save

# Iniciar PM2 no boot
pm2 startup
```

### **Exemplo de ecosystem.config.js para Bot**

```javascript
module.exports = {
  apps: [{
    name: 'gaara-bot',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

Executar:
```bash
pm2 start ecosystem.config.js
```

---

## 📝 Estrutura Típica de um Bot

```
meu-bot/
├── node_modules/          # Dependências (não commitar)
├── session/               # Sessão do WhatsApp
├── database/              # Banco de dados
├── config.js              # Configurações
├── index.js               # Arquivo principal
├── package.json           # Dependências do projeto
├── .env                   # Variáveis de ambiente
└── README.md              # Documentação
```

---

## 🔍 Troubleshooting

### **Erro: "git: command not found"**

```bash
# Ubuntu/Debian
sudo apt install git -y

# Fedora
sudo dnf install git -y
```

### **Erro: "node: command not found"**

```bash
# Ubuntu/Debian
sudo apt install nodejs npm -y

# Ou instalar via NVM (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
```

### **Erro: "Permission denied"**

```bash
# Dar permissão de execução
chmod +x script.sh

# Executar com sudo (se necessário)
sudo comando
```

### **Erro: "ENOSPC: System limit for number of file watchers reached"**

```bash
# Aumentar limite de watchers
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### **Erro: "Cannot find module"**

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### **Bot não conecta ao WhatsApp**

```bash
# Deletar sessão antiga
rm -rf session/
rm -rf .wwebjs_auth/

# Reiniciar bot
pm2 restart meu-bot
pm2 logs meu-bot
```

---

## 🎨 Editores de Texto no Terminal

### **Nano (Mais Fácil)**

```bash
# Abrir arquivo
nano config.js

# Atalhos:
# Ctrl+O - Salvar
# Ctrl+X - Sair
# Ctrl+K - Cortar linha
# Ctrl+U - Colar
```

### **Vim (Mais Poderoso)**

```bash
# Abrir arquivo
vim config.js

# Comandos básicos:
# i - Entrar no modo de inserção
# Esc - Sair do modo de inserção
# :w - Salvar
# :q - Sair
# :wq - Salvar e sair
# :q! - Sair sem salvar
```

---

## 📊 Monitoramento

### **Ver Processos**

```bash
# Processos do sistema
ps aux | grep node

# Processos PM2
pm2 list
pm2 monit

# Uso de recursos
htop
top
```

### **Ver Logs**

```bash
# Logs do PM2
pm2 logs
pm2 logs meu-bot --lines 100

# Logs do sistema
tail -f /var/log/syslog

# Logs personalizados
tail -f logs/bot.log
```

### **Uso de Disco**

```bash
# Espaço em disco
df -h

# Tamanho de diretórios
du -sh *
du -sh ~/bots/*
```

---

## 🔐 Segurança

### **Variáveis de Ambiente**

Nunca commite senhas! Use arquivo `.env`:

```bash
# Criar arquivo .env
nano .env
```

Conteúdo:
```env
API_KEY=sua-chave-aqui
DATABASE_URL=sua-url-aqui
PHONE_NUMBER=5511999999999
```

No código:
```javascript
require('dotenv').config();
const apiKey = process.env.API_KEY;
```

### **Gitignore**

Crie `.gitignore`:
```
node_modules/
.env
session/
.wwebjs_auth/
database/*.db
*.log
```

---

## 🚀 Dicas Avançadas

### **Executar em Background com Screen**

```bash
# Instalar screen
sudo apt install screen -y

# Criar sessão
screen -S meu-bot

# Executar bot
node index.js

# Desanexar: Ctrl+A, depois D

# Listar sessões
screen -ls

# Reanexar
screen -r meu-bot

# Matar sessão
screen -X -S meu-bot quit
```

### **Executar em Background com Tmux**

```bash
# Instalar tmux
sudo apt install tmux -y

# Criar sessão
tmux new -s meu-bot

# Executar bot
node index.js

# Desanexar: Ctrl+B, depois D

# Listar sessões
tmux ls

# Reanexar
tmux attach -t meu-bot
```

### **Backup Automático**

```bash
# Script de backup
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf ~/backups/bot_$DATE.tar.gz ~/bots/meu-bot/

# Adicionar ao crontab
crontab -e

# Backup diário às 3h
0 3 * * * /home/user/backup.sh
```

---

## 📚 Recursos Úteis

### **Documentação**
- Node.js: https://nodejs.org/docs
- NPM: https://docs.npmjs.com
- PM2: https://pm2.keymetrics.io
- Git: https://git-scm.com/doc

### **Bibliotecas WhatsApp**
- whatsapp-web.js: https://github.com/pedroslopez/whatsapp-web.js
- Baileys: https://github.com/WhiskeySockets/Baileys
- Venom: https://github.com/orkestral/venom

---

## ✅ Checklist de Instalação

- [ ] Terminal PTY acessível
- [ ] Git instalado
- [ ] Node.js e NPM instalados
- [ ] PM2 instalado (opcional)
- [ ] Repositório clonado
- [ ] Dependências instaladas
- [ ] Configurações ajustadas
- [ ] Bot executando
- [ ] QR Code escaneado
- [ ] Bot conectado ao WhatsApp

---

**Pronto!** Agora você pode instalar e executar qualquer bot WhatsApp pelo painel web! 🎉
