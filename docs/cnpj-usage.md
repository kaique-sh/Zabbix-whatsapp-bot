# 🏢 Guia de Uso - Consulta CNPJ

## 📋 Como Usar

### Comando Básico:
```
!cnpj [número do CNPJ]
```

### Exemplos:
```
!cnpj 33000167000001
!cnpj 33.000.167/0001-01
!cnpj 33000167000001
```

### Ajuda:
```
!cnpj
```

## ✅ Funcionalidades

### 🔍 **Validação Automática**
- ✅ Verifica formato (14 dígitos)
- ✅ Valida dígitos verificadores
- ✅ Aceita CNPJ com ou sem formatação
- ✅ Remove caracteres especiais automaticamente

### 📊 **Informações Retornadas**
- 🏛️ **Razão Social**
- 🏪 **Nome Fantasia**
- 📊 **Situação Cadastral**
- 🏭 **CNAE Principal**
- 📍 **Endereço Completo**
- 📞 **Telefone**
- 📧 **Email**
- 💰 **Capital Social**
- 📅 **Data de Abertura**

### 🛡️ **Tratamento de Erros**
- ❌ CNPJ inválido (formato ou dígitos)
- ❌ CNPJ não encontrado
- ⏰ Timeout na consulta
- 🚫 Limite de consultas atingido
- 🔄 Problemas de redirecionamento

## 🧪 Testes Disponíveis

### Teste Completo:
```bash
npm run test:cnpj
```

### Teste Rápido:
```bash
npm run test:cnpj:quick
```

### Teste com CNPJs Reais:
```bash
npm run test:cnpj:real
```

## 📝 Exemplos de Uso

### ✅ **CNPJ Válido e Encontrado:**
```
Usuário: !cnpj 33000167000001

Bot: 🏢 CONSULTA CNPJ

📋 CNPJ: 33.000.167/0001-01

🏛️ Razão Social:
PETRÓLEO BRASILEIRO S.A. - PETROBRAS

🏪 Nome Fantasia:
PETROBRAS

📊 Situação Cadastral:
ATIVA (desde 03/05/2005)

🏭 CNAE Principal:
Extração de petróleo e gás natural (06.00-0-00)

📍 Endereço:
Avenida República do Chile, nº 65, Centro, Rio de Janeiro, RJ, CEP: 20031-912

📞 Telefone:
(21) 3224-1510

💰 Capital Social:
R$ 295.000.000.000,00

📅 Data de Abertura:
03/05/2005

---
🤖 Voetur Assistente - Consulta CNPJ
```

### ❌ **CNPJ Inválido:**
```
Usuário: !cnpj 12345

Bot: ❌ CNPJ Inválido

O CNPJ deve conter 14 dígitos.

💡 Exemplo: !cnpj 27865757000102
```

### ❌ **CNPJ Não Encontrado:**
```
Usuário: !cnpj 12668623000116

Bot: ❌ CNPJ Não Encontrado

Este CNPJ não foi encontrado na base de dados da Receita Federal.

💡 Verifique se o número está correto.
```

### ❓ **Ajuda:**
```
Usuário: !cnpj

Bot: ❓ Como usar o comando CNPJ

📋 Sintaxe:
!cnpj [número do CNPJ]

💡 Exemplos:
• !cnpj 27865757000102
• !cnpj 27.865.757/0001-02

ℹ️ Informações retornadas:
• Razão Social
• Nome Fantasia  
• Situação Cadastral
• CNAE Principal
• Endereço Completo
• Telefone e Email
• Capital Social
• Data de Abertura

---
🤖 Voetur Assistente - Consulta CNPJ
```

## 🔧 Configuração Técnica

### API Utilizada:
- **URL**: https://www.cnpj.ws/pt-BR/cnpj/{CNPJ}
- **Método**: GET
- **Timeout**: 10 segundos
- **Redirecionamentos**: Até 3 automáticos

### Headers:
```
User-Agent: Voetur-WhatsApp-Bot/1.0
Accept: application/json
Accept-Language: pt-BR,pt;q=0.9,en;q=0.8
```

### Logs:
- ✅ Todas as consultas são logadas
- ✅ Erros detalhados para debugging
- ✅ Tempo de resposta registrado

## 🚫 Limitações

1. **Rate Limit**: A API pode limitar consultas excessivas
2. **Disponibilidade**: Depende da API externa cnpj.ws
3. **Dados**: Informações podem estar desatualizadas
4. **Timeout**: Consultas podem falhar por lentidão da API

## 💡 Dicas de Uso

1. **Formato**: Pode usar CNPJ com ou sem formatação
2. **Validação**: O bot valida antes de consultar a API
3. **Erro 404**: Significa que o CNPJ não existe na base
4. **Rate Limit**: Se atingir limite, aguarde alguns minutos
5. **Menu**: Use `!menu` para ver todas as opções disponíveis

## 🔍 Troubleshooting

| Problema | Solução |
|----------|---------|
| "CNPJ Inválido" | Verificar se tem 14 dígitos e dígitos verificadores corretos |
| "Não Encontrado" | CNPJ pode não existir ou estar inativo |
| "Timeout" | Tentar novamente, API pode estar lenta |
| "Rate Limit" | Aguardar alguns minutos antes de nova consulta |
| "Erro de Redirecionamento" | Problema temporário da API, tentar novamente |

## 📞 Suporte

Para problemas com a funcionalidade CNPJ:
- **Logs**: `npm run pm2:logs`
- **Teste**: `npm run test:cnpj:real`
- **Suporte**: https://suporte.voetur.com.br
