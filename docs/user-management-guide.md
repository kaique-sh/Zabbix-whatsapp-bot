# 👥 Sistema de Gerenciamento de Usuários - Voetur Bot

## 📋 Visão Geral

Sistema completo de gerenciamento de usuários para o painel administrativo do Voetur Bot, com controle de acesso baseado em roles, interface web responsiva e APIs RESTful.

## 🔐 Funcionalidades Implementadas

### **1. Autenticação e Autorização**
- ✅ Login seguro com JWT
- ✅ Controle de acesso baseado em roles
- ✅ Middleware de autenticação
- ✅ Verificação de usuário ativo
- ✅ Logs de atividade

### **2. Gerenciamento de Usuários**
- ✅ Registro de novos usuários (apenas admins)
- ✅ Listagem de usuários
- ✅ Edição de usuários
- ✅ Ativação/desativação de contas
- ✅ Deleção de usuários
- ✅ Proteção do usuário admin principal

### **3. Interface Web**
- ✅ Página de gerenciamento responsiva
- ✅ Formulários de registro e edição
- ✅ Tabela de usuários com filtros
- ✅ Modal de edição
- ✅ Alertas e confirmações
- ✅ Design consistente com o painel

## 🎯 Roles e Permissões

### **Admin**
- Acesso total ao sistema
- Pode criar, editar e deletar usuários
- Acesso a todas as funcionalidades
- Não pode ser desativado

### **User**
- Acesso básico ao painel
- Pode usar funcionalidades do bot
- Não pode gerenciar outros usuários

### **Viewer**
- Apenas visualização
- Acesso limitado de leitura
- Não pode fazer alterações

## 🚀 Como Usar

### **1. Acessar o Gerenciamento**
```bash
# Iniciar o painel
npm run web:start

# Acessar
http://localhost:4000
Login: admin / admin123
```

### **2. Navegar para Usuários**
- Clique em "Usuários" no menu principal
- Apenas administradores têm acesso

### **3. Adicionar Novo Usuário**
1. Preencha o formulário "Adicionar Novo Usuário"
2. Defina username, email, senha e role
3. Clique em "Adicionar Usuário"

### **4. Gerenciar Usuários Existentes**
- **Editar**: Clique no botão amarelo (lápis)
- **Deletar**: Clique no botão vermelho (lixeira)
- **Status**: Ative/desative na edição

## 🔧 APIs Disponíveis

### **POST /api/auth/register**
Registrar novo usuário (apenas admins)
```json
{
  "username": "novo_user",
  "email": "user@exemplo.com",
  "password": "senha123",
  "role": "user"
}
```

### **GET /api/auth/users**
Listar todos os usuários (apenas admins)

### **PUT /api/auth/users/:id**
Atualizar usuário (apenas admins)
```json
{
  "username": "user_atualizado",
  "email": "novo@exemplo.com",
  "role": "viewer",
  "is_active": true
}
```

### **DELETE /api/auth/users/:id**
Deletar usuário (apenas admins)

## 🧪 Testes

### **Teste Automatizado**
```bash
npm run test:users
```

### **Teste Manual**
1. Acesse http://localhost:4000/users.html
2. Teste todas as funcionalidades:
   - Adicionar usuário
   - Editar usuário
   - Alterar status
   - Deletar usuário

## 📊 Banco de Dados

### **Tabela: users**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  is_active BOOLEAN DEFAULT 1,
  created_by INTEGER,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users (id)
);
```

### **Tabela: activity_logs**
```sql
CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🔒 Segurança

### **Validações Implementadas**
- ✅ Senha mínima de 6 caracteres
- ✅ Email válido obrigatório
- ✅ Username único
- ✅ Roles válidos apenas
- ✅ Hash seguro de senhas (bcrypt)
- ✅ Proteção contra SQL injection
- ✅ Logs de todas as ações

### **Proteções**
- ✅ Admin principal não pode ser deletado
- ✅ Admin não pode ser desativado
- ✅ Apenas admins podem gerenciar usuários
- ✅ Verificação de usuário ativo
- ✅ Tokens JWT com expiração

## 📱 Interface Responsiva

### **Características**
- ✅ Design mobile-first
- ✅ Grid responsivo
- ✅ Modal de edição
- ✅ Alertas visuais
- ✅ Badges de status e role
- ✅ Tabela responsiva
- ✅ Navegação intuitiva

## 🛠️ Comandos Úteis

```bash
# Iniciar painel web
npm run web:start

# Resetar banco de dados
npm run web:reset

# Testar sistema de usuários
npm run test:users

# Testar painel completo
npm run test:web

# Sistema completo (bot + painel)
npm run start:complete
```

## 📋 Logs de Atividade

O sistema registra automaticamente:
- ✅ Tentativas de login (sucesso/falha)
- ✅ Registro de novos usuários
- ✅ Atualizações de usuários
- ✅ Deleção de usuários
- ✅ Logout de usuários
- ✅ IP e User-Agent

## 🎯 Próximos Passos

### **Melhorias Futuras**
- [ ] Recuperação de senha por email
- [ ] Autenticação de dois fatores (2FA)
- [ ] Histórico detalhado de ações
- [ ] Exportação de relatórios
- [ ] Integração com LDAP/AD
- [ ] Sessões múltiplas por usuário

## 👨‍💻 Desenvolvedor

**Desenvolvido pelo Analista Kaique Rodrigues**

Sistema de alertas Zabbix via WhatsApp com painel web de administração completo.

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs: `pm2 logs voetur-web-admin`
2. Execute os testes: `npm run test:users`
3. Consulte a documentação técnica
4. Verifique o banco de dados: `web-admin/database/admin.db`
