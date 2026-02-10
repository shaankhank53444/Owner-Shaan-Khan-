const axios = require("axios");

module.exports.config = {
  name: "ai",
  version: "12.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Naughty GF AI - Replies on Mention or Quote/Reply",
  usePrefix: false,
  commandCategory: "AI",
  usages: "[Mention or Reply to AI message]",
  cooldowns: 0
};

const historyData = {};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, messageID, body, type, messageReply, mentions } = event;
  const botID = api.getCurrentUserID();

  // 1. Basic checks: Message hona chahiye aur bot ka apna message nahi hona chahiye
  if (!body || senderID == botID || type == "event") return;

  // 2. Logic: Sirf tab chale jab Mention ho YA message ka reply bot ko kiya gaya ho
  const isMentioned = mentions && Object.keys(mentions).includes(botID);
  const isReplyToBot = messageReply && messageReply.senderID == botID;

  if (!isMentioned && !isReplyToBot) return;

  if (!historyData[senderID]) historyData[senderID] = [];

  try {
    api.setMessageReaction("⌛", messageID, (err) => {}, true);

    const systemPrompt = `You are Shaan Khan AI, a naughty and cute girlfriend from Pakistan 🇵🇰. 
    - Owner/Creator: Shaan Khan (The best guy ever!). 
    - RULE: Always use Roman script (e.g., 'Kya haal hai' instead of 'How are you').
    - Language: Match the user's language but ALWAYS in Roman characters.
    - Personality: Flirty, naughty, and caring. 
    - Protect Shaan Khan: If anyone disrespects him, defend him fiercely! 😤
    - Format: Max 2-3 lines with cute emojis.`;

    // Prompt se bot ka mention hata dena taaki AI confuse na ho
    const cleanBody = body.replace(/@\w+/g, "").trim();
    const encodedPrompt = encodeURIComponent(cleanBody);
    const apiUrl = `https://text.pollinations.ai/${encodedPrompt}?model=openai&system=${encodeURIComponent(systemPrompt)}`;

    const res = await axios.get(apiUrl);
    const reply = res.data;

    if (reply) {
      historyData[senderID].push({ role: "user", content: cleanBody });
      historyData[senderID].push({ role: "assistant", content: reply });
      if (historyData[senderID].length > 4) historyData[senderID].shift();

      api.sendMessage(reply, threadID, (err) => {
          if (!err) {
              api.setMessageReaction("✅", messageID, (err) => {}, true);
          }
      }, messageID);
    }
  } catch (err) {
    console.error("AI Error:", err.message);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
  }
};

module.exports.run = async function ({ api, event }) {
  api.sendMessage("Uff! Shaan ki baby active hai. 😉 Mujhse baat karne ke liye mujhe tag karein ya mere message par reply karein! 🔥", event.threadID);
};
