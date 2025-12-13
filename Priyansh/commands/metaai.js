// META AI STYLE CHAT (Mirai Bot Command)
// Simple random reply chatbot (no API)

module.exports.config = {
  name: "metaai",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Meta AI Demo",
  description: "Simple Meta AI style random chat",
  commandCategory: "chat",
  usages: "metaai <message>",
  cooldowns: 2
};

module.exports.run = async function ({ api, event, args }) {
  const userInfo = await api.getUserInfo(event.senderID);
  const name = userInfo[event.senderID].name;

  if (!args.join(" ")) {
    return api.sendMessage(
      "Kuchh likho na 😊\nExample: metaai hello",
      event.threadID,
      event.messageID
    );
  }

  const responses = [
    `Aha ${name}, tum kaise ho?`,
    "Tumhari baatein achhi lagti hain 😊",
    "Mujhe tumse baat karna pasand hai 😘",
    "Aur sunao?",
    "Hamesha muskurate raho 😄",
    "Tumse baat karke achha lagta hai 💖"
  ];

  const reply = responses[Math.floor(Math.random() * responses.length)];

  return api.sendMessage(
    `Meta AI: ${reply}`,
    event.threadID,
    event.messageID
  );
};