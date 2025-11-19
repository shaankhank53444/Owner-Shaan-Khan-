const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "good morning",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "SHAAN KHAN",
  description: "Auto Good Morning reply with Imgur media",
  commandCategory: "no prefix",
  cooldowns: 5,
};

module.exports.handleEvent = async function ({ api, event }) {
  if (!event.body) return;

  let react = event.body.toLowerCase();
  let { threadID, messageID } = event;

  // ----- Trigger words -----
  if (
    react.includes("morning") ||
    react.includes("good morning") ||
    react.includes("gm")
  ) {
    api.setMessageReaction("😻", messageID, () => {}, true);

    // ===== 🔥 ADD YOUR IMGUR LINK HERE =====
    // Support: GIF / PNG / JPG / VIDEO (mp4)
    const imgurLink = "https://i.imgur.com/unpkeoj.gif";  
    // Change this ↑ to your GIF/Photo/Video link

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

      const path = __dirname + `/cache/goodmorning.${ext}`;

      fs.writeFileSync(path, Buffer.from(data));

      // Send message with attachment
      api.sendMessage(
        {
          body: "𝐕𝐄𝐑𝐘 𝐆𝐎𝐎𝐃 𝐌𝐎𝐑𝐍𝐈𝐍𝐆 𝐌𝐀𝐑𝐈 𝐉𝐀𝐀𝐍 😻✨",
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