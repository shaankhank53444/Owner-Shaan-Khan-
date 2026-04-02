const axios = require("axios");

module.exports.config = {
  name: "ai",
  version: "1.2.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Working AI Assistant",
  commandCategory: "AI",
  usages: "[question]",
  cooldowns: 2,
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID, body } = event;
  
  // Sawaal nikalne ka logic
  let question = args.join(" ");
  
  // Agar reply ya mention se kaam lena hai
  if (!question && event.messageReply) {
    question = event.messageReply.body;
  }

  if (!question) {
    return api.sendMessage("Ji Shaan Khan ki AI haazir hai, kuch poochna hai? 😊", threadID, messageID);
  }

  try {
    api.sendTypingIndicator(threadID);

    // Nayi aur Working API (Zyada stable)
    const res = await axios.get(`https://api.shadi-api.xyz/api/gpt?q=${encodeURIComponent(question)}`);
    
    let reply = res.data.result || res.data.reply || res.data.message || "Maaf kijiyega, abhi samajh nahi aaya! 😅";

    if (reply.length > 500) reply = reply.substring(0, 500) + "...";

    api.sendMessage(reply + " ✨", threadID, messageID);

  } catch (error) {
    console.error("API Error:", error);
    
    // Fallback if first one fails
    try {
      const fallback = await axios.get(`https://api.vreden.my.id/api/gpt?query=${encodeURIComponent(question)}`);
      api.sendMessage(fallback.data.result + " 💫", threadID, messageID);
    } catch (err) {
      api.sendMessage("Server down hai, thodi der baad try karein! 🛠️", threadID, messageID);
    }
  }
};
