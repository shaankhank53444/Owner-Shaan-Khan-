const axios = require("axios");

module.exports.config = {
  name: "hercai",
  version: "3.2.6",
  hasPermission: 0,
  credits: "Shaan Khan", 
  description: "PIKA PI BOT - Friendly & Sweet AI Assistant",
  commandCategory: "AI",
  usePrefix: false,
  usages: "[ai/bot + message] OR [Reply to bot]",
  cooldowns: 2,
};

let userMemory = {};
let lastScript = {}; 
let isActive = true;

// Nayi API Key update kar di gayi hai
const GROQ_API_KEY = "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"; 

module.exports.handleEvent = async function ({ api, event }) {
  if (global.client.commands.get("hercai").config.credits !== "Shaan Khan") {
    return api.sendMessage("⚠️ Error: Credits changed. Creator: Shaan Khan", event.threadID, event.messageID);
  }

  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!isActive || !body) return;

  const userQuery = body.toLowerCase().trim();
  const startsWithTrigger = userQuery.startsWith("ai") || userQuery.startsWith("bot");
  const cleanMessage = body.replace(/^(ai|bot)\s*/i, "").trim();

  // Empty trigger par ignore karein
  if (startsWithTrigger && cleanMessage.length === 0) return;

  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
  if (!startsWithTrigger && !isReplyToBot) return;

  // React with a heart for processing
  api.setMessageReaction("⌛", messageID, () => {}, true);

  if (!userMemory[senderID]) userMemory[senderID] = [];
  if (!lastScript[senderID]) lastScript[senderID] = "Roman Urdu";

  // Language Script detection
  if (userQuery.includes("pashto") || userQuery.includes("پښتو")) {
    lastScript[senderID] = "NATIVE PASHTO SCRIPT (پښتو)";
  } else if (userQuery.includes("urdu") && (userQuery.includes("script") || userQuery.includes("mein"))) {
    lastScript[senderID] = "NATIVE URDU SCRIPT (اردو)";
  } else if (userQuery.includes("roman")) {
    lastScript[senderID] = "Roman Urdu";
  }

  // Soft & Polite System Prompt
  const systemPrompt = `You are PIKA PI, a friendly AI assistant developed by Shaan Khan.
  RULES:
  1. Be extremely polite, sweet, and caring.
  2. Avoid formal or robotic greetings like "khidmat main hazir hai".
  3. Respond directly but with warmth.
  4. Script: ${lastScript[senderID]}.
  5. Personality: Use soft emojis like ❤️, 😳, 😘, and 🤗 to show love and kindness.`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...userMemory[senderID].map(msg => ({
            role: msg.startsWith("U:") ? "user" : "assistant",
            content: msg.slice(3)
          })),
          { role: "user", content: cleanMessage || body }
        ],
        temperature: 0.7,
        max_tokens: 2048
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let botReply = response.data.choices[0].message.content;

    userMemory[senderID].push(`U: ${cleanMessage || body}`);
    userMemory[senderID].push(`B: ${botReply}`);
    if (userMemory[senderID].length > 8) userMemory[senderID].splice(0, 2);

    api.setMessageReaction("✅", messageID, () => {}, true);
    return api.sendMessage(botReply, threadID, messageID);

  } catch (error) {
    api.setMessageReaction("🥺", messageID, () => {}, true);
    return api.sendMessage("Maaf kijiyega, thoda connection masla ho raha hai. ❤️ Phir se try karein?", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const command = args[0]?.toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ PIKA PI ab online hai! 😊❤️", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("💤 Main thodi der araam kar raha hoon. Khuda hafiz! 🌸", threadID, messageID);
  } else if (command === "clear") {
    userMemory = {};
    lastScript = {};
    return api.sendMessage("🧹 Sab kuch saaf ho gaya! Ab naye sire se baat karte hain 😊✨", threadID, messageID);
  }
};
