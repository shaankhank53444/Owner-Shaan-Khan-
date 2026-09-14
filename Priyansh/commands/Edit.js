const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit",
  version: "4.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "AI se image edit karein photo ko reply karke.",
  commandCategory: "AI-IMAGE",
  usages: "[reply image] [prompt]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, type, messageReply } = event;

  // Verification: Reply check aur photo attachment check
  if (
    type !== "message_reply" ||
    !messageReply.attachments ||
    messageReply.attachments.length === 0 ||
    messageReply.attachments[0].type !== "photo"
  ) {
    return api.sendMessage("⚠️ | Kripya kisi image ko reply karke command chalaein.", threadID, messageID);
  }

  const prompt = args.join(" ");
  if (!prompt) {
    return api.sendMessage("📝 | Kripya prompt dein.\nExample: edit change background to space", threadID, messageID);
  }

  const imageUrl = encodeURIComponent(messageReply.attachments[0].url);
  const cacheDir = path.join(__dirname, "cache");
  const filePath = path.join(cacheDir, `edited_image_${Date.now()}.png`);

  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  // Reaction & Processing status
  api.setMessageReaction("🎨", messageID, (err) => {}, true);

  return api.sendMessage("🪄 Processing your image please wait...", threadID, async (err, info) => {
    try {
      const API_URL = `https://xalman-apis.vercel.app/api/edit?img=${imageUrl}&prompt=${encodeURIComponent(prompt)}`;

      const response = await axios({
        method: "GET",
        url: API_URL,
        responseType: "arraybuffer",
        timeout: 240000
      });

      await fs.writeFile(filePath, Buffer.from(response.data));

      api.setMessageReaction("✅", messageID, (err) => {}, true);
      if (info && info.messageID) api.unsendMessage(info.messageID);

      return api.sendMessage(
        {
          body: `✨ 𝗜𝗠𝗔𝗚𝗘 𝗘𝗗𝗜𝗧𝗘𝗗 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟𝗟𝗬
𝗢𝗪𝗡𝗘𝗥 : 𝗦𝗛𝗔𝗔𝗡 𝗞𝗛𝗔𝗡 ✨\n━━━━━━━━━━━━━━━━━━━\nPrompt: ${prompt}\nEdited by: Shaan Khan`,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        },
        messageID
      );

    } catch (err) {
      api.setMessageReaction("❌", messageID, (err) => {}, true);
      if (info && info.messageID) api.unsendMessage(info.messageID);

      const errorMsg = err.code === "ECONNABORTED"
        ? "⏱️ | Request Timeout: Server ne jawab dene mein zyaada waqt liya."
        : "🚫 | API Error: Image edit nahi ho saki.";

      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return api.sendMessage(errorMsg, threadID, messageID);
    }
  });
};
