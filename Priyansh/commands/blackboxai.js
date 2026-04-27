const axios = require("axios");

module.exports.config = {
  name: "blackboxai",
  version: "3.3.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Groq AI - Balanced 3-4 Line Replies",
  commandCategory: "AI",
  usages: "[your question]",
  cooldowns: 5,
};

let userMemory = {}; 

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
  if (isReplyToBot || body.toLowerCase().startsWith("hercai")) {
    const query = body.toLowerCase().startsWith("hercai") ? body.slice(6).trim() : body.trim();
    if (!query) return;
    return await callGroq(api, threadID, messageID, senderID, query);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const query = args.join(" ");

  if (query.toLowerCase() === "clear") {
    userMemory[senderID] = { history: [] };
    return api.sendMessage("🧹 Memory reset kar di gayi hai!", threadID, messageID);
  }

  if (!query) return api.sendMessage("❓ Kuch puchiye!", threadID, messageID);
  return await callGroq(api, threadID, messageID, senderID, query);
};

async function callGroq(api, threadID, messageID, senderID, query) {
  if (!userMemory[senderID]) userMemory[senderID] = { history: [] };

  const history = userMemory[senderID].history.slice(-6);
  const messages = history.map(item => ({
    role: item.role,
    content: item.content
  }));

  // Instruction for balanced length (3-4 lines)
  messages.unshift({ 
    role: "system", 
    content: "Your name is Shaan Khan AI. Provide clear and helpful answers. Your response length must be around 3 to 4 lines. Do not be too brief, but do not write long essays." 
  });
  
  messages.push({ role: "user", content: query });

  const apiKey = "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";
  const url = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const res = await axios.post(url, {
      model: "llama-3.3-70b-versatile",
      messages: messages,
      max_tokens: 250, // Moderate tokens for 3-4 lines
      temperature: 0.7
    }, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (res.data && res.data.choices && res.data.choices[0].message) {
      const reply = res.data.choices[0].message.content;
      userMemory[senderID].history.push({ role: "user", content: query }, { role: "assistant", content: reply });
      return api.sendMessage(reply, threadID, messageID);
    } else {
      return api.sendMessage("⚠️ API response mein error hai.", threadID, messageID);
    }
  } catch (err) {
    console.error("Groq Error:", err.response ? err.response.data : err.message);
    return api.sendMessage("❌ Error! API key check karein ya server check karein.", threadID, messageID);
  }
}
