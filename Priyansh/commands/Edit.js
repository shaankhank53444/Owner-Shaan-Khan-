const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit",
  version: "1.4.0",
  hasPermssion: 0,
  credits: "Gemini",
  description: "Edit images using Gemini NanoBanana API",
  commandCategory: "Media",
  usages: "[prompt] - Reply to an image",
  prefix: true,
  cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply, type } = event;

  if (type !== "message_reply" || !messageReply || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("⚠️ Please reply to an image with your edit prompt!", threadID, messageID);
  }

  const prompt = args.join(" ");
  if (!prompt) return api.sendMessage("❌ Please provide an instruction (e.g., 'edit make it 3D')", threadID, messageID);

  const imageUrl = messageReply.attachments[0].url;
  const processingMsg = await api.sendMessage("🎨 NanoBanana is processing your image... No watermark mode active.", threadID);

  try {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

    // Latest Stable API (Anabot updated endpoint)
    // Hum encodeURIComponent use kar rahe hain taaki URL break na ho
    const apiUrl = `https://api.sandipbaruwal.com/nanobanana?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`;

    const response = await axios.get(apiUrl);
    
    // API response structure check
    const resultUrl = response.data.result || response.data.data?.url || response.data.url;

    if (!resultUrl) {
      throw new Error("API busy or invalid response.");
    }

    const filePath = path.join(cacheDir, `nano_${Date.now()}.png`);
    const imgRes = await axios.get(resultUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(filePath, Buffer.from(imgRes.data, 'binary'));

    api.unsendMessage(processingMsg.messageID);
    return api.sendMessage({
      body: `✅ Edited by NanoBanana AI\n\nPrompt: ${prompt}`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, messageID);

  } catch (error) {
    console.error(error);
    if (processingMsg) api.unsendMessage(processingMsg.messageID);
    
    // Final Fallback: Agar upar wali API fail ho jaye
    return api.sendMessage(`❌ API Error: Server overload hai. Please 1-2 minute baad try karein ya prompt badlein.`, threadID, messageID);
  }
};
