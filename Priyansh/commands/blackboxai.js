const axios = require("axios");

module.exports.config = {
  name: "blackboxai",
  version: "3.5.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Groq AI - Multi-Language Short Replies",
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
    return api.sendMessage("🧹 Memory reset!", threadID, messageID);
  }

  if (!query) return api.sendMessage("❓ Kuch puchiye!", threadID, messageID);
  return await callGroq(api, threadID, messageID, senderID, query);
};

async function callGroq(api, threadID, messageID, senderID, query) {
  if (!userMemory[senderID]) userMemory[senderID] = { history: [] };

  const history = userMemory[senderID].history.slice(-4);
  const messages = history.map(item => ({
    role: item.role,
    content: item.content
  }));

  // Multi-Language Logic: System prompt ko instruction di hai ke language detect kare
  messages.unshift({ 
    role: "system", 
    content: "Your name is Shaan Khan AI. Detect the user's language and reply in the same language. Keep your response strictly 2 to 3 short sentences. Be natural and direct." 
  });
  
  messages.push({ role: "user", content: query });

  const apiKey = "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";
  const url = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const res = await axios.post(url, {
      model: "llama-3.3-70b-versatile",
      messages: messages,
      max_tokens: 100, // Short reply ke liye token limit
      temperature: 0.6
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
      return api.sendMessage("⚠️ API Error.", threadID, messageID);
    }
  } catch (err) {
    return api.sendMessage("❌ Connection failed.", threadID, messageID);
  }
}
