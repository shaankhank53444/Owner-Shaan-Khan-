const axios = require("axios");

module.exports.config = {
  name: "blackboxai",
  version: "2.2.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Fast Gemini AI with short & concise replies.",
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

  const history = userMemory[senderID].history.slice(-6); // History thodi kam rakhi hai speed ke liye
  const contents = history.map(item => ({
    role: item.role === "user" ? "user" : "model",
    parts: [{ text: item.content }]
  }));

  contents.push({ role: "user", parts: [{ text: query }] });

  const apiKey = "AIzaSyDLDvdO1dj0JXtqooqFUTqO4aAH0iSzo8c";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const res = await axios.post(url, { 
      contents,
      systemInstruction: { // Yeh AI ko short rehne ka order dega
        parts: [{ text: "Your responses must be very short, concise, and to the point. Avoid long explanations unless specifically asked." }]
      }
    });

    if (res.data?.candidates?.[0]?.content) {
      const reply = res.data.candidates[0].content.parts[0].text;
      userMemory[senderID].history.push({ role: "user", content: query }, { role: "model", content: reply });
      return api.sendMessage(reply, threadID, messageID);
    }
  } catch (err) {
    console.error(err.message);
    return api.sendMessage("❌ Error: API busy hai ya network down hai.", threadID, messageID);
  }
}
