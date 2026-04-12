const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "ediit4",
  version: "4.5.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Nano Banana 2 Image Engine",
  commandCategory: "AI-Image",
  usages: "[prompt]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const prompt = args.join(" ");
  if (!prompt) return api.sendMessage("❌ Prompt likhen! Maslan: /ediit4 a neon dragon", event.threadID);

  // Aapka manga hua loading message
  api.sendMessage("✨ Nano Banana 2 editing your image...", event.threadID);

  try {
    const path = __dirname + `/cache/edit4_${Date.now()}.png`;
    
    /* Pollinations ka Flux model prompt ko bohot deeply follow karta hai.
       Seed aur timestamp add kiya hai taake har baar fresh result mile.
    */
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1000000)}`;

    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(path, Buffer.from(response.data, "binary"));

    return api.sendMessage({
      body: `🎯 Target: ${prompt}\n\n✅ powered by Shaan Khan`,
      attachment: fs.createReadStream(path)
    }, event.threadID, () => {
      if (fs.existsSync(path)) fs.unlinkSync(path);
    }, event.messageID);

  } catch (e) {
    return api.sendMessage("⚠️ API temporary down hai, 1 minute baad try karein.", event.threadID);
  }
};
