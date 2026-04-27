const axios = require("axios");

module.exports.config = {
  name: "blackboxai",
  version: "2.3.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Stable Gemini AI - Short & Fast",
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
    return await callGemini(api, threadID, messageID, senderID, query);
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
  return await callGemini(api, threadID, messageID, senderID, query);
};

async function callGemini(api, threadID, messageID, senderID, query) {
  if (!userMemory[senderID]) userMemory[senderID] = { history: [] };

  const history = userMemory[senderID].history.slice(-6);
  const contents = history.map(item => ({
    role: item.role === "user" ? "user" : "model",
    parts: [{ text: item.content }]
  }));

  // Short reply instruction ko query ke saath hi bhej raha hoon (More stable)
  const finalQuery = `(Instruction: Give a very short answer) ${query}`;
  contents.push({ role: "user", parts: [{ text: finalQuery }] });

  const apiKey = "AIzaSyDLDvdO1dj0JXtqooqFUTqO4aAH0iSzo8c";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const res = await axios.post(url, { contents });

    if (res.data && res.data.candidates && res.data.candidates[0].content) {
      const reply = res.data.candidates[0].content.parts[0].text;
      userMemory[senderID].history.push({ role: "user", content: query }, { role: "model", content: reply });
      return api.sendMessage(reply, threadID, messageID);
    } else {
      console.log("Full API Response Error:", JSON.stringify(res.data, null, 2));
      return api.sendMessage("⚠️ API ne response nahi diya. Check terminal.", threadID, messageID);
    }
  } catch (err) {
    // Terminal mein check karein ke kya error hai
    console.error("API Error Detail:", err.response ? err.response.data : err.message);
    return api.sendMessage("❌ Connection fail. Key check karein ya internet.", threadID, messageID);
  }
}
