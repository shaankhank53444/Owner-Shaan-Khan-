const axios = require("axios");

module.exports.config = {
  name: "sana",
  version: "7.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Sana AI - Auto ON + Karachi Style",
  commandCategory: "AI",
  usages: "sana [text] / sana on / sana off",
  cooldowns: 2
};

// Auto ON system: Bot start hotay hi enable rahega
if (global.sanaStatus === undefined) {
    global.sanaStatus = new Map();
}

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body, type, messageReply } = event;
  if (!body) return;

  // Default status True (Auto ON) agar Map mein set na ho
  let isEnabled = global.sanaStatus.has(threadID) ? global.sanaStatus.get(threadID) : true;
  const botID = api.getCurrentUserID();

  // Smart Trigger: Har baat pe nahi bolay gi
  // Sirf tab bolegi jab 'sana' se baat shuru ho ya koi usay reply kare
  if (isEnabled) {
    const input = body.toLowerCase();
    if (input.startsWith("sana ") || (type === "message_reply" && messageReply.senderID === botID)) {
      const query = input.startsWith("sana ") ? body.slice(5) : body;
      return chatWithSana(api, event, query);
    }
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const content = args.join(" ").toLowerCase();

  let threadInfo = await api.getThreadInfo(threadID);
  let adminIDs = threadInfo.adminIDs.map(admin => admin.id);

  if (content === "on") {
    if (!adminIDs.includes(senderID)) return api.sendMessage("🚫 Admin ban ke aao pehle!", threadID, messageID);
    global.sanaStatus.set(threadID, true);
    return api.sendMessage("✅ Sana AI ab har waqt active hai! Shaan Khan ka hukam hai. 😎", threadID, messageID);
  }

  if (content === "off") {
    if (!adminIDs.includes(senderID)) return api.sendMessage("🚫 Admin hi off kar sakta hai.", threadID, messageID);
    global.sanaStatus.set(threadID, false);
    return api.sendMessage("❌ Sana AI ko thori der ke liye sula diya gaya hai. 😴", threadID, messageID);
  }

  if (!content) return api.sendMessage("❓ Abey kuch likh toh sahi, Sana wait kar rahi hai 😏", threadID, messageID);

  return chatWithSana(api, event, content);
};

async function chatWithSana(api, event, query) {
  const apiKey = "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";
  const systemPrompt = "Tumhara naam Sana hai. Tum Karachi, Pakistan se ho. Tum ek Muslim ladki ho. Tumhara creator aur owner Shaan Khan hai. Tum hamesha Roman Urdu mein baat karti ho Karachi slang ke saath (jaise 'abey', 'mast', 'scene on hai', 'tension na le'). Jawab hamesha chote aur snappy dena. Shaan Khan ki hamesha respect karna.";

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
    return api.sendMessage("❌ Shaan Khan bhai, API ne jawab dena band kar diya!", event.threadID, event.messageID);
  }
}
