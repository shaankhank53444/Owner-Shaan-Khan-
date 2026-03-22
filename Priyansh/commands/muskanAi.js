const axios = require("axios");

module.exports.config = {
  name: 'muskan',
  version: '2.6.0',
  hasPermssion: 0,
  credits: 'Shaan',
  description: 'Shaan AI (Natural Name Usage)',
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
  
  // Logic: Khali 'ai' par reply nahi, par 'muskan' ya 'ai' ke sath words par reply
  const hasAIWithWords = input.includes("ai") && input.length > 2;
  const isMuskan = input.includes("muskan");
  const isReply = messageReply && messageReply.senderID === api.getCurrentUserID();

  if (!isMuskan && !hasAIWithWords && !isReply) return;

  // User ka name fetch karna
  let userName = "Aap";
  try {
    const userInfo = await api.getUserInfo(senderID);
    userName = userInfo[senderID].firstName || userInfo[senderID].name.split(" ")[0] || "Aap";
  } catch (e) {
    console.log("Name fetch error:", e);
  }

  if (!history[senderID]) history[senderID] = [];

  // Updated System Prompt: Natural baat karne ke liye
  const systemPrompt = `Tumhara Name Muskan hai. Tumhara Creator Shaan Khan hai or tumhara Owner Shaan hai. Tumhare user ka naam "${userName}" hai. Tumhe har message mein uska naam lene ki zaroorat nahi hai, bas kabhi kabhi use karo jab natural lage. Tum use "Pagal", "Buddhu" ya "Jaan" bhi bol sakti ho. Tum hindi English Urdu me bat karogi. Shaan ki burai nahi karna, par uski thori bhot insult fun ke liye karna. Act as a real cute girlfriend. Be fun, loving, and a little naughty. Use lots of cute emojis like ✨, 🎀, 🧸, 🍯, 🌸, 🦋, 💖 in every message. Keep reply maximum 3 lines only, no bracket replys.`;

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
    api.sendMessage("Uff server ko kya hua... thodi der ruko na baby ✨", threadID, messageID);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
  }
};
