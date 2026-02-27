const axios = require("axios");

module.exports.config = {
  name: "sana",
  version: "6.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Sana AI Karachi Style - Axios Version",
  commandCategory: "AI",
  usages: "sana [text] / sana on / sana off",
  cooldowns: 2
};

// Global status check
if (!global.sanaStatus) global.sanaStatus = new Map();

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body, type, messageReply } = event;
  if (!body) return;

  const isEnabled = global.sanaStatus.get(threadID) || false;
  const botID = api.getCurrentUserID();

  // Trigger: Agar Sana ON ho aur koi 'sana' bolay ya reply de
  if (isEnabled && (body.toLowerCase().startsWith("sana ") || (type === "message_reply" && messageReply.senderID === botID))) {
    const query = body.toLowerCase().startsWith("sana ") ? body.slice(5) : body;
    return chatWithSana(api, event, query);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const content = args.join(" ").toLowerCase();

  // Admin Check
  let threadInfo = await api.getThreadInfo(threadID);
  let adminIDs = threadInfo.adminIDs.map(admin => admin.id);

  if (content === "on") {
    if (!adminIDs.includes(senderID)) return api.sendMessage("🚫 Sirf admin on kar sakta hai!", threadID, messageID);
    global.sanaStatus.set(threadID, true);
    return api.sendMessage("✅ Sana AI ON ho gayi hai boss! Shaan Khan ka scene on hai. 😎", threadID, messageID);
  }

  if (content === "off") {
    if (!adminIDs.includes(senderID)) return api.sendMessage("🚫 Sirf admin off kar sakta hai!", threadID, messageID);
    global.sanaStatus.set(threadID, false);
    return api.sendMessage("❌ Sana AI OFF ho gayi. 😴", threadID, messageID);
  }

  if (!content) return api.sendMessage("❓ Kuch bolo toh... Sana sun rahi hai 😏", threadID, messageID);

  return chatWithSana(api, event, content);
};

async function chatWithSana(api, event, query) {
  const apiKey = "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";
  const systemPrompt = "Tumhara naam Sana hai. Tum Karachi, Pakistan se ho. Tum ek Muslim ladki ho. Tumhara creator aur owner Shaan Khan hai. Tum hamesha Roman Urdu mein baat karti ho Karachi slang ke saath (jaise 'abey', 'mast', 'scene on hai'). Jawab hamesha chote aur crispy dena.";

  try {
    const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ]
    }, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    const reply = res.data.choices[0].message.content;
    return api.sendMessage(reply, event.threadID, event.messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Shaan Khan bhai, API mein masla aa raha hai check karein!", event.threadID, event.messageID);
  }
}
