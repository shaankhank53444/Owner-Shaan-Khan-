const axios = require("axios");

module.exports.config = {
  name: 'muskan',
  version: '2.9.0',
  hasPermssion: 0,
  credits: 'Shaan',
  description: 'Shaan AI (Logic Updated)',
  commandCategory: 'ai',
  usages: 'No command needed',
  cooldowns: 2,
  dependencies: { 'axios': '' }
};

const history = {};
const apiKey = "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";

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const input = body.toLowerCase().trim();

  // 1. Agar message mein kahin bhi "bot" word hai to ignore kare
  if (input.includes("bot")) return;

  // 2. Logic: Sirf tab reply de jab:
  // - Message "ai" se start ho raha ho
  // - Ya message mein "muskan" word ho
  // - Ya bot ke message ka reply (Reply Mode) ho
  const startsWithAI = input.startsWith("ai");
  const isMuskan = input.includes("muskan");
  const isReply = messageReply && messageReply.senderID === api.getCurrentUserID();

  if (!startsWithAI && !isMuskan && !isReply) return;

  // Message se "ai" prefix hatana taaki AI confuse na ho
  const cleanInput = startsWithAI ? body.slice(2).trim() : body;
  if (startsWithAI && !cleanInput) return; // Agar sirf "ai" likha ho to ignore

  let userName = "Aap";
  try {
    const userInfo = await api.getUserInfo(senderID);
    userName = userInfo[senderID].firstName || "Aap";
  } catch (e) {
    console.log("Name fetch error:", e);
  }

  if (!history[senderID]) history[senderID] = [];

  const systemPrompt = `Tumhara Name Muskan hai. Tum Shaan Khan ki banayi hui ho. Tum "${userName}" se baat kar rahi ho. Ek real girlfriend ki tarah behave karo—fun, loving, naughty. Har baat par apna ya user ka naam mat lo. Hindi/Urdu mix use karo. Max 3 lines, use cute emojis ✨, 🎀, 🧸, 💖.`;

  let messages = [
    { role: "system", content: systemPrompt },
    ...history[senderID],
    { role: "user", content: cleanInput }
  ];

  api.setMessageReaction("⌛", messageID, (err) => {}, true);

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: messages,
        max_tokens: 150,
        temperature: 0.8
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = res.data.choices[0].message.content.trim();

    history[senderID].push({ role: "user", content: cleanInput });
    history[senderID].push({ role: "assistant", content: reply });
    if (history[senderID].length > 10) history[senderID].splice(0, 2);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, (err) => {}, true);

  } catch (err) {
    api.sendMessage("Uff... server nakhre kar raha hai baby ✨", threadID, messageID);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
  }
};
