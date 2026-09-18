const axios = require("axios");

module.exports.config = {
  name: "tiktok",
  version: "1.2.0",
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
    // Exact match target karne ke liye query optimization
    const keyword = `${rawKeyword} official`;

    const { data } = await axios.get(
      `https://toshiro-api-editz6t9.vercel.app/api/search/tiksearch?keyword=${encodeURIComponent(keyword)}`,
      { timeout: 15000 }
    );

    if (!data.success || !data.result?.video) {
      throw new Error("No exact matching video found");
    }

    const { video: videoUrl, title, author, duration } = data.result;

    const video = (await axios.get(videoUrl, { responseType: "stream", timeout: 20000 })).data;

    api.setMessageReaction("✅", messageID, () => {}, true);

    const msg = {
      body: `╭━━━━━━━━━━━━╮\n🎵 𝑻𝒊𝒌𝑻𝒐𝒌 𝑺𝒆𝒂𝒓𝒄𝒉\n╰━━━━━━━━━━━━╯\n🔍 𝗞𝗲𝘆𝘄𝗼𝗿𝗱: ${rawKeyword}\n🎬 𝗧𝗶𝘁𝗹𝗲: ${title || "N/A"}\n👤 𝗖𝗿𝗲𝗮𝘁𝗼𝒓: ${author || "N/A"}\n⏳ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${duration || 0}s\n\n📌 𝗢𝘄𝗻𝗲𝗿 : 𝗦𝗵𝗮𝗮𝗻 𝗞𝗵𝗮𝗻`,
      attachment: video
    };

    return api.sendMessage(msg, threadID, messageID);

  } catch (err) {
    console.error("TT Error:", err.response?.data || err.message);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(`❌ Failed to search TikTok\nReason: ${err.response?.data?.message || err.message}`, threadID, messageID);
  }
};
