/* detecta e responde à PRIMEIRA mensagem de qualquer usuário */
const firstMessages = new Set(); // guarda quem já recebeu apresentação

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
  firstMessages.add(userId); // marca como já apresentado
}

module.exports = { handleFirstMessage };