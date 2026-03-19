const axios = require("axios");
const request = require("request");
const fs = require("fs-extra");

module.exports.config = {
  name: "kheer",
  version: "2.6.0",
  hasPermssion: 0,
  credits: "Shaan Khan", 
  description: "Sends random kheer images from web links",
  commandCategory: "no prefix",
  cooldowns: 5,
};

module.exports.handleEvent = async ({ api, event, Users }) => {
  const { threadID, messageID, body } = event;
  if (!body) return;

  let react = body.toLowerCase();
  if (react.includes("kheer") || react.includes("khir")) {
    const name = await Users.getNameUser(event.senderID);
    
    // Google se collect kiye gaye kheer images ke links
    const kheerImages = [
      "[attachment_0](attachment)",
      "[attachment_1](attachment)",
      "[attachment_2](attachment)",
      "[attachment_3](attachment)",
      "[attachment_4](attachment)",
      "[attachment_5](attachment)",
      "[attachment_6](attachment)",
      "[attachment_7](attachment)",
      "[attachment_8](attachment)",
      "[attachment_9](attachment)",
      "[attachment_1](attachment)0",
      "[attachment_1](attachment)1",
      "[attachment_1](attachment)2",
      "[attachment_1](attachment)3",
      "[attachment_1](attachment)4"
    ];

    const randomKheer = kheerImages[Math.floor(Math.random() * kheerImages.length)];
    const path = __dirname + `/cache/kheer_${event.senderID}.jpg`;

    api.setMessageReaction("🤤", messageID, (err) => {}, true);

    const callback = () => api.sendMessage({
      body: `${name} 𝐋𝐎 𝐁𝐀𝐁𝐘 𝐀𝐏𝐊𝐀 𝐊𝐇𝐄𝐄𝐑 𝐀𝐆𝐀𝐘𝐀💐✿\n*╔═══❖•⊰ ☞𓅂 𝐌𝐀𝐃𝐄 ♡ 𝐁𝐘 ♡ 𝐒𝐇𝐀𝐀𝐍𓅂☜ ⊱•❖═══╗*`,
      attachment: fs.createReadStream(path)
    }, threadID, () => fs.unlinkSync(path), messageID);

    request(encodeURI(randomKheer))
      .pipe(fs.createWriteStream(path))
      .on("close", callback);
  }
};

module.exports.run = async ({}) => {};
