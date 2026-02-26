const fs = require("fs");

module.exports.config = {
  name: "SHAAN",
  version: "2.1.2",
  hasPermssion: 0,
  credits: "𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍", 
  description: "Sirf shuruat mein naam lene par reply karega",
  commandCategory: "no prefix",
  cooldowns: 5, 
};

module.exports.handleEvent = async ({ api, event, Users }) => {
  if (!event.body) return; // Agar message khali ho

  var name = await Users.getNameUser(event.senderID);
  var { threadID, messageID } = event;
  let react = event.body.toLowerCase();

  // In shabdon se shuru hona chahiye
  const triggerWords = ["shaan khan", "shan khan", "shaan", "shan"];

  // Check if the message STARTS with any of the trigger words
  const startsWithName = triggerWords.some(word => react.startsWith(word));

  if (startsWithName) {
    var msg = {
      body: `${name} 𝐘𝐀𝐑 𝐒𝐇𝐀𝐀𝐍 𝐊𝐎 𝐌𝐄𝐍𝐓𝐈𝐎𝐍 𝐍𝐀 𝐊𝐀𝐑𝐎 𝐌𝐔𝐉𝐇𝐄 𝐒𝐇𝐀𝐑𝐀𝐌 𝐀𝐀𝐓𝐈 𝐇𝐀𝐈🙈🙈🙈`,
      attachment: fs.createReadStream(__dirname + `/noprefix/1711811285337.jpg`)
    };

    api.sendMessage(msg, threadID, messageID);
    api.setMessageReaction("💋", messageID, (err) => {}, true);
  }
};

module.exports.run = async ({ api, event }) => {
  // Run function blank hi rahegi no-prefix ke liye
};
