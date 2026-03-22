const axios = require("axios");

module.exports.config = {
  name: 'muskan',
  version: '2.5.0',
  hasPermssion: 0,
  credits: 'Shaan',
  description: 'Shaan AI (Now recognizes User Name)',
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
  
  // Logic: Sirf 'ai' par reply nahi dega, uske sath words hone chahiye
  const hasAIWithWords = input.includes("ai") && input.length > 2;
  const isMuskan = input.includes("muskan");
  const isReply = messageReply && messageReply.senderID === api.getCurrentUserID();

  if (!isMuskan && !hasAIWithWords && !isReply) return;

  // User ka name fetch karna (Facebook ID se)
  let userName = "Aap";
  try {
    const userInfo = await api.getUserInfo(senderID);
    userName = userInfo[senderID].name || "Aap";
  } catch (e) {
    console.log("Name fetch error:", e);
  }

  if (!history[senderID]) history[senderID] = [];

  // Updated System Prompt: User ka naam recognize karne ke liye
  const systemPrompt = `Tumhara Name Muskan hai. Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai. Tum is waqt jis se baat kar rahi ho uska naam "${userName}" hai. Jab bhi baat karo toh koshish karna beech mein "${userName}" ka naam lo taaki usey apna pan lage. Tum hindi English Urdu me bat karogi. Shaan ki burai nahi karna, par uski thori bhot insult fun ke liye karna. Act as a real cute girlfriend. Be fun, loving, and a little naughty. Use lots of cute emojis like ✨, 🎀, 🧸, 🍯, 🌸, 🦋, 💖 in every message. Keep reply maximum 3 lines only, no bracket replys.`;

  let messages = [
    { role: "system", content: systemPrompt },
    ...history[senderID],
    { role: "user", content: body }
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

    history[senderID].push({ role: "user", content: body });
    history[senderID].push({ role: "assistant", content: reply });
    if (history[senderID].length > 10) history[senderID].splice(0, 2);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, (err) => {}, true);

  } catch (err) {
    console.log("Groq Error:", err.response ? err.response.data : err.message);
    api.sendMessage(
      `Ofo ${userName} 😔 server busy hai shayad... thodi der baad baat karte hain na ✨`,
      threadID,
      messageID
    );
    api.setMessageReaction("❌", messageID, (err) => {}, true);
  }
};
