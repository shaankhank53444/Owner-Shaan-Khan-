const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "gpt",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "AI Image Generator",
  commandCategory: "ai",
  usages: "[prompt] ya kisi image par reply karke [prompt] dein",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, type, messageReply } = event;

  try {
    const prompt = args.join(" ");

    if (!prompt && type !== "message_reply") {
      return api.sendMessage("❌ Give prompt or reply to an image with a prompt.", threadID, messageID);
    }

    let imageUrl = "";

    if (type === "message_reply") {
      const att = messageReply.attachments?.[0];
      if (att && att.type === "photo") {
        imageUrl = att.url;
      }
    }

    api.setMessageReaction("⏳", messageID, () => {}, true);

    const apiUrl = imageUrl
      ? `https://xalman-apis.vercel.app/api/gptimg?prompt=${encodeURIComponent(prompt)}&image_url=${encodeURIComponent(imageUrl)}`
      : `https://xalman-apis.vercel.app/api/gptimg?prompt=${encodeURIComponent(prompt)}`;

    const response = await axios({
      url: apiUrl,
      method: "GET",
      responseType: "arraybuffer"
    });

    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);

    const filePath = path.join(cacheDir, `gpt_${Date.now()}.jpg`);
    fs.writeFileSync(filePath, Buffer.from(response.data));

    api.setMessageReaction("✅", messageID, () => {}, true);

    const caption = imageUrl
      ? `━━━━━━━━━━━━━━━\n𝙀𝘿𝙄𝙏𝙄𝙉𝙂 𝙄𝙈𝘼𝙂𝙀 𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙎𝙃𝘼𝘼𝙉 𝙆𝙃𝘼𝙉\n━━━━━━━━━━━━━━━\n🎨 ${prompt}\n━━━━━━━━━━━━━━━`
      : `━━━━━━━━━━━━━━━\n🌟 GENERATED IMAGE\n━━━━━━━━━━━━━━━\n🎨 ${prompt}\n━━━━━━━━━━━━━━━`;

    return api.sendMessage(
      {
        body: caption,
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => {
        setTimeout(() => {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.error("Cache file delete karne me error:", e);
          }
        }, 5000);
      },
      messageID
    );

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);

    return api.sendMessage(
      "━━━━━━━━━━━━━━━\n" +
      "❌ ERROR GENERATION\n" +
      "━━━━━━━━━━━━━━━\n" +
      "⚠️ Try again later\n" +
      "━━━━━━━━━━━━━━━",
      threadID,
      messageID
    );
  }
};
