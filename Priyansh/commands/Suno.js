const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "suno",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "Gemini AI",
  description: "Generate AI Song from Lyrics using Suno AI",
  commandCategory: "AI Music",
  usages: "[lyrics]",
  cooldowns: 15
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const lyrics = args.join(" ");

  if (!lyrics) {
    return api.sendMessage("🎵 Lyrics toh likho bhai!\nExample: .suno Ek ladki ko dekha toh aisa laga", threadID, messageID);
  }

  // Aap yahan apni API Key daal sakte hain agar zaroorat ho
  // Filhal maine ek generic stable endpoint ka structure banaya hai
  const apiUrl = `https://api.popcat.xyz/suno?q=${encodeURIComponent(lyrics)}`; 
  // Note: Agar aapke paas koi specific working Suno API hai toh URL yahan badal dein.

  try {
    api.sendMessage("🎧 Suno AI aapke liye gana bana raha hai... Thoda intezar karein! 🎶", threadID, messageID);

    const response = await axios.get(`https://betadash-api-swordsman-production.up.railway.app/suno?gen=${encodeURIComponent(lyrics)}`);
    
    // API Response se link nikalna (Adjusted for common Suno API structures)
    const audioUrl = response.data.url || response.data.audio;

    if (!audioUrl) {
      return api.sendMessage("❌ API ne gana generate nahi kiya. Shayad server busy hai.", threadID, messageID);
    }

    const cachePath = path.join(__dirname, "cache", `suno_${Date.now()}.mp3`);
    
    // Cache folder check karna
    if (!fs.existsSync(path.join(__dirname, "cache"))) {
      fs.mkdirSync(path.join(__dirname, "cache"));
    }

    const audioRes = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    await fs.writeFile(cachePath, Buffer.from(audioRes.data));

    return api.sendMessage({
      body: `🎵 *AI Generated Song Ready!*\n\n✨ Lyrics: ${lyrics.slice(0, 50)}...\n🎧 Enjoy!`,
      attachment: fs.createReadStream(cachePath)
    }, threadID, () => {
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    }, messageID);

  } catch (err) {
    console.error("Suno Error:", err);
    return api.sendMessage("😢 Error: Song generate nahi ho paya. API server down ho sakta hai.", threadID, messageID);
  }
};
