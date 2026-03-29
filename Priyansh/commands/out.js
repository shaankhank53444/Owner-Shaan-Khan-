module.exports.config = {
  name: "leaveNoPrefix",
  version: "1.0.2",
  hasPermssion: 2,
  credits: "Shaan Khan",
  description: "Bina prefix ke out, nikal, ya leave par bot group chhor dega",
  commandCategory: "Admin",
  usages: "out / nikal / leave",
  cooldowns: 0
};

module.exports.handleEvent = async function({ api, event }) {
    const { threadID, messageID, body, senderID } = event;
    if (!body) return;

    // Aapke bataye huye words: out, nikal, leave
    const triggerWords = ["out", "nikal", "leave"];
    const messageLower = body.toLowerCase();

    // Check karna ke message triggers mein se koi ek hai
    if (triggerWords.includes(messageLower)) {
        
        // Security Check: Sirf aap (Admin) hi nikal sakein
        const adminID = "100016828397863"; // Aapki Fix UID
        if (senderID !== adminID) return;

        const exitMessage = "Boss ka hukum hai, jaane ko bol raha hai! 👋";

        return api.sendMessage(exitMessage, threadID, () => {
            api.removeUserFromGroup(api.getCurrentUserID(), threadID);
        });
    }
};

module.exports.run = async function({}) {
    // Ye section khali rahega kyunki handleEvent use ho raha hai
};
