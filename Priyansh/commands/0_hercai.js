const axios = require("axios");

module.exports.config = {
  name: "hercai",
  version: "3.2.3",
  hasPermission: 0,
  credits: "Shaan Khan", 
  description: "PIKA PI BOT - Optimized for Llama 3.3",
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

  // Logic: Empty trigger par reply nahi dena
  if (startsWithTrigger && cleanMessage.length === 0) return;

  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
  if (!startsWithTrigger && !isReplyToBot) return;

  api.setMessageReaction("⌛", messageID, () => {}, true);

  if (!userMemory[senderID]) userMemory[senderID] = [];
  if (!lastScript[senderID]) lastScript[senderID] = "Roman Urdu";

  // Advanced Language Detection
  if (userQuery.includes("pashto") || userQuery.includes("پښتو")) {
    lastScript[senderID] = "NATIVE PASHTO SCRIPT (پښتو)";
  } else if (userQuery.includes("urdu") && (userQuery.includes("script") || userQuery.includes("mein"))) {
    lastScript[senderID] = "NATIVE URDU SCRIPT (اردو)";
  } else if (userQuery.includes("roman")) {
    lastScript[senderID] = "Roman Urdu";
  }

  // Optimized Llama 3 System Prompt
  const systemPrompt = `You are PIKA PI BOT, an advanced AI created by Shaan Khan.
  Personality: Friendly, loyal, and energetic.
  Greeting: You must start your responses with "Pika Pi aap ki khidmat main hazir hai 😊" if the conversation is starting or contextually appropriate.
  Script: Always respond in ${lastScript[senderID]}. 
  Style: Use ⚡ and ✨ emojis frequently to match the "Pika" lightning theme. 
  Context: Keep your answers concise but helpful.`;

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
        temperature: 0.6, // Thoda stable responses ke liye
        max_tokens: 2048,
        top_p: 0.9
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
    if (userMemory[senderID].length > 8) userMemory[senderID].splice(0, 2); // Memory thodi barha di hai

    api.setMessageReaction("✅", messageID, () => {}, true);
    return api.sendMessage(botReply, threadID, messageID);

  } catch (error) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    console.error(error);
    return api.sendMessage("❌ Pika Pi! Groq system main koi masla lag raha hai. ✨", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const command = args[0]?.toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ PIKA PI BOT is now Online! ⚡✨", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("⚠️ PIKA PI BOT is now Sleeping... 💤", threadID, messageID);
  } else if (command === "clear") {
    userMemory = {};
    lastScript = {};
    return api.sendMessage("🧹 Pika! Memory clear ho gayi. ✨", threadID, messageID);
  }
};
