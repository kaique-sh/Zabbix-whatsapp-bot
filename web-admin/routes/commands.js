/**
 * Rotas para gerenciamento de comandos customizados
 */

const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getDatabase } = require('../database/init');

const router = express.Router();

/**
 * GET /api/commands
 * Listar todos os comandos customizados
 */
router.get('/', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  db.all(
    `SELECT c.*, u.username as created_by_name 
     FROM custom_commands c 
     LEFT JOIN users u ON c.created_by = u.id 
     ORDER BY c.created_at DESC`,
    (err, commands) => {
      db.close();
      
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar comandos'
        });
      }

      res.json({
        success: true,
        commands: commands || []
      });
    }
  );
});

/**
 * POST /api/commands
 * Criar novo comando customizado
 */
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { command, response, description } = req.body;

  if (!command || !response) {
    return res.status(400).json({
      success: false,
      message: 'Comando e resposta são obrigatórios'
    });
  }

  // Validar formato do comando
  if (!command.startsWith('!')) {
    return res.status(400).json({
      success: false,
      message: 'Comando deve começar com !'
    });
  }

  const db = getDatabase();
  
  // Verificar se comando já existe
  db.get(
    "SELECT id FROM custom_commands WHERE command = ?",
    [command],
    (err, existing) => {
      if (err) {
        db.close();
        return res.status(500).json({
          success: false,
          message: 'Erro ao verificar comando'
        });
      }

      if (existing) {
        db.close();
        return res.status(400).json({
          success: false,
          message: 'Comando já existe'
        });
      }

      // Inserir novo comando
      db.run(
        `INSERT INTO custom_commands (command, response, description, created_by) 
         VALUES (?, ?, ?, ?)`,
        [command, response, description, req.user.id],
        function(err) {
          if (err) {
            db.close();
            return res.status(500).json({
              success: false,
              message: 'Erro ao criar comando'
            });
          }

          // Log da ação
          logActivity(req.user.id, 'COMMAND_CREATE', `Comando criado: ${command}`, req.ip);

          db.close();
          res.json({
            success: true,
            message: 'Comando criado com sucesso',
            commandId: this.lastID
          });
        }
      );
    }
  );
});

/**
 * PUT /api/commands/:id
 * Atualizar comando existente
 */
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { command, response, description, active } = req.body;

  if (!command || !response) {
    return res.status(400).json({
      success: false,
      message: 'Comando e resposta são obrigatórios'
    });
  }

  const db = getDatabase();
  
  // Verificar se comando existe
  db.get(
    "SELECT * FROM custom_commands WHERE id = ?",
    [id],
    (err, existing) => {
      if (err) {
        db.close();
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar comando'
        });
      }

      if (!existing) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Comando não encontrado'
        });
      }

      // Atualizar comando
      db.run(
        `UPDATE custom_commands 
         SET command = ?, response = ?, description = ?, active = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [command, response, description, active !== undefined ? active : 1, id],
        function(err) {
          if (err) {
            db.close();
            return res.status(500).json({
              success: false,
              message: 'Erro ao atualizar comando'
            });
          }

          // Log da ação
          logActivity(req.user.id, 'COMMAND_UPDATE', `Comando atualizado: ${command}`, req.ip);

          db.close();
          res.json({
            success: true,
            message: 'Comando atualizado com sucesso'
          });
        }
      );
    }
  );
});

/**
 * DELETE /api/commands/:id
 * Deletar comando
 */
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  // Buscar comando para log
  db.get(
    "SELECT command FROM custom_commands WHERE id = ?",
    [id],
    (err, command) => {
      if (err) {
        db.close();
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar comando'
        });
      }

      if (!command) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Comando não encontrado'
        });
      }

      // Deletar comando
      db.run(
        "DELETE FROM custom_commands WHERE id = ?",
        [id],
        function(err) {
          if (err) {
            db.close();
            return res.status(500).json({
              success: false,
              message: 'Erro ao deletar comando'
            });
          }

          // Log da ação
          logActivity(req.user.id, 'COMMAND_DELETE', `Comando deletado: ${command.command}`, req.ip);

          db.close();
          res.json({
            success: true,
            message: 'Comando deletado com sucesso'
          });
        }
      );
    }
  );
});

/**
 * POST /api/commands/:id/toggle
 * Ativar/Desativar comando
 */
router.post('/:id/toggle', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  // Buscar comando atual
  db.get(
    "SELECT * FROM custom_commands WHERE id = ?",
    [id],
    (err, command) => {
      if (err) {
        db.close();
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar comando'
        });
      }

      if (!command) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Comando não encontrado'
        });
      }

      const newStatus = command.active ? 0 : 1;

      // Atualizar status
      db.run(
        "UPDATE custom_commands SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newStatus, id],
        function(err) {
          if (err) {
            db.close();
            return res.status(500).json({
              success: false,
              message: 'Erro ao alterar status do comando'
            });
          }

          // Log da ação
          const action = newStatus ? 'ativado' : 'desativado';
          logActivity(req.user.id, 'COMMAND_TOGGLE', `Comando ${action}: ${command.command}`, req.ip);

          db.close();
          res.json({
            success: true,
            message: `Comando ${action} com sucesso`,
            active: newStatus
          });
        }
      );
    }
  );
});

/**
 * GET /api/commands/active
 * Listar apenas comandos ativos (para uso do bot)
 */
router.get('/active', (req, res) => {
  const db = getDatabase();
  
  db.all(
    "SELECT command, response FROM custom_commands WHERE active = 1 ORDER BY command",
    (err, commands) => {
      db.close();
      
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar comandos ativos'
        });
      }

      // Converter para formato de mapa para fácil acesso
      const commandMap = {};
      commands.forEach(cmd => {
        commandMap[cmd.command.toLowerCase()] = cmd.response;
      });

      res.json({
        success: true,
        commands: commandMap,
        count: commands.length
      });
    }
  );
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
