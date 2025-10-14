const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const execPromise = promisify(exec);

// Middleware de autenticação
const { authenticateToken } = require('../middleware/auth');

// Arquivo de configuração dos bots
const BOTS_CONFIG_FILE = path.join(__dirname, '../database/bots.json');

// Carregar configuração de bots
async function loadBotsConfig() {
    try {
        const data = await fs.readFile(BOTS_CONFIG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Se o arquivo não existir, criar com array vazio
        await saveBotsConfig([]);
        return [];
    }
}

// Salvar configuração de bots
async function saveBotsConfig(bots) {
    await fs.writeFile(BOTS_CONFIG_FILE, JSON.stringify(bots, null, 2));
}

// Verificar status do bot via PM2
async function getBotStatus(botId) {
    try {
        const { stdout } = await execPromise(`pm2 jlist`);
        const processes = JSON.parse(stdout);
        const bot = processes.find(p => p.name === botId);
        
        if (bot) {
            return {
                status: bot.pm2_env.status === 'online' ? 'online' : 'offline',
                uptime: bot.pm2_env.pm_uptime,
                restarts: bot.pm2_env.restart_time,
                memory: bot.monit.memory,
                cpu: bot.monit.cpu
            };
        }
        
        return { status: 'offline' };
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        return { status: 'unknown' };
    }
}

// GET /api/bots - Listar todos os bots
router.get('/', authenticateToken, async (req, res) => {
    try {
        const allBots = await loadBotsConfig();
        
        // Filtrar bots por usuário (admins veem todos, usuários comuns veem apenas os seus)
        let bots;
        if (req.user.role === 'admin') {
            bots = allBots; // Admin vê todos os bots
        } else {
            bots = allBots.filter(bot => bot.userId === req.user.id); // Usuário vê apenas seus bots
        }
        
        // Atualizar status de cada bot
        const botsWithStatus = await Promise.all(
            bots.map(async (bot) => {
                const status = await getBotStatus(bot.id);
                return { ...bot, ...status };
            })
        );
        
        res.json(botsWithStatus);
    } catch (error) {
        console.error('Erro ao listar bots:', error);
        res.status(500).json({ error: 'Erro ao listar bots' });
    }
});

// GET /api/bots/:id - Obter detalhes de um bot
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const bots = await loadBotsConfig();
        const bot = bots.find(b => b.id === req.params.id);
        
        if (!bot) {
            return res.status(404).json({ error: 'Bot não encontrado' });
        }
        
        // Verificar se o usuário tem permissão para ver este bot
        if (req.user.role !== 'admin' && bot.userId !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado. Este bot pertence a outro usuário.' });
        }
        
        // Atualizar status
        const status = await getBotStatus(bot.id);
        
        res.json({ ...bot, ...status });
    } catch (error) {
        console.error('Erro ao obter bot:', error);
        res.status(500).json({ error: 'Erro ao obter bot' });
    }
});

// POST /api/bots - Adicionar novo bot
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, path: botPath, script, port, autoStart, installDeps } = req.body;
        
        // Validações
        if (!name || !botPath || !script) {
            return res.status(400).json({ error: 'Campos obrigatórios: name, path, script' });
        }
        
        // Verificar se o caminho existe
        try {
            await fs.access(botPath);
        } catch {
            return res.status(400).json({ error: 'Caminho do bot não existe' });
        }
        
        // Verificar se o script existe
        const scriptPath = path.join(botPath, script);
        try {
            await fs.access(scriptPath);
        } catch {
            return res.status(400).json({ error: 'Script não encontrado no caminho especificado' });
        }
        
        const bots = await loadBotsConfig();
        
        // Gerar ID único
        const id = `bot-${Date.now()}`;
        
        const newBot = {
            id,
            name,
            path: botPath,
            script,
            port: port || null,
            userId: req.user.id, // Associar bot ao usuário
            createdAt: new Date().toISOString(),
            createdBy: req.user.username,
            qrCode: null,
            installationLog: []
        };
        
        bots.push(newBot);
        await saveBotsConfig(bots);
        
        // Responder imediatamente com o bot criado
        res.status(201).json({
            ...newBot,
            message: 'Bot adicionado. Instalando dependências e iniciando...',
            installing: true
        });
        
        // Processo assíncrono de instalação e inicialização
        (async () => {
            try {
                // 1. Verificar se package.json existe
                const packageJsonPath = path.join(botPath, 'package.json');
                let hasPackageJson = false;
                try {
                    await fs.access(packageJsonPath);
                    hasPackageJson = true;
                } catch {
                    console.log(`${name}: Sem package.json, pulando instalação`);
                }
                
                // 2. Instalar dependências (sempre, se houver package.json)
                if (hasPackageJson) {
                    console.log(`[${id}] Instalando dependências em ${botPath}...`);
                    newBot.installationLog.push({
                        timestamp: new Date().toISOString(),
                        type: 'info',
                        message: 'Iniciando instalação de dependências...'
                    });
                    
                    try {
                        const { stdout, stderr } = await execPromise(`cd "${botPath}" && npm install`, {
                            timeout: 300000, // 5 minutos
                            maxBuffer: 10 * 1024 * 1024 // 10MB
                        });
                        
                        console.log(`[${id}] Dependências instaladas com sucesso`);
                        newBot.installationLog.push({
                            timestamp: new Date().toISOString(),
                            type: 'success',
                            message: 'Dependências instaladas com sucesso',
                            output: stdout || stderr
                        });
                    } catch (error) {
                        console.error(`[${id}] Erro ao instalar dependências:`, error);
                        newBot.installationLog.push({
                            timestamp: new Date().toISOString(),
                            type: 'error',
                            message: 'Erro ao instalar dependências',
                            output: error.message
                        });
                        
                        // Atualizar configuração e retornar
                        const updatedBots = await loadBotsConfig();
                        const botIndex = updatedBots.findIndex(b => b.id === id);
                        if (botIndex !== -1) {
                            updatedBots[botIndex] = newBot;
                            await saveBotsConfig(updatedBots);
                        }
                        return;
                    }
                }
                
                // 3. Verificar se o script requer entrada interativa
                let requiresInteraction = false;
                try {
                    const scriptContent = await fs.readFile(scriptPath, 'utf8');
                    // Detectar padrões de entrada interativa
                    if (scriptContent.includes('readline') || 
                        scriptContent.includes('prompt') || 
                        scriptContent.includes('inquirer') ||
                        scriptContent.includes('process.stdin')) {
                        requiresInteraction = true;
                        
                        newBot.installationLog.push({
                            timestamp: new Date().toISOString(),
                            type: 'warning',
                            message: '⚠️ AVISO: Bot detectado com entrada interativa',
                            output: 'Este bot solicita entrada do usuário (número de telefone, etc). Isso pode causar problemas com PM2. Recomenda-se configurar o bot para usar variáveis de ambiente ou arquivo de configuração.'
                        });
                    }
                } catch (error) {
                    console.log(`[${id}] Não foi possível verificar script:`, error.message);
                }
                
                // 4. Iniciar bot automaticamente (sempre)
                console.log(`[${id}] Iniciando bot...`);
                newBot.installationLog.push({
                    timestamp: new Date().toISOString(),
                    type: 'info',
                    message: 'Iniciando bot...'
                });
                
                try {
                    // Verificar se deve usar npm start ou node direto
                    let startCommand = `node "${scriptPath}"`;
                    
                    // Se tem package.json, verificar se tem script start
                    if (hasPackageJson) {
                        try {
                            const pkgContent = await fs.readFile(packageJsonPath, 'utf8');
                            const pkg = JSON.parse(pkgContent);
                            
                            if (pkg.scripts && pkg.scripts.start) {
                                // Se o script start é interativo, avisar
                                if (pkg.scripts.start.includes('sh ') || pkg.scripts.start.includes('bash ')) {
                                    newBot.installationLog.push({
                                        timestamp: new Date().toISOString(),
                                        type: 'warning',
                                        message: '⚠️ Script start usa shell script',
                                        output: `Script: ${pkg.scripts.start}\nIsso pode causar problemas com PM2. Considere usar o arquivo JS diretamente.`
                                    });
                                    
                                    // Usar node direto ao invés de npm start
                                    console.log(`[${id}] Usando node direto ao invés de npm start`);
                                } else if (!requiresInteraction) {
                                    startCommand = 'npm start';
                                }
                            }
                        } catch (error) {
                            console.log(`[${id}] Erro ao ler package.json:`, error.message);
                        }
                    }
                    
                    await execPromise(`pm2 start "${scriptPath}" --name "${id}" --cwd "${botPath}"`);
                    console.log(`[${id}] Bot iniciado com sucesso`);
                    
                    newBot.status = 'online';
                    newBot.installationLog.push({
                        timestamp: new Date().toISOString(),
                        type: 'success',
                        message: 'Bot iniciado com sucesso'
                    });
                    
                    // Se requer interação, adicionar aviso adicional
                    if (requiresInteraction) {
                        newBot.installationLog.push({
                            timestamp: new Date().toISOString(),
                            type: 'warning',
                            message: '⚠️ Bot pode não funcionar corretamente',
                            output: 'Verifique os logs do PM2 para ver se o bot está aguardando entrada. Use: pm2 logs ' + id
                        });
                    }
                } catch (error) {
                    console.error(`[${id}] Erro ao iniciar bot:`, error);
                    newBot.status = 'error';
                    newBot.error = error.message;
                    
                    let errorOutput = error.message;
                    
                    // Detectar erro de entrada interativa
                    if (error.message.includes('Digite') || 
                        error.message.includes('Insira') || 
                        error.message.includes('número')) {
                        errorOutput = `❌ Bot requer entrada interativa!\n\n` +
                                     `O bot está solicitando entrada do usuário (número de telefone, etc).\n` +
                                     `PM2 não suporta entrada interativa.\n\n` +
                                     `SOLUÇÕES:\n` +
                                     `1. Configure o bot para usar variáveis de ambiente\n` +
                                     `2. Use arquivo de configuração (.env ou config.json)\n` +
                                     `3. Modifique o código para não solicitar entrada\n\n` +
                                     `Erro original:\n${error.message}`;
                    }
                    
                    newBot.installationLog.push({
                        timestamp: new Date().toISOString(),
                        type: 'error',
                        message: 'Erro ao iniciar bot',
                        output: errorOutput
                    });
                }
                
                // 4. Atualizar configuração final
                const updatedBots = await loadBotsConfig();
                const botIndex = updatedBots.findIndex(b => b.id === id);
                if (botIndex !== -1) {
                    updatedBots[botIndex] = newBot;
                    await saveBotsConfig(updatedBots);
                }
                
                console.log(`[${id}] Processo de configuração concluído`);
                
            } catch (error) {
                console.error(`[${id}] Erro no processo de configuração:`, error);
            }
        })();
    } catch (error) {
        console.error('Erro ao adicionar bot:', error);
        res.status(500).json({ error: 'Erro ao adicionar bot' });
    }
});

// POST /api/bots/:id/start - Iniciar bot
router.post('/:id/start', authenticateToken, async (req, res) => {
    try {
        const bots = await loadBotsConfig();
        const bot = bots.find(b => b.id === req.params.id);
        
        if (!bot) {
            return res.status(404).json({ error: 'Bot não encontrado' });
        }
        
        // Verificar se o usuário tem permissão para gerenciar este bot
        if (req.user.role !== 'admin' && bot.userId !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado. Este bot pertence a outro usuário.' });
        }
        
        const scriptPath = path.join(bot.path, bot.script);
        const command = `pm2 start ${scriptPath} --name ${bot.id} --cwd ${bot.path}`;
        
        await execPromise(command);
        
        res.json({ message: 'Bot iniciado com sucesso' });
    } catch (error) {
        console.error('Erro ao iniciar bot:', error);
        res.status(500).json({ error: 'Erro ao iniciar bot', details: error.message });
    }
});

// POST /api/bots/:id/stop - Parar bot
router.post('/:id/stop', authenticateToken, async (req, res) => {
    try {
        const bots = await loadBotsConfig();
        const bot = bots.find(b => b.id === req.params.id);
        
        if (!bot) {
            return res.status(404).json({ error: 'Bot não encontrado' });
        }
        
        // Verificar se o usuário tem permissão para gerenciar este bot
        if (req.user.role !== 'admin' && bot.userId !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado. Este bot pertence a outro usuário.' });
        }
        
        const command = `pm2 stop ${req.params.id}`;
        await execPromise(command);
        
        res.json({ message: 'Bot parado com sucesso' });
    } catch (error) {
        console.error('Erro ao parar bot:', error);
        res.status(500).json({ error: 'Erro ao parar bot', details: error.message });
    }
});

// POST /api/bots/:id/restart - Reiniciar bot
router.post('/:id/restart', authenticateToken, async (req, res) => {
    try {
        const bots = await loadBotsConfig();
        const bot = bots.find(b => b.id === req.params.id);
        
        if (!bot) {
            return res.status(404).json({ error: 'Bot não encontrado' });
        }
        
        // Verificar se o usuário tem permissão para gerenciar este bot
        if (req.user.role !== 'admin' && bot.userId !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado. Este bot pertence a outro usuário.' });
        }
        
        const command = `pm2 restart ${req.params.id}`;
        await execPromise(command);
        
        res.json({ message: 'Bot reiniciado com sucesso' });
    } catch (error) {
        console.error('Erro ao reiniciar bot:', error);
        res.status(500).json({ error: 'Erro ao reiniciar bot', details: error.message });
    }
});

// DELETE /api/bots/:id - Remover bot
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const bots = await loadBotsConfig();
        const botIndex = bots.findIndex(b => b.id === req.params.id);
        
        if (botIndex === -1) {
            return res.status(404).json({ error: 'Bot não encontrado' });
        }
        
        const bot = bots[botIndex];
        
        // Verificar se o usuário tem permissão para remover este bot
        if (req.user.role !== 'admin' && bot.userId !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado. Este bot pertence a outro usuário.' });
        }
        
        // Parar o bot se estiver rodando
        try {
            await execPromise(`pm2 stop ${req.params.id}`);
            await execPromise(`pm2 delete ${req.params.id}`);
        } catch (error) {
            // Ignorar erro se o bot não estiver rodando
        }
        
        bots.splice(botIndex, 1);
        await saveBotsConfig(bots);
        
        res.json({ message: 'Bot removido com sucesso' });
    } catch (error) {
        console.error('Erro ao remover bot:', error);
        res.status(500).json({ error: 'Erro ao remover bot' });
    }
});

// GET /api/bots/:id/logs - Obter logs do bot
router.get('/:id/logs', authenticateToken, async (req, res) => {
    try {
        const bots = await loadBotsConfig();
        const bot = bots.find(b => b.id === req.params.id);
        
        if (!bot) {
            return res.status(404).json({ error: 'Bot não encontrado' });
        }
        
        // Verificar se o usuário tem permissão para ver logs deste bot
        if (req.user.role !== 'admin' && bot.userId !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado. Este bot pertence a outro usuário.' });
        }
        
        const { stdout } = await execPromise(`pm2 logs ${req.params.id} --lines 100 --nostream`);
        res.json({ logs: stdout });
    } catch (error) {
        console.error('Erro ao obter logs:', error);
        res.status(500).json({ error: 'Erro ao obter logs' });
    }
});

// GET /api/bots/:id/installation-log - Obter log de instalação
router.get('/:id/installation-log', authenticateToken, async (req, res) => {
    try {
        const bots = await loadBotsConfig();
        const bot = bots.find(b => b.id === req.params.id);
        
        if (!bot) {
            return res.status(404).json({ error: 'Bot não encontrado' });
        }
        
        // Verificar se o usuário tem permissão para ver logs deste bot
        if (req.user.role !== 'admin' && bot.userId !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado. Este bot pertence a outro usuário.' });
        }
        
        res.json({
            installationLog: bot.installationLog || []
        });
    } catch (error) {
        console.error('Erro ao obter log de instalação:', error);
        res.status(500).json({ error: 'Erro ao obter log de instalação' });
    }
});

// GET /api/bots/:id/qrcode - Obter QR Code do bot
router.get('/:id/qrcode', authenticateToken, async (req, res) => {
    try {
        const bots = await loadBotsConfig();
        const bot = bots.find(b => b.id === req.params.id);
        
        if (!bot) {
            return res.status(404).json({ error: 'Bot não encontrado' });
        }
        
        // Verificar se o usuário tem permissão para ver QR Code deste bot
        if (req.user.role !== 'admin' && bot.userId !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado. Este bot pertence a outro usuário.' });
        }
        
        // Procurar por arquivo de QR Code ou logs com QR Code
        const qrCodePath = path.join(bot.path, 'qr-code.txt');
        
        try {
            const qrCode = await fs.readFile(qrCodePath, 'utf8');
            res.json({ qrCode, hasQrCode: true });
        } catch {
            // Tentar obter do log do PM2
            try {
                const { stdout } = await execPromise(`pm2 logs ${req.params.id} --lines 50 --nostream`);
                
                // Procurar por QR Code no log
                const qrMatch = stdout.match(/█{2,}[\s\S]*?█{2,}/);
                if (qrMatch) {
                    res.json({ qrCode: qrMatch[0], hasQrCode: true, source: 'logs' });
                } else {
                    res.json({ qrCode: null, hasQrCode: false, message: 'QR Code não encontrado. O bot pode já estar autenticado.' });
                }
            } catch (error) {
                res.json({ qrCode: null, hasQrCode: false, message: 'Não foi possível obter o QR Code' });
            }
        }
    } catch (error) {
        console.error('Erro ao obter QR Code:', error);
        res.status(500).json({ error: 'Erro ao obter QR Code' });
    }
});

// GET /api/bots/:id/installation-log - Obter log de instalação
router.get('/:id/installation-log', authenticateToken, async (req, res) => {
    try {
        const bots = await loadBotsConfig();
        const bot = bots.find(b => b.id === req.params.id);
        
        if (!bot) {
            return res.status(404).json({ error: 'Bot não encontrado' });
        }
        
        res.json({ installationLog: bot.installationLog || [] });
    } catch (error) {
        console.error('Erro ao obter log de instalação:', error);
        res.status(500).json({ error: 'Erro ao obter log de instalação' });
    }
});

module.exports = router;
