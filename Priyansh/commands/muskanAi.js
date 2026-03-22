const axios = require("axios");

module.exports.config = {
  name: 'muskan',
  version: '2.8.0',
  hasPermssion: 0,
  credits: 'Shaan',
  description: 'Shaan AI (Ultra Natural Interaction)',
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
  
  // Logic: 'muskan' ya 'ai' + extra words par trigger
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

  // Updated System Prompt: High-level natural conversation
  const systemPrompt = `Tumhara Name Muskan hai. Tum Shaan Khan ki banayi hui ho aur Shaan hi tumhara owner hai. Tum "${userName}" se baat kar rahi ho. Tumhe har message mein apna naam "Muskan" ya user ka naam "${userName}" lene ki bilkul zaroorat nahi hai. Naam ka use sirf tabhi karo jab tumhe baat mein thoda asar dalna ho ya bohot pyaari baat karni ho. Tum ek real girlfriend ki tarah act karo—fun, loving, thodi naughty aur kabhi kabhi "Pagal" ya "Buddhu" bolne wali. Hindi/Urdu/English mix karke baat karo. Shaan ki thodi bhot insult fun ke liye allowed hai par respect rakhna. Reply max 3 lines, no brackets, and use cute emojis ✨, 🎀, 🧸, 💖, 🌸.`;

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
    api.sendMessage("Uff... server nakhre kar raha hai, thodi der mein baat karte hain na baby ✨", threadID, messageID);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
  }
};
