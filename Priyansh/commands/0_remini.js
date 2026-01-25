const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "gemini",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "AI Image Generator - Follows your prompt exactly",
  commandCategory: "ai",
  usages: ".dp <your prompt>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const prompt = args.join(" ");
    if (!prompt) {
      return api.sendMessage("❌ Kya banana hai? Prompt likho.\nExample: .dp a real man sitting on a chair", event.threadID, event.messageID);
    }

    api.sendMessage("⌛ Aapke prompt ke hisaab se image ban rahi hai...", event.threadID);

    // Is API mein 'flux' model use kiya hai jo prompt ko exact follow karta hai
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&enhance=true`;

    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });

    const imgPath = path.join(cachePath, `ai_img_${Date.now()}.png`);

    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    await fs.writeFile(imgPath, Buffer.from(response.data));

    return api.sendMessage(
      {
        body: `✅ Result for: "${prompt}"`,
        attachment: fs.createReadStream(imgPath)
      },
      event.threadID,
      () => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      },
      event.messageID
    );
  } catch (err) {
    console.error(err);
    api.sendMessage("❌ API Error! Baad mein try karein.", event.threadID);
  }
};
