const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "4k",
  version: "1.1",
  hasPermssion: 0,
  credits: "Shaan (Converted by Shaan)",
  description: "Upscale images to 4K resolution",
  commandCategory: "image",
  usages: "reply to an image",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, messageReply } = event;

  if (
    !messageReply ||
    !messageReply.attachments ||
    messageReply.attachments.length === 0 ||
    messageReply.attachments[0].type !== "photo"
  ) {
    return api.sendMessage("📸 Please reply to an image to upscale it.", threadID, messageID);
  }

  const imgurl = encodeURIComponent(messageReply.attachments[0].url);
  const apikey = "ArYANAHMEDRUDRO";
  const upscaleUrl = `https://aryan-xyz-upscale-api-phi.vercel.app/api/upscale-image?imageUrl=${imgurl}&apikey=${apikey}`;

  api.sendMessage("🔄 Processing your image, please wait...", threadID, async (err, info) => {
    try {
      const res = await axios.get(upscaleUrl);
      const resultUrl = res.data.resultImageUrl;

      const imgRes = await axios.get(resultUrl, { responseType: "stream" });
      const tempPath = path.join(__dirname, "cache", `4k_${Date.now()}.png`);

      const writer = fs.createWriteStream(tempPath);
      imgRes.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          body: "✅ Your 4K upscaled image is ready!",
          attachment: fs.createReadStream(tempPath)
        }, threadID, () => {
          fs.unlinkSync(tempPath);
          api.unsendMessage(info.messageID);
        }, messageID);
      });

      writer.on("error", err => {
        console.error(err);
        api.sendMessage("❌ Failed to write the upscaled image.", threadID, messageID);
      });

    } catch (e) {
      console.error("Upscale Error:", e.message);
      api.sendMessage("❌ Error occurred while upscaling the image.", threadID, messageID);
    }
  });
};