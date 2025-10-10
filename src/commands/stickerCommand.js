const { MessageMedia } = require('whatsapp-web.js');
const sharp = require('sharp');
const logger = require('../../src/config/logger');
const { CONFIG } = require('../../src/config/constants');

/**
 * Comando privado: !figurinha
 * - Gera figurinha (sticker) 1:1 a partir de uma imagem enviada.
 * - Se usado em grupo, envia a figurinha em privado para o autor da mensagem (nada no grupo).
 * - Não aparece em menus nem respostas públicas.
 *
 * Suporta:
 * - Mensagem com imagem e texto "!figurinha"
 * - Responder a uma imagem com a mensagem "!figurinha"
 */
async function handleStickerCommand(message, client) {
  try {
    const body = (message.body || '').trim().toLowerCase();
    if (!body.startsWith('!figurinha')) return false; // não processa

    // Determinar a mídia alvo: própria mensagem ou a mensagem citada
    let targetMsg = message;
    if (!message.hasMedia && message.hasQuotedMsg) {
      try {
        const quoted = await message.getQuotedMessage();
        if (quoted && quoted.hasMedia) {
          targetMsg = quoted;
        }
      } catch (e) {
        // continua usando a própria mensagem
      }
    }

    if (!targetMsg.hasMedia) {
      // Enviar erro apenas em privado
      const contact = await message.getContact();
      const privateId = contact?.id?._serialized;
      if (privateId) {
        await client.sendMessage(privateId, 'Envie uma imagem com o comando !figurinha ou responda a uma imagem com !figurinha.');
      }
      return true; // impedir outros handlers
    }

    // Baixar a mídia
    const media = await targetMsg.downloadMedia();
    if (!media || !media.mimetype.startsWith('image/')) {
      const contact = await message.getContact();
      const privateId = contact?.id?._serialized;
      if (privateId) {
        await client.sendMessage(privateId, 'A mensagem não contém uma imagem válida para gerar figurinha.');
      }
      return true;
    }

    // Processar para 1:1 e converter para WEBP
    const inputBuffer = Buffer.from(media.data, 'base64');
    const webpBuffer = await sharp(inputBuffer)
      .resize(512, 512, { fit: 'cover', position: 'centre', withoutEnlargement: false })
      .webp({ quality: 90 })
      .toBuffer();

    const stickerMedia = new MessageMedia('image/webp', webpBuffer.toString('base64'));

    // Destino privado (sempre): autor da mensagem
    const contact = await message.getContact();
    const privateId = contact?.id?._serialized;
    if (!privateId) {
      logger.warn({ from: message.from }, 'Não foi possível obter ID privado do contato');
      return true;
    }

    await client.sendMessage(privateId, stickerMedia, {
      sendMediaAsSticker: true,
      stickerAuthor: CONFIG.COMPANY_NAME || 'Voetur',
      stickerName: 'Gerado pelo Bot'
    });

    // Não enviar nada no grupo/chat original (privado somente)
    return true;
  } catch (err) {
    try {
      const contact = await message.getContact();
      const privateId = contact?.id?._serialized;
      if (privateId) {
        await client.sendMessage(privateId, 'Falha ao gerar figurinha. Tente novamente com outra imagem.');
      }
    } catch (_) {}
    logger.error({ err, from: message.from }, 'Erro no comando !figurinha');
    return true; // evitar vazamento para outros handlers
  }
}

module.exports = { handleStickerCommand };
