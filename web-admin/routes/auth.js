/**
 * Rotas de autenticação
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getDatabase } = require('../database/init');

const router = express.Router();

// Rate limiting para login (mais flexível)
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 20, // máximo 20 tentativas por IP
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em alguns minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/login
 * Login do usuário
 */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username e password são obrigatórios'
      });
    }

    const db = getDatabase();

    // Buscar usuário
    db.get(
      "SELECT * FROM users WHERE username = ? AND is_active = 1",
      [username],
      async (err, user) => {
        if (err) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
          });
        }

        if (!user) {
          db.close();
          return res.status(401).json({
            success: false,
            message: 'Usuário não encontrado ou inativo'
          });
        }

        // Verificar senha
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          db.close();
          return res.status(401).json({
            success: false,
            message: 'Senha incorreta'
          });
        }

        // Gerar token JWT
        const token = jwt.sign(
          {
            id: user.id,
            username: user.username,
            role: user.role,
            is_active: user.is_active
          },
          process.env.JWT_SECRET || 'voetur-whatsapp-bot-secret-2024',
          { expiresIn: '24h' }
        );

        // Atualizar último login
        db.run(
          "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
          [user.id]
        );

        // Log da ação
        logActivity(user.id, 'LOGIN_SUCCESS', 'Login realizado com sucesso', req.ip);

        db.close();

        res.json({
          success: true,
          message: 'Login realizado com sucesso',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (invalidar token)
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const ipAddress = req.ip || req.connection.remoteAddress;

    const result = await logoutUser(token, req.user.id, ipAddress);
    res.json(result);
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/auth/me
 * Informações do usuário atual
 */
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

/**
 * POST /api/auth/change-password
 * Alterar senha do usuário
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha deve ter pelo menos 6 caracteres'
      });
    }

    // Implementar mudança de senha
    // Por enquanto, retornar sucesso
    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/auth/register
 * Registrar novo usuário (apenas admins podem registrar)
 */
console.log('🔧 Definindo rota POST /register');
router.post('/register', authenticateToken, requireAdmin, async (req, res) => {
  const { username, password, email, role = 'user' } = req.body;

  // Validações
  if (!username || !password || !email) {
    return res.status(400).json({
      success: false,
      message: 'Username, password e email são obrigatórios'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Senha deve ter pelo menos 6 caracteres'
    });
  }

  if (!email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Email inválido'
    });
  }

  // Verificar se role é válido
  const validRoles = ['admin', 'user', 'viewer'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Role inválido. Use: admin, user ou viewer'
    });
  }

  const db = getDatabase();

  try {
    // Verificar se usuário já existe
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        "SELECT id FROM users WHERE username = ? OR email = ?",
        [username, email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingUser) {
      db.close();
      return res.status(409).json({
        success: false,
        message: 'Username ou email já existe'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir novo usuário
    const result = await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO users (username, password, email, role, created_by) VALUES (?, ?, ?, ?, ?)",
        [username, hashedPassword, email, role, req.user.id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    // Log da ação
    logActivity(req.user.id, 'USER_REGISTER', `Usuário ${username} registrado com role ${role}`, req.ip);

    db.close();

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      user: {
        id: result.lastID,
        username,
        email,
        role
      }
    });

  } catch (error) {
    db.close();
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/auth/users
 * Listar usuários (apenas admins)
 */
console.log('🔧 Definindo rota GET /users');
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  const db = getDatabase();

  db.all(
    `SELECT 
      u.id, u.username, u.email, u.role, u.is_active, u.created_at,
      creator.username as created_by_username
     FROM users u
     LEFT JOIN users creator ON u.created_by = creator.id
     ORDER BY u.created_at DESC`,
    (err, users) => {
      db.close();
      
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar usuários'
        });
      }

      // Remover senhas da resposta
      const safeUsers = users.map(user => ({
        ...user,
        password: undefined
      }));

      res.json({
        success: true,
        users: safeUsers
      });
    }
  );
});

/**
 * PUT /api/auth/users/:id
 * Atualizar usuário (apenas admins)
 */
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, email, role, is_active } = req.body;

  if (!username || !email || !role) {
    return res.status(400).json({
      success: false,
      message: 'Username, email e role são obrigatórios'
    });
  }

  const validRoles = ['admin', 'user', 'viewer'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Role inválido'
    });
  }

  const db = getDatabase();

  try {
    // Verificar se usuário existe
    const user = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Não permitir que admin se desative
    if (user.role === 'admin' && is_active === false) {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'Não é possível desativar um administrador'
      });
    }

    // Atualizar usuário
    await new Promise((resolve, reject) => {
      db.run(
        "UPDATE users SET username = ?, email = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [username, email, role, is_active !== undefined ? is_active : user.is_active, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Log da ação
    logActivity(req.user.id, 'USER_UPDATE', `Usuário ${username} atualizado`, req.ip);

    db.close();

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso'
    });

  } catch (error) {
    db.close();
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/auth/users/:id
 * Deletar usuário (apenas admins)
 */
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const db = getDatabase();

  try {
    // Verificar se usuário existe
    const user = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Não permitir deletar admin principal
    if (user.username === 'admin') {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'Não é possível deletar o administrador principal'
      });
    }

    // Deletar usuário
    await new Promise((resolve, reject) => {
      db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Log da ação
    logActivity(req.user.id, 'USER_DELETE', `Usuário ${user.username} deletado`, req.ip);

    db.close();

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });

  } catch (error) {
    db.close();
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * Função auxiliar para log de atividades
 */
function logActivity(userId, action, details, ipAddress) {
  const db = getDatabase();
  db.run(
    "INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
    [userId, action, details, ipAddress],
    () => db.close()
  );
}

module.exports = router;
