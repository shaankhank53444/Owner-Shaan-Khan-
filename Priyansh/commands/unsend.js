module.exports = {
  config: {
    name: "unsent",
    version: "4.0",
    author: "Shaan Khan",
    countDown: 0,
    role: 0,
    shortDescription: "Emoji reaction se bot ka message delete karein",
    category: "utility"
  },

  // Reaction handle karne ke liye
  onReaction: async function ({ api, event }) {
    const { messageID, reaction, userID } = event;

    // Yahan wo emoji set karein jis par delete karna hai (Default: 😾)
    const targetEmoji = "😾";

    if (reaction === targetEmoji) {
      try {
        // Message fetch karke verify karte hain ki wo bot ka hi message hai
        const messageInfo = await api.getMessageInfo(messageID);
        
        if (messageInfo.senderID === api.getCurrentUserID()) {
          await api.unsendMessage(messageID);
        }
      } catch (err) {
        // Direct unsend call fallback agar getMessageInfo fail ho
        try {
          await api.unsendMessage(messageID);
        } catch (e) {}
      }
    }
  },

  // Command run karne par manual delete ke liye
  onStart: async function ({ api, event }) {
    const { messageReply, type } = event;

    if (type === "message_reply" && messageReply?.senderID === api.getCurrentUserID()) {
      try {
        await api.unsendMessage(messageReply.messageID);
      } catch (e) {}
    }
  }
};
