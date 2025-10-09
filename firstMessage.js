/* detecta e responde à PRIMEIRA mensagem de qualquer usuário – SEM FLOOD */
const fs = require('fs');
const path = './firstMessages.json';

// carrega lista de quem já recebeu (persiste em arquivo)
let firstMessages = new Set();
try {
  const data = fs.readFileSync(path, 'utf8');
  firstMessages = new Set(JSON.parse(data));
} catch {
  // arquivo não existe ainda – começa vazio
}

async function handleFirstMessage(message, client) {
  const userId = message.author || message.from; // grupo ou privado

  if (firstMessages.has(userId)) return; // já apresentou

  const apresentacao =
    `*🟢 VOETUR ASSISTENTE*\n\n` +
    `*Oiá!* 👋 Sou o assistente virtual da Voetur!\n\n` +
    `*Como posso te ajudar hoje?*\n\n` +
    `• Digite *!menu* e veja nossas opções rápidas.\n` +
    `• Salve meu contato como *"Voetur Assistente"* e use sempre que precisar! 😊\n\n` +
    `*Atendimento 24h – Voetur 🟢*`;

  await client.sendMessage(message.from, apresentacao);

  firstMessages.add(userId);
  fs.writeFileSync(path, JSON.stringify([...firstMessages], null, 2));
}

module.exports = { handleFirstMessage };