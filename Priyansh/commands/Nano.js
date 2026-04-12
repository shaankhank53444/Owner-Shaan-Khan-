const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "edit4",
  version: "3.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Strict prompt-to-image engine with Shaan Khan credits",
  commandCategory: "AI-Image",
  usages: "[prompt]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const prompt = args.join(" ");
  if (!prompt) return api.sendMessage("❌ Kya banana hai? Prompt likhen!", event.threadID);

  api.sendMessage("⚙️ Aapke prompt ka tajziya ho raha hai...", event.threadID);

  try {
    const path = __dirname + `/cache/edit4_${Date.now()}.png`;
    
    // Strict prompt logic with unique seed
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&enhance=false&seed=${Date.now()}`;

    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(path, Buffer.from(response.data, "binary"));

    return api.sendMessage({
      body: `🎯 Target: ${prompt}\n\n✅ powered by Shaan Khan`,
      attachment: fs.createReadStream(path)
    }, event.threadID, () => {
      if (fs.existsSync(path)) fs.unlinkSync(path);
    }, event.messageID);

  } catch (e) {
    return api.sendMessage("⚠️ Image generate nahi ho saki, dobara try karein.", event.threadID);
  }
};
