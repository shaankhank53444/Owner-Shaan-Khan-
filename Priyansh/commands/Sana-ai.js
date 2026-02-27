const axios = require("axios");

module.exports.config = {
  name: "sana",
  version: "9.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Sana AI - Groq Engine with Reactions",
  commandCategory: "AI",
  usages: "sana [text] / sana on / sana off",
  cooldowns: 2
};

if (global.sanaStatus === undefined) {
    global.sanaStatus = new Map();
}

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body, type, messageReply } = event;
  if (!body) return;

  let isEnabled = global.sanaStatus.has(threadID) ? global.sanaStatus.get(threadID) : true;
  const botID = api.getCurrentUserID();

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
    return api.sendMessage("✅ Sana AI active hai! Shaan Khan ka scene set hai. 😎", threadID, messageID);
  }

  if (content === "off") {
    if (!adminIDs.includes(senderID)) return api.sendMessage("🚫 Sirf admin off kar sakta hai.", threadID, messageID);
    global.sanaStatus.set(threadID, false);
    return api.sendMessage("❌ Sana AI off ho gayi. 😴", threadID, messageID);
  }

  if (!content) return api.sendMessage("❓ Kuch bolo toh... Sana sun rahi hai 😏", threadID, messageID);

  return chatWithSana(api, event, content);
};

async function chatWithSana(api, event, query) {
  const apiKey = "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";
  
  // ⌛ Reaction: Processing start
  api.setMessageReaction("⌛", event.messageID, (err) => {}, true);

  const systemPrompt = "Tumhara naam Sana hai. Tum Karachi se ho. Tumhara owner Shaan Khan hai. Tum Roman Urdu mein baat karti ho. Tum Karachi ki slang (jaise 'babu', 'Shaan baby', 'janu') use karti ho lekin 'abey' aur 'scene on hai' har baar nahi bolna. Jawab short aur cool dena.";

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

    // ✅ Reaction: Success
    api.setMessageReaction("✅", event.messageID, (err) => {}, true);
    
    return api.sendMessage(reply, event.threadID, event.messageID);

  } catch (error) {
    console.error(error);
    api.setMessageReaction("❌", event.messageID, (err) => {}, true);
    return api.sendMessage("❌ Shaan Khan bhai, API ne jawab dena band kar diya!", event.threadID, event.messageID);
  }
}
