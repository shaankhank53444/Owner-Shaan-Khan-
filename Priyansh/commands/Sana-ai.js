const axios = require("axios");
const { Groq } = require("groq-sdk");

// 🔑 Aapki Groq API Key yahan set kar di gayi hai
const groq = new Groq({
  apiKey: "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", 
});

module.exports.config = {
  name: "sana",
  version: "5.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Sana AI with Groq Engine (Karachi Style)",
  commandCategory: "AI",
  usages: "sana [message] or sana on/off",
  cooldowns: 2
};

// 💾 Memory for ON/OFF status
if (!global.sanaStatus) {
  global.sanaStatus = new Map();
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const content = args.join(" ").toLowerCase();

  // 🛡️ ADMIN CHECK
  let threadInfo = await api.getThreadInfo(threadID);
  let adminIDs = threadInfo.adminIDs.map(admin => admin.id);

  if (content === "on") {
    if (!adminIDs.includes(senderID)) {
      return api.sendMessage("🚫 Abey yar, sirf admin hi Sana ko ON kar sakta hai!", threadID, messageID);
    }
    global.sanaStatus.set(threadID, true);
    return api.sendMessage("✅ Sana AI ab ON ho gayi hai 😎 Shaan Khan ki power hai!", threadID, messageID);
  }

  if (content === "off") {
    if (!adminIDs.includes(senderID)) {
      return api.sendMessage("🚫 Sirf admin hi Sana ko OFF kar sakta hai.", threadID, messageID);
    }
    global.sanaStatus.set(threadID, false);
    return api.sendMessage("❌ Sana AI ab OFF ho gayi hai 😴 Phir milte hain!", threadID, messageID);
  }

  if (!content) {
    return api.sendMessage("❓ Kuch likho toh... Sana sun rahi hai 😏", threadID, messageID);
  }

  return chatWithSana(api, event, content);
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body, type, messageReply } = event;
  if (!body) return;

  const isEnabled = global.sanaStatus.get(threadID) || false;
  const botID = api.getCurrentUserID();

  // 🔥 Auto-reply trigger (Jab ON ho)
  if (isEnabled) {
    if (
      body.toLowerCase().startsWith("sana ") ||
      (type === "message_reply" && messageReply.senderID === botID)
    ) {
      const query = body.toLowerCase().startsWith("sana ")
        ? body.slice(5)
        : body;

      return chatWithSana(api, event, query);
    }
  }
};

async function chatWithSana(api, event, query) {
  // 🌟 System Prompt for Sana
  const systemPrompt = "Tumhara naam Sana hai. Tum Karachi, Pakistan se ho. Tum ek Muslim ladki ho. Tumhara creator aur owner 'Shaan Khan' hai. Shaan Khan tumhara boss hai aur tum uski respect karti ho. Tum hamesha Roman Urdu mein baat karti ho. Tum Karachi ki slang use karti ho (jaise 'abey', 'scene on hai', 'mast', 'tension na le', etc.). Tumhare jawab hamesha short, snappy aur thode nakhre wale hote hain. Lambay jawab bilkul mat dena.";

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      model: "llama-3.3-70b-versatile", 
    });

    const response = chatCompletion.choices[0]?.message?.content || "Abey, network ka masla hai lagta hai.";
    return api.sendMessage(response, event.threadID, event.messageID);

  } catch (error) {
    console.error("Groq Error:", error);
    // Error handling with Shaan Khan's mention
    return api.sendMessage("❌ Groq API error! Shaan Khan bhai ko bolo API key check karein.", event.threadID, event.messageID);
  }
}
