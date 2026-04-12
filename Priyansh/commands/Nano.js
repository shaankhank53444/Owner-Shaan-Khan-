const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "nano",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Generate images using Nano Banana 2 logic (Pollinations)",
  commandCategory: "AI-Image",
  usages: "[prompt]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const prompt = args.join(" ");
  if (!prompt) return api.sendMessage("❌ Prompt likhein! Maslan: /nano girl in forest", event.threadID);

  api.sendMessage("✨ Nano Banana 2 processing shuru kar raha hai...", event.threadID);

  try {
    const path = __dirname + `/cache/nano_${event.senderID}.png`;
    // Pollinations engine ka use
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${Math.floor(Math.random() * 1000)}&nologo=true`;

    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));

    return api.sendMessage({
      body: `✅ Image Generated!\nPrompt: ${prompt}`,
      attachment: fs.createReadStream(path)
    }, event.threadID, () => fs.unlinkSync(path), event.messageID);

  } catch (e) {
    return api.sendMessage("⚠️ API connect nahi ho rahi, baad mein try karein.", event.threadID);
  }
};
