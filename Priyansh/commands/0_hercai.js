const axios = require("axios");
const request = require("request");

module.exports.config = {
  name: "hercai",
  version: "1.6.4",
  hasPermission: 0,
  credits: "SHANKAR SIR",
  description: "AI bot jo har language samajhta hai magar Roman Urdu mein baat karta hai",
  commandCategory: "AI",
  usePrefix: false,
  usages: "[Bot ke message par reply karein]",
  cooldowns: 5,
};

let userMemory = {};
let isActive = true;

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!isActive || !body) return;

  // Sirf bot ke message par reply karne par active hoga
  if (!messageReply || messageReply.senderID !== api.getCurrentUserID()) return;

  // **Wait reaction (⌛)**
  api.setMessageReaction("⌛", messageID, (err) => {}, true);

  const userQuery = body.trim();
  if (!userMemory[senderID]) userMemory[senderID] = [];

  const conversationHistory = userMemory[senderID].join("\n");
  
  // Instruction prompt taaki bot Roman Urdu mein hi jawab de
  const systemPrompt = "Instruction: User can speak any language, but you must respond naturally in Roman Urdu/Hindi. Context:\n";
  const fullQuery = systemPrompt + conversationHistory + `\nUser: ${userQuery}\nBot:`;

  const apiURL = `https://shankar-gpt-3-api.vercel.app/api?message=${encodeURIComponent(fullQuery)}`;

  try {
    const response = await axios.get(apiURL);
    let botReply = response.data.response || "Mujhe maaf karein, main samajh nahi pa raha hoon.";

    // Memory save karna
    userMemory[senderID].push(`User: ${userQuery}`);
    userMemory[senderID].push(`Bot: ${botReply}`);
    if (userMemory[senderID].length > 15) userMemory[senderID].splice(0, 2);

    // **Success reaction (✅)**
    api.setMessageReaction("✅", messageID, (err) => {}, true);

    return api.sendMessage({
      body: botReply,
    }, threadID, messageID);
  } catch (error) {
    console.error("API Error:", error.message);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
    return api.sendMessage("❌ Connection ka masla hai. Thodi der baad dubara koshish karein.", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const command = args[0] && args[0].toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ Hercai bot active ho gaya hai.", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("⚠️ Hercai bot ko band kar diya gaya hai.", threadID, messageID);
  } else if (command === "clear") {
    if (args[1] && args[1].toLowerCase() === "all") {
      userMemory = {};
      return api.sendMessage("🧹 Sabhi users ka data clear kar diya gaya hai.", threadID, messageID);
    }
    if (userMemory[senderID]) {
      delete userMemory[senderID];
      return api.sendMessage("🧹 Aapki chat history clear kar di gayi hai.", threadID, messageID);
    } else {
      return api.sendMessage("⚠️ Aapki koi history maujood nahi hai.", threadID, messageID);
    }
  }
};
