111const axios = require("axios");

module.exports.config = {
  name: "hercai",
  version: "3.2.7",
  hasPermission: 0,
  credits: "Shaan Khan", 
  description: "PIKA PI BOT - Short & Sweet AI Assistant",
  commandCategory: "AI",
  usePrefix: false,
  usages: "[ai/bot + message] OR [Reply to bot]",
  cooldowns: 2,
};

let userMemory = {};
let lastScript = {}; 
let isActive = true;

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

  if (startsWithTrigger && cleanMessage.length === 0) return;

  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
  if (!startsWithTrigger && !isReplyToBot) return;

  api.setMessageReaction("⌛", messageID, () => {}, true);

  if (!userMemory[senderID]) userMemory[senderID] = [];
  if (!lastScript[senderID]) lastScript[senderID] = "Roman Urdu";

  // Script detection
  if (userQuery.includes("pashto") || userQuery.includes("پښتو")) {
    lastScript[senderID] = "NATIVE PASHTO SCRIPT (پښتو)";
  } else if (userQuery.includes("urdu") && (userQuery.includes("script") || userQuery.includes("mein"))) {
    lastScript[senderID] = "NATIVE URDU SCRIPT (اردو)";
  } else if (userQuery.includes("roman")) {
    lastScript[senderID] = "Roman Urdu";
  }

  // UPDATED: Added Strict Short Response Rule
  const systemPrompt = `You are PIKA PI, a friendly AI assistant by Shaan Khan.
  RULES:
  1. Be sweet and polite.
  2. STRICT RULE: Keep replies extremely short (maximum 2 lines). 
  3. No long explanations or robotic greetings.
  4. Script: ${lastScript[senderID]}.
  5. Use 1-2 soft emojis like ❤️ or 🤗.`;

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
        temperature: 0.6,
        max_tokens: 80 // Kam tokens matlab short response
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
    if (userMemory[senderID].length > 6) userMemory[senderID].splice(0, 2);

    api.setMessageReaction("✅", messageID, () => {}, true);
    return api.sendMessage(botReply, threadID, messageID);

  } catch (error) {
    api.setMessageReaction("🥺", messageID, () => {}, true);
    return api.sendMessage("Oops! Thoda masla ho gaya. ❤️ Phir se try karein?", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const command = args[0]?.toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ PIKA PI online hai! 😊❤️", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("💤 Main thoda araam kar raha hoon. Bye! 🌸", threadID, messageID);
  } else if (command === "clear") {
    userMemory = {};
    lastScript = {};
    return api.sendMessage("🧹 Memory saaf ho gayi! 😊✨", threadID, messageID);
  }
};
