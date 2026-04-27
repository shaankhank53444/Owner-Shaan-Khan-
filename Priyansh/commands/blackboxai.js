const axios = require("axios");

module.exports.config = {
  name: "blackai",
  version: "1.3.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "blackai bot with memory and context-aware conversation.",
  commandCategory: "AI",
  usages: "[your question]",
  cooldowns: 5,
};

let userMemory = {}; // Store conversation memory for each user
let isActive = true; // Auto-start enabled

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  // Check if the bot is active and the message is valid
  if (!isActive || !body) return;

  const userQuery = body.trim();

  // Initialize memory for the user if not already present
  if (!userMemory[senderID]) userMemory[senderID] = { history: [] };

  // If the user is replying to the bot's message, continue the conversation
  if (messageReply && messageReply.senderID === api.getCurrentUserID()) {
    userMemory[senderID].history.push({ role: "user", content: userQuery });
  } else if (body.toLowerCase().includes("blackai")) {
    // If "blackai" is mentioned, treat it as a new query
    const cleanedQuery = body.toLowerCase().replace("blackai", "").trim();
    userMemory[senderID].history.push({ role: "user", content: cleanedQuery });
  } else {
    return;
  }

  // Take only the last 10 messages for context
  const recentConversation = userMemory[senderID].history.slice(-10);

  try {
    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Tumhara naam blackai hai. Shaan Khan tumhara boss hai. Roman Urdu mein jawab do." },
        ...recentConversation
      ]
    }, {
      headers: {
        "Authorization": "Bearer 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"
      }
    });

    const botReply = response.data.choices[0].message.content;

    // Add the bot's response to the conversation history
    userMemory[senderID].history.push({ role: "assistant", content: botReply });

    // Send the bot's reply to the user
    return api.sendMessage(botReply, threadID, messageID);
  } catch (error) {
    return api.sendMessage("❌ API se jawab lane mein masla hua. Baad mein try karen.", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const command = args[0] && args[0].toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ Blackai bot ab active hai.", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("⚠️ Blackai bot ab off kar diya gaya hai.", threadID, messageID);
  } else if (command === "clear") {
    // Clear history for all users
    if (args[1] && args[1].toLowerCase() === "all") {
      userMemory = {}; // Reset memory
      return api.sendMessage("🧹 Sabhi users ki history clear kar di gayi hai.", threadID, messageID);
    }

    // Clear history for the current user
    if (userMemory[senderID]) {
      delete userMemory[senderID];
      return api.sendMessage("🧹 Aapki history clear kar di gayi hai.", threadID, messageID);
    } else {
      return api.sendMessage("⚠️ Aapki koi history nahi mili.", threadID, messageID);
    }
  }

  const userQuery = args.join(" ");

  if (!userQuery) {
    return api.sendMessage("❓ Please apna sawal puche! Example: blackai kaise ho?", threadID, messageID);
  }

  // Initialize memory for the user if not already present
  if (!userMemory[senderID]) userMemory[senderID] = { history: [] };

  // Add the user's query to their conversation history
  userMemory[senderID].history.push({ role: "user", content: userQuery });

  // Take only the last 10 messages for context
  const recentConversation = userMemory[senderID].history.slice(-10);

  try {
    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Tumhara naam blackai hai. Shaan Khan tumhara boss hai. Roman Urdu mein jawab do." },
        ...recentConversation
      ]
    }, {
      headers: {
        "Authorization": "Bearer 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"
      }
    });

    const botReply = response.data.choices[0].message.content;

    // Add the bot's response to the conversation history
    userMemory[senderID].history.push({ role: "assistant", content: botReply });

    // Send the bot's reply to the user
    return api.sendMessage(botReply, threadID, messageID);
  } catch (error) {
    return api.sendMessage("❌ API se jawab lane mein masla hua. Baad mein try karen.", threadID, messageID);
  }
};
