module.exports.config = {
    name: "reactDelete",
    eventType: ["message_reaction"],
    version: "1.0.0",
    credits: "Shaan Khan",
    description: "Delete bot message on reaction"
};

module.exports.run = async function({ api, event }) {
    const { messageID, reaction, senderID } = event;
    const deleteEmojis = global.config.reactBy?.delete || ["😾", "❌", "😠", "🗑️", "😡"];

    if (deleteEmojis.includes(reaction)) {
        api.getMessageInfo(messageID, (err, info) => {
            if (err) return;
            if (info.senderID == api.getCurrentUserID()) {
                api.unsend(messageID);
            }
        });
    }
};
