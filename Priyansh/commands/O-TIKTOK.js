const axios = require("axios");

module.exports.config = {
  name: "tiktok",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Search TikTok videos",
  commandCategory: "search",
  usages: "<keyword>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const keyword = args.join(" ").trim();

  if (!keyword) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ Please provide a keyword.\n\nExample:\ntiktok Zoro", threadID, messageID);
  }

  api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    const { data } = await axios.get(
      `https://toshiro-api-editz6t9.vercel.app/api/search/tiksearch?keyword=${encodeURIComponent(keyword)}`,
      { timeout: 15000 }
    );

    if (!data.success || !data.result?.video) {
      throw new Error("No video found");
    }

    const { video: videoUrl, title, author, duration } = data.result;

    const video = (await axios.get(videoUrl, { responseType: "stream", timeout: 20000 })).data;

    api.setMessageReaction("✅", messageID, () => {}, true);

    const msg = {
      body: `╭━━━━━━━━━━━━╮\n🎵 𝑻𝒊𝒌𝑻𝒐𝒌 𝑺𝒆𝒂𝒓𝒄𝒉\n╰━━━━━━━━━━━━╯\n🔍 𝗞𝗲𝘆𝘄𝗼𝗿𝗱: ${keyword}\n🎬 𝗧𝗶𝘁𝗹𝗲: ${title}\n👤 𝗖𝗿𝗲𝗮𝘁𝗼𝗿: ${author}\n⏳ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${duration}s\n\n📌 𝗢𝘄𝗻𝗲𝗿 : 𝗦𝗵𝗮𝗮𝗻 𝗞𝗵𝗮𝗻`,
      attachment: video
    };

    return api.sendMessage(msg, threadID, messageID);

  } catch (err) {
    console.error("TT Error:", err.response?.data || err.message);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(`❌ Failed to search TikTok\nReason: ${err.response?.data?.message || err.message}`, threadID, messageID);
  }
};
