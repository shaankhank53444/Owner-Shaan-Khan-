module.exports.config = {
  name: "unsent",
  version: "5.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Emoji reaction ya command se bot ka message delete karein",
  commandCategory: "utility",
  usages: "[reply/react 😾]",
  cooldowns: 0
};

// Reaction detect karne ke liye
module.exports.handleEvent = async function ({ api, event }) {
  const { type, messageID, reaction } = event;

  // Agar reaction event hai aur 😾 emoji lagaya gaya hai
  if (type === "message_reaction" && reaction === "😾") {
    try {
      await api.unsendMessage(messageID);
    } catch (e) {}
  }
};

// Command (unsent, u, un) se reply karke delete karne ke liye
module.exports.run = async function ({ api, event }) {
  const { messageReply, type } = event;

  if (type === "message_reply") {
    if (messageReply.senderID === api.getCurrentUserID()) {
      try {
        await api.unsendMessage(messageReply.messageID);
      } catch (e) {}
    }
  }
};
