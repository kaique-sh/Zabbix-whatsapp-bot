/**
 * Rotas para configurações do sistema
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getDatabase } = require('../database/init');

const router = express.Router();

/**
 * GET /api/settings
 * Listar todas as configurações
 */
router.get('/', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  db.all(
    `SELECT s.*, u.username as updated_by_name 
     FROM settings s 
     LEFT JOIN users u ON s.updated_by = u.id 
     ORDER BY s.key`,
    (err, settings) => {
      db.close();
      
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar configurações'
        });
      }

      res.json({
        success: true,
        settings: settings || []
      });
    }
  );
});

/**
 * PUT /api/settings/:key
 * Atualizar configuração específica
 */
router.put('/:key', authenticateToken, requireAdmin, (req, res) => {
  const { key } = req.params;
  const { value, description } = req.body;

  if (value === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Valor é obrigatório'
    });
  }

  const db = getDatabase();
  
  // Verificar se configuração existe
  db.get(
    "SELECT * FROM settings WHERE key = ?",
    [key],
    (err, existing) => {
      if (err) {
        db.close();
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar configuração'
        });
      }

      if (existing) {
        // Atualizar existente
        db.run(
          `UPDATE settings 
           SET value = ?, description = COALESCE(?, description), updated_at = CURRENT_TIMESTAMP, updated_by = ? 
           WHERE key = ?`,
          [value, description, req.user.id, key],
          function(err) {
            if (err) {
              db.close();
              return res.status(500).json({
                success: false,
                message: 'Erro ao atualizar configuração'
              });
            }

            // Log da ação
            logActivity(req.user.id, 'SETTING_UPDATE', `Configuração atualizada: ${key} = ${value}`, req.ip);

            db.close();
            res.json({
              success: true,
              message: 'Configuração atualizada com sucesso'
            });
          }
        );
      } else {
        // Criar nova
        db.run(
          `INSERT INTO settings (key, value, description, updated_by) 
           VALUES (?, ?, ?, ?)`,
          [key, value, description, req.user.id],
          function(err) {
            if (err) {
              db.close();
              return res.status(500).json({
                success: false,
                message: 'Erro ao criar configuração'
              });
            }

            // Log da ação
            logActivity(req.user.id, 'SETTING_CREATE', `Configuração criada: ${key} = ${value}`, req.ip);

            db.close();
            res.json({
              success: true,
              message: 'Configuração criada com sucesso'
            });
          }
        );
      }
    }
  );
});

/**
 * GET /api/settings/env
 * Listar variáveis de ambiente (apenas leitura)
 */
router.get('/env', authenticateToken, (req, res) => {
  try {
    const envPath = path.join(__dirname, '../../.env');
    
    if (!fs.existsSync(envPath)) {
      return res.json({
        success: true,
        env: {},
        message: 'Arquivo .env não encontrado'
      });
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=');
          
          // Mascarar valores sensíveis
          if (key.toLowerCase().includes('token') || 
              key.toLowerCase().includes('secret') || 
              key.toLowerCase().includes('password')) {
            value = value ? '***masked***' : '';
          }
          
          envVars[key] = value;
        }
      }
    });

    res.json({
      success: true,
      env: envVars
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao ler variáveis de ambiente'
    });
  }
});

/**
 * PUT /api/settings/env/:key
 * Atualizar variável de ambiente
 */
router.put('/env/:key', authenticateToken, requireAdmin, (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  if (value === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Valor é obrigatório'
    });
  }

  try {
    const envPath = path.join(__dirname, '../../.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const lines = envContent.split('\n');
    let keyFound = false;
    
    // Procurar e atualizar a linha existente
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith(`${key}=`)) {
        lines[i] = `${key}=${value}`;
        keyFound = true;
        break;
      }
    }
    
    // Se não encontrou, adicionar no final
    if (!keyFound) {
      lines.push(`${key}=${value}`);
    }
    
    // Escrever arquivo
    fs.writeFileSync(envPath, lines.join('\n'));
    
    // Log da ação
    logActivity(req.user.id, 'ENV_UPDATE', `Variável de ambiente atualizada: ${key}`, req.ip);

    res.json({
      success: true,
      message: 'Variável de ambiente atualizada com sucesso',
      note: 'Reinicie o bot para aplicar as mudanças'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar variável de ambiente'
    });
  }
});

/**
 * GET /api/settings/backup
 * Fazer backup das configurações
 */
router.get('/backup', authenticateToken, requireAdmin, (req, res) => {
  const db = getDatabase();
  
  // Buscar todas as configurações
  db.all("SELECT * FROM settings ORDER BY key", (err, settings) => {
    if (err) {
      db.close();
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar backup'
      });
    }

    // Buscar comandos customizados
    db.all("SELECT * FROM custom_commands ORDER BY command", (err, commands) => {
      db.close();
      
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao gerar backup'
        });
      }

      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        settings: settings || [],
        custom_commands: commands || []
      };

      // Log da ação
      logActivity(req.user.id, 'BACKUP_CREATE', 'Backup das configurações gerado', req.ip);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="voetur-bot-backup-${Date.now()}.json"`);
      res.json(backup);
    });
  });
});

/**
 * POST /api/settings/restore
 * Restaurar configurações do backup
 */
router.post('/restore', authenticateToken, requireAdmin, (req, res) => {
  const { backup } = req.body;

  if (!backup || !backup.settings) {
    return res.status(400).json({
      success: false,
      message: 'Backup inválido'
    });
  }

  const db = getDatabase();
  
  db.serialize(() => {
    // Começar transação
    db.run("BEGIN TRANSACTION");

    try {
      // Restaurar configurações
      const settingsStmt = db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, description, updated_by) 
        VALUES (?, ?, ?, ?)
      `);

      backup.settings.forEach(setting => {
        settingsStmt.run([setting.key, setting.value, setting.description, req.user.id]);
      });
      settingsStmt.finalize();

      // Restaurar comandos customizados se existirem
      if (backup.custom_commands && backup.custom_commands.length > 0) {
        const commandsStmt = db.prepare(`
          INSERT OR REPLACE INTO custom_commands (command, response, description, active, created_by) 
          VALUES (?, ?, ?, ?, ?)
        `);

        backup.custom_commands.forEach(command => {
          commandsStmt.run([
            command.command, 
            command.response, 
            command.description, 
            command.active, 
            req.user.id
          ]);
        });
        commandsStmt.finalize();
      }

      // Confirmar transação
      db.run("COMMIT", (err) => {
        db.close();
        
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Erro ao restaurar backup'
          });
        }

        // Log da ação
        logActivity(req.user.id, 'BACKUP_RESTORE', 'Configurações restauradas do backup', req.ip);

        res.json({
          success: true,
          message: 'Backup restaurado com sucesso'
        });
      });
    } catch (error) {
      db.run("ROLLBACK");
      db.close();
      
      res.status(500).json({
        success: false,
        message: 'Erro ao restaurar backup'
      });
    }
  });
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
