/**
 * Unsend Command - Mariai Bot
 * Unsends a bot message when replied to OR when reacted with 😾
 */

module.exports = {
  config: {
    name: 'unsend',
    aliases: ['delete', 'remove'],
    description: 'Bot ke message par 😾 react karein ya reply karke unsend karein',
    usage: '{prefix}unsend (reply to bot message) or react with 😾',
    credit: 'Shaan',
    category: 'SYSTEM',
    hasPrefix: true,
    permission: 'PUBLIC',
    cooldown: 3
  },

  /**
   * Reaction Listener: Jab koi 😾 react karega
   */
  handleReaction: async function({ api, event }) {
    const { messageID, reaction, userID } = event;
    const botID = api.getCurrentUserID();

    // Check agar reaction "😾" hai aur message bot ka hai
    if (reaction === "😾") {
      api.getMessageInfo(messageID, (err, info) => {
        if (!err && info.senderID === botID) {
          return api.unsendMessage(messageID);
        }
      });
    }
  },

  /**
   * Command execution (Reply wala method)
   */
  run: async function({ api, message }) {
    const { threadID, messageID, messageReply } = message;

    try {
      if (!messageReply) {
        return api.sendMessage(
          '❌ Kisi bot message par reply karein ya uspar 😾 react karein.',
          threadID,
          messageID
        );
      }

      if (messageReply.senderID !== api.getCurrentUserID()) {
        return api.sendMessage(
          '❌ Main sirf apne messages unsend kar sakta hoon.',
          threadID,
          messageID
        );
      }

      return api.unsendMessage(messageReply.messageID);

    } catch (error) {
      return api.sendMessage('❌ Error: Message unsend nahi ho saka.', threadID, messageID);
    }
  }
};
