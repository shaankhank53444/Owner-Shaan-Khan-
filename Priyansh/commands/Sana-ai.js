const axios = require("axios");
const { Groq } = require("groq-sdk");

// Yahan apni Groq API Key daalein
const groq = new Groq({
  apiKey: "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", 
});

module.exports.config = {
  name: "sana",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "SHAAN KHAN",
  description: "Chat with Sana AI (Groq Speed + Karachi style)",
  commandCategory: "AI",
  usages: "sana [message] or sana on/off",
  cooldowns: 2
};

const sanaStatus = new Map();

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const content = args.join(" ").toLowerCase();

  let threadInfo = await api.getThreadInfo(threadID);
  let adminIDs = threadInfo.adminIDs.map(admin => admin.id);

  if (content === "on") {
    if (!adminIDs.includes(senderID)) {
      return api.sendMessage("🚫 Sirf group admin Sana AI ON kar sakta hai.", threadID, messageID);
    }
    sanaStatus.set(threadID, true);
    return api.sendMessage("✅ Sana AI ab ON ho gayi hai 😎 Ab maza ayega!", threadID, messageID);
  }

  if (content === "off") {
    if (!adminIDs.includes(senderID)) {
      return api.sendMessage("🚫 Sirf group admin Sana AI OFF kar sakta hai.", threadID, messageID);
    }
    sanaStatus.set(threadID, false);
    return api.sendMessage("❌ Sana AI ab OFF ho gayi hai 😴 Chalo shaba khair.", threadID, messageID);
  }

  if (!content) {
    return api.sendMessage("❓ Kuch bolo bhi... Sana sun rahi hai 😏", threadID, messageID);
  }

  return chatWithSana(api, event, content);
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body, type, messageReply } = event;
  if (!body) return;

  const isEnabled = sanaStatus.get(threadID) || false;
  const botID = api.getCurrentUserID();

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
  const systemPrompt = "Tumhara naam Sana hai. Our tumhara owner aur creator Shaan Khan hai Tum Karachi, Pakistan se ho. Tum ek Muslim ladki ho. Tum hamesha Roman Urdu mein baat karti ho. Tum Karachi ki slang thodi si use karti ho (jaise 'abey', 'mast', 'scene on hai', etc.). Tumhare jawab hamesha short, snappy aur thode nakhre wale hote hain. Lambay jawab bilkul mat dena.";

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      model: "llama-3.3-70b-versatile", // Aap model change kar sakte hain (e.g., mixtral-8x7b-32768)
    });

    const response = chatCompletion.choices[0]?.message?.content || "Abey yaar, samajh nahi aya kya bola.";
    return api.sendMessage(response, event.threadID, event.messageID);

  } catch (error) {
    console.error("Groq Error:", error);
    return api.sendMessage("❌ Groq API ka masla ho gaya hai, key check kar lo!", event.threadID, event.messageID);
  }
}
