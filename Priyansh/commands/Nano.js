const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "ediit4",
  version: "5.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Stable AI Image Generator (Less Random)",
  commandCategory: "AI-Image",
  usages: "[prompt]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  let prompt = args.join(" ");
  if (!prompt) {
    return api.sendMessage("❌ Prompt likho! Example: /ediit4 realistic neon dragon", event.threadID);
  }

  // 🔥 Prompt Enhancement (random kam karega)
  const enhancedPrompt = `${prompt}, ultra realistic, 4k, highly detailed, professional photography, perfect lighting, no blur, no distortion, no extra objects`;

  api.sendMessage("✨ Generating clean & accurate image...", event.threadID);

  try {
    const path = __dirname + `/cache/edit4_${Date.now()}.png`;

    // ❗ FIX: stable model + fixed seed (random kam hoga)
    const seed = 123456; // same seed = consistent result

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=1024&model=turbo&seed=${seed}&nologo=true`;

    const response = await axios.get(url, { responseType: "arraybuffer" });

    fs.writeFileSync(path, Buffer.from(response.data, "binary"));

    return api.sendMessage({
      body: `🎯 Prompt: ${prompt}\n\n✅ Clean Result | Powered by Shaan Khan`,
      attachment: fs.createReadStream(path)
    }, event.threadID, () => {
      if (fs.existsSync(path)) fs.unlinkSync(path);
    }, event.messageID);

  } catch (e) {
    console.log(e);
    return api.sendMessage("⚠️ Error aa gaya! Thodi der baad try karo.", event.threadID);
  }
};