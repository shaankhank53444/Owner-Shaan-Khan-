const axios = require("axios");

module.exports.config = {
  name: "ai",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "AI assistant that talks like a human",
  commandCategory: "AI",
  usages: "[question] - reply to bot or mention",
  cooldowns: 3,
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID, body, mentions } = event;
  
  // Check if bot is mentioned or user is replying to bot
  const botID = api.getCurrentUserID();
  const isMentioned = mentions && Object.keys(mentions).includes(botID);
  const isReplying = event.messageReply && event.messageReply.senderID === botID;
  
  // Get user's question
  let question = "";
  
  if (isMentioned) {
    // Remove bot mention from message
    question = body;
    Object.keys(mentions).forEach(id => {
      question = question.replace(`@${mentions[id]}`, "").trim();
    });
    question = question.replace(botID, "").trim();
  } else if (isReplying) {
    question = args.join(" ");
  } else if (args.length > 0) {
    question = args.join(" ");
  } else {
    return;
  }
  
  if (!question) {
    const greetings = [
      "Haan bolo, sun raha hu! 💫",
      "Ji boliye, kaise help karu? 😊",
      "Hello! Kya chahiye aapko? ✨",
      "Haan ji, main hu yahan! 👋"
    ];
    return api.sendMessage(greetings[Math.floor(Math.random() * greetings.length)], threadID, messageID);
  }
  
  try {
    api.sendTypingIndicator(threadID);
    
    // Working API - using free Gemini API
    const apiUrl = `https://deku-rest-apis.gleeze.com/api/gpt?q=${encodeURIComponent(question)}&uid=${senderID}`;
    
    const response = await axios.get(apiUrl, { timeout: 15000 });
    
    let reply = "";
    
    if (response.data && response.data.result) {
      reply = response.data.result;
    } else if (response.data && response.data.response) {
      reply = response.data.response;
    } else if (response.data && response.data.message) {
      reply = response.data.message;
    } else if (response.data && response.data.reply) {
      reply = response.data.reply;
    } else {
      reply = response.data || "Samajh nahi aaya bhai! 😅";
    }
    
    // Shorten reply to 1-2 lines
    if (reply.length > 250) {
      reply = reply.substring(0, 250) + "...";
    }
    
    // Add human touch
    const shortReplies = [
      reply,
      reply + " 😊",
      reply + " ✨",
      reply + " 💫",
      reply + " 👍"
    ];
    
    const finalReply = shortReplies[Math.floor(Math.random() * shortReplies.length)];
    
    api.sendMessage(finalReply, threadID, messageID);
    
  } catch (error) {
    console.error("AI Error:", error);
    
    // Working fallback API
    try {
      const fallbackUrl = `https://api.siputzx.my.id/api/ai/gpt4?query=${encodeURIComponent(question)}`;
      const fallbackRes = await axios.get(fallbackUrl, { timeout: 15000 });
      
      let fallbackReply = fallbackRes.data?.data || fallbackRes.data?.response || fallbackRes.data?.result || "Kuch aur pucho bhai! 😅";
      
      if (fallbackReply.length > 250) fallbackReply = fallbackReply.substring(0, 250) + "...";
      
      api.sendMessage(fallbackReply + " ✨", threadID, messageID);
    } catch (err) {
      const fallbacks = [
        "Thoda der baat karte hai, abhi thoda busy hu! 😅",
        "Ye sawaal thoda mushkil hai, simple pucho bhai! 💫",
        "Mujhe nahi pata yaar! Kuch aur pucho? 😊",
        "Main abhi thoda tired hu, thodi der baad puchna! ✨",
        "Acha sawaal hai, lekin answer nahi pata mujhe! 😄"
      ];
      api.sendMessage(fallbacks[Math.floor(Math.random() * fallbacks.length)], threadID, messageID);
    }
  }
};
