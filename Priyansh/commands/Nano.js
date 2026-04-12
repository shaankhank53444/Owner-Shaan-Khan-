const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "edit4",
  version: "4.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Prompt-based image generation with Nano Banana 2 branding",
  commandCategory: "AI-Image",
  usages: "[prompt]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const prompt = args.join(" ");
  if (!prompt) return api.sendMessage("❌ Please provide a prompt!", event.threadID);

  // Aapki demand ke mutabiq loading message
  api.sendMessage("✨ Nano Banana 2 editing your image...", event.threadID);

  try {
    const path = __dirname + `/cache/edit4_${Date.now()}.png`;
    
    // Hercai v3 API for strict prompt following
    const url = `https://hercai.onrender.com/v3/text2image?prompt=${encodeURIComponent(prompt)}`;

    const res = await axios.get(url);
    const imageUrl = res.data.url;

    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(path, Buffer.from(response.data, "binary"));

    return api.sendMessage({
      body: `🎯 Target: ${prompt}\n\n✅ powered by Shaan Khan`,
      attachment: fs.createReadStream(path)
    }, event.threadID, () => {
      if (fs.existsSync(path)) fs.unlinkSync(path);
    }, event.messageID);

  } catch (e) {
    return api.sendMessage("⚠️ Server prompt match nahi kar pa raha, dobara koshish karein.", event.threadID);
  }
};
