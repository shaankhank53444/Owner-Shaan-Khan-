const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "good night",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "SHAAN KHAN",
  description: "Auto Good Night reply with Imgur media",
  commandCategory: "no prefix",
  cooldowns: 5,
};

module.exports.handleEvent = async function ({ api, event }) {
  if (!event.body) return;

  let react = event.body.toLowerCase();
  let { threadID, messageID } = event;

  // ----- Trigger words -----
  if (
    react.includes("night") || 
    react.includes("good night") || 
    react.includes("gn") || 
    react.includes("shub ratri")
  ) {
    api.setMessageReaction("😴", messageID, () => {}, true);

    // ===== 🔥 UPDATED IMGUR LINK =====
    const imgurLink = "https://i.imgur.com/bUnsm41.jpeg";  

    try {
      // Download file
      const data = (
        await axios.get(imgurLink, { responseType: "arraybuffer" })
      ).data;

      // Detect extension
      let ext = "jpg";
      if (imgurLink.endsWith(".gif")) ext = "gif";
      if (imgurLink.endsWith(".png")) ext = "png";
      if (imgurLink.endsWith(".mp4")) ext = "mp4";
      if (imgurLink.endsWith(".jpeg")) ext = "jpeg";

      const path = __dirname + `/cache/goodnight.${ext}`;

      fs.writeFileSync(path, Buffer.from(data));

      // Send message with attachment
      api.sendMessage(
        {
          body: "𝐆𝐎𝐎𝐃 𝐍𝐈𝐆𝐇𝐓 𝐌𝐀𝐑𝐈 𝐉𝐀𝐀𝐍 𝐒𝐖𝐄𝐄𝐓 𝐃𝐑𝐄𝐀𝐌𝐒 😴🌃✨

»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««",
          attachment: fs.createReadStream(path),
        },
        threadID,
        () => fs.unlinkSync(path),
        messageID
      );
    } catch (err) {
      console.log(err);
      api.sendMessage("Baby Imgur link load nahi ho raha 😿", threadID);
    }
  }
};

module.exports.run = function () {};
