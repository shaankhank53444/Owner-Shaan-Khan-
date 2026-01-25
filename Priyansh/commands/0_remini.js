const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "gemini",
  version: "1.5.0",
  hasPermssion: 0,
  credits: "ARIF BABU",
  description: "AI DP / Image Generator (Fixed)",
  commandCategory: "ai",
  usages: ".dp <prompt>",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const prompt = args.join(" ");
    if (!prompt) {
      return api.sendMessage("❌ Prompt do bhai\nExample: .dp cute boy", event.threadID, event.messageID);
    }

    api.sendMessage("🎨 AI DP generate ho rahi hai, thoda intezar karein...", event.threadID);

    // Ye ek Free high-quality image engine hai
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux`;

    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });

    const imgPath = path.join(cachePath, `dp_${Date.now()}.png`);

    // Image download logic
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    await fs.writeFile(imgPath, Buffer.from(response.data));

    return api.sendMessage(
      {
        body: `✅ Gemini AI DP Ready\nPrompt: ${prompt}`,
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
    api.sendMessage("❌ Server down hai ya error aaya hai.", event.threadID);
  }
};
