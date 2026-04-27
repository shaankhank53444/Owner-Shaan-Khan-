const axios = require("axios");

module.exports.config = {
  name: "blackboxai",
  version: "3.2.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Groq AI - Fast & Strict Short Replies",
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
    return api.sendMessage("🧹 History clear!", threadID, messageID);
  }

  if (!query) return api.sendMessage("❓ Kuch puchiye!", threadID, messageID);
  return await callGroq(api, threadID, messageID, senderID, query);
};

async function callGroq(api, threadID, messageID, senderID, query) {
  if (!userMemory[senderID]) userMemory[senderID] = { history: [] };

  // Pehle ki tarah 6 messages ki history rakhi hai
  const history = userMemory[senderID].history.slice(-6);
  const messages = history.map(item => ({
    role: item.role,
    content: item.content
  }));

  // Short reply ki strict instruction system role mein
  messages.unshift({ 
    role: "system", 
    content: "Instruction: Your name is Shaan Khan AI. You must provide extremely short, one-line answers only. Do not explain, just give the direct answer." 
  });
  
  messages.push({ role: "user", content: query });

  const apiKey = "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";
  const url = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const res = await axios.post(url, {
      model: "llama-3.3-70b-versatile",
      messages: messages,
      max_tokens: 100, // Tokens kam kar diye taaki reply lamba ho hi na sake
      temperature: 0.5
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
      return api.sendMessage("⚠️ No response from Groq.", threadID, messageID);
    }
  } catch (err) {
    console.error("Groq Error:", err.response ? err.response.data : err.message);
    return api.sendMessage("❌ Error! Key ya connection check karein.", threadID, messageID);
  }
}
