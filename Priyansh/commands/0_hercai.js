1111const axios = require("axios");

module.exports.config = {
  name: "hercai",
  version: "3.0.0",
  hasPermission: 0,
  credits: "Shaan Khan", 
  description: "Strict Script Forcer using Groq API",
  commandCategory: "AI",
  usePrefix: false,
  usages: "[Reply to bot]",
  cooldowns: 2,
};

let userMemory = {};
let lastScript = {}; 
let isActive = true;

// Yahan apni Groq API Key dalein
const GROQ_API_KEY = "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"; 

module.exports.handleEvent = async function ({ api, event }) {
  if (global.client.commands.get("hercai").config.credits !== "Shaan Khan") {
    return api.sendMessage("⚠️ Error: Credits changed. Creator: Shaan Khan", event.threadID, event.messageID);
  }

  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!isActive || !body) return;
  if (!messageReply || messageReply.senderID !== api.getCurrentUserID()) return;

  api.setMessageReaction("⌛", messageID, () => {}, true);
  
  const userQuery = body.toLowerCase();
  if (!userMemory[senderID]) userMemory[senderID] = [];
  
  if (!lastScript[senderID]) lastScript[senderID] = "Roman Urdu";

  // Strict Language Detection Logic
  if (userQuery.includes("pashto") || userQuery.includes("پښتو")) {
    lastScript[senderID] = "NATIVE PASHTO SCRIPT (پښتو)";
  } else if (userQuery.includes("urdu") && (userQuery.includes("script") || userQuery.includes("mein"))) {
    lastScript[senderID] = "NATIVE URDU SCRIPT (اردو)";
  } else if (userQuery.includes("hindi") || userQuery.includes("हिंदी")) {
    lastScript[senderID] = "NATIVE HINDI SCRIPT (हिंदी)";
  } else if (userQuery.includes("roman")) {
    lastScript[senderID] = "Roman Urdu";
  }

  // System Prompt as per your logic
  const systemPrompt = `You are an AI by Shaan Khan. 
  CURRENT SCRIPT: ${lastScript[senderID]}.
  
  RULES:
  1. If script is NATIVE (Urdu/Pashto/Hindi), NEVER use Roman English letters (a, b, c). Use ONLY their respective native alphabets.
  2. Use relevant EMOJIS (😊, ✨, 🔥, 🥀, etc.) in every response.
  3. If user speaks in Roman Urdu, respond in ${lastScript[senderID]} unless they say "Roman mein baat karo".
  4. Keep the tone friendly.`;

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
          { role: "user", content: body }
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

    userMemory[senderID].push(`U: ${body}`);
    userMemory[senderID].push(`B: ${botReply}`);
    if (userMemory[senderID].length > 6) userMemory[senderID].splice(0, 2);

    api.setMessageReaction("✅", messageID, () => {}, true);
    return api.sendMessage(botReply, threadID, messageID);

  } catch (error) {
    console.error("Groq Error:", error.response?.data || error.message);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ Groq API Error! Check your API key or limit. ✨", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const command = args[0]?.toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ AI Active on Groq. Emojis and Script Lock enabled! 🎭", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("⚠️ AI Paused. 👋", threadID, messageID);
  } else if (command === "clear") {
    userMemory = {};
    lastScript = {};
    return api.sendMessage("🧹 History and Language reset! ✨", threadID, messageID);
  }
};
