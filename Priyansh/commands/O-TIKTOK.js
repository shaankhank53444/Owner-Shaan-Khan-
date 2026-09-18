const axios = require("axios");

module.exports.config = {
  name: "tiktok",
  version: "1.2.1",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Search exact TikTok videos",
  commandCategory: "search",
  usages: "<keyword>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const rawKeyword = args.join(" ").trim();

  if (!rawKeyword) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ Please provide a keyword.\n\nExample:\ntiktok Zoro official edit", threadID, messageID);
  }

  api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    // Hardcoded 'official' ko hata diya hai taake exact query search ho
    const searchUrl = `https://toshiro-api-editz6t9.vercel.app/api/search/tiksearch?keyword=${encodeURIComponent(rawKeyword)}`;
    
    const { data } = await axios.get(searchUrl, { timeout: 15000 });

    if (!data.success || !data.result?.video) {
      throw new Error("No video found for your search query.");
    }

    const { video: videoUrl, title, author, duration } = data.result;

    // Stream download karte waqt User-Agent headers add kar diye hain taake link expire na ho
    const videoStream = await axios.get(videoUrl, {
      responseType: "stream",
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    api.setMessageReaction("✅", messageID, () => {}, true);

    const msg = {
      body: `╭━━━━━━━━━━━━╮\n🎵 𝑻𝒊𝒌𝑻𝒐𝒌 𝑺𝒆𝒂𝒓𝒄𝒉\n╰━━━━━━━━━━━━╯\n🔍 𝗞𝗲𝘆𝘄𝗼𝗿𝗱: ${rawKeyword}\n🎬 𝗧𝗶𝘁𝗹𝗲: ${title || "N/A"}\n👤 𝗖𝗿𝗲𝗮𝘁𝗼𝒓: ${author || "N/A"}\n⏳ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${duration || 0}s\n\n📌 »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 TIKTOK-VIDEO`,
      attachment: videoStream.data
    };

    return api.sendMessage(msg, threadID, messageID);

  } catch (err) {
    console.error("TT Error:", err.response?.data || err.message);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(`❌ Failed to fetch video.\nReason: ${err.response?.data?.message || err.message}`, threadID, messageID);
  }
};
