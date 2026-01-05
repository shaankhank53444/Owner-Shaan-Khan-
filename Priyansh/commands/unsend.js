module.exports.config = {
  name: "unsend",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "😼 emoji react par message delete",
  eventType: ["message_reaction"],
  cooldowns: 0
};

module.exports.run = async function ({ api, event }) {
  const { reaction, messageID, threadID } = event;

  try {
    // 😼 emoji check
    if (reaction === "😼") {
      api.removeMessage(messageID, threadID);
    }
  } catch (e) {
    console.log("😼 React Delete Error:", e);
  }
};