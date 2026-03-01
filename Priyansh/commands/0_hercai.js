1111const axios = require("axios");

module.exports.config = {
  name: "hercai",
  version: "3.2.0",
  hasPermission: 0,
  credits: "Shaan Khan", 
  description: "Trigger on Start-Word (AI/Bot) OR Reply/Mention",
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
  
  // LOGIC: 
  // 1. Check if message starts with 'ai' or 'bot'
  const startsWithTrigger = userQuery.startsWith("ai") || userQuery.startsWith("bot");
  
  // 2. Check if user is replying to the bot's message
  const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();

  // Agar dono conditions false hain, to ignore kar do
  if (!startsWithTrigger && !isReplyToBot) return;

  // Trigger word ko clean karna agar start mein hai
  const cleanMessage = body.replace(/^(ai|bot)\s+/i, "");

  api.setMessageReaction("⌛", messageID, () => {}, true);
  
  if (!userMemory[senderID]) userMemory[senderID] = [];
  if (!lastScript[senderID]) lastScript[senderID] = "Roman Urdu";

  // Language Detection
  if (userQuery.includes("pashto") || userQuery.includes("پښتو")) {
    lastScript[senderID] = "NATIVE PASHTO SCRIPT (پښتو)";
  } else if (userQuery.includes("urdu") && (userQuery.includes("script") || userQuery.includes("mein"))) {
    lastScript[senderID] = "NATIVE URDU SCRIPT (اردو)";
  } else if (userQuery.includes("hindi") || userQuery.includes("हिंदी")) {
    lastScript[senderID] = "NATIVE HINDI SCRIPT (हिंदी)";
  } else if (userQuery.includes("roman")) {
    lastScript[senderID] = "Roman Urdu";
  }

  const systemPrompt = `You are an AI by Shaan Khan. 
  CURRENT SCRIPT: ${lastScript[senderID]}.
  RULES:
  1. If script is NATIVE, use ONLY native alphabets.
  2. Use relevant EMOJIS (😊, ✨, 🔥, 🥀) in every response.
  3. Respond in ${lastScript[senderID]} unless asked otherwise.
  4. Friendly tone.`;

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
          { role: "user", content: cleanMessage }
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

    userMemory[senderID].push(`U: ${cleanMessage}`);
    userMemory[senderID].push(`B: ${botReply}`);
    if (userMemory[senderID].length > 6) userMemory[senderID].splice(0, 2);

    api.setMessageReaction("✅", messageID, () => {}, true);
    return api.sendMessage(botReply, threadID, messageID);

  } catch (error) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ Error! Groq limit or key issue. ✨", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const command = args[0]?.toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ AI Active! Trigger: 'ai', 'bot', or Reply. 🎭", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("⚠️ AI Paused. 👋", threadID, messageID);
  } else if (command === "clear") {
    userMemory = {};
    lastScript = {};
    return api.sendMessage("🧹 Cleared! ✨", threadID, messageID);
  }
};
