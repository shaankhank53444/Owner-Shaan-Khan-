const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit", // Command name
  version: "1.0.0",
  hasPermission: 0, // Spelling fixed
  credits: "SHAAN",
  description: "Edit images using NanoBanana AI",
  commandCategory: "Media",
  usages: "[prompt] - Reply to an image",
  prefix: true, // Make sure your bot global prefix is set
  cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply, type } = event;

  // Check if it's a reply
  if (type !== "message_reply" || !messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage(
      "⚠️ Please reply to an image with your edit prompt!\n\n📝 Usage: edit [prompt]",
      threadID,
      messageID
    );
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage("❌ Please reply to an image!", threadID, messageID);
  }

  const prompt = args.join(" ");
  if (!prompt) {
    return api.sendMessage("❌ Please provide a prompt (e.g., edit make it black and white)", threadID, messageID);
  }

  const imageUrl = attachment.url;
  const processingMsg = await api.sendMessage("🎨 Processing your image...", threadID);

  try {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    // Note: Cookies expire quickly. If it fails, update the cookie.
    const cookie = "AEC=AVh_V2iyBHpOrwnn7CeXoAiedfWn9aarNoKT20Br2UX9Td9K-RAeS_o7Sg..."; 

    const apiUrl = `https://anabot.my.id/api/ai/geminiOption?prompt=${encodeURIComponent(prompt)}&type=NanoBanana&imageUrl=${encodeURIComponent(imageUrl)}&cookie=${encodeURIComponent(cookie)}&apikey=freeApikey`;

    const response = await axios.get(apiUrl);

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || "API Error");
    }

    const resultUrl = response.data.data?.result?.url;
    const filePath = path.join(cacheDir, `edit_${Date.now()}.png`);

    const imageResponse = await axios({
      url: resultUrl,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(filePath);
    imageResponse.data.pipe(writer);

    writer.on("finish", () => {
      api.unsendMessage(processingMsg.messageID);
      api.sendMessage({
        body: `✨ Edited Successfully!\nPrompt: ${prompt}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => fs.unlinkSync(filePath), messageID);
    });

  } catch (error) {
    console.error(error);
    api.sendMessage("❌ Error: " + error.message, threadID, messageID);
  }
};
