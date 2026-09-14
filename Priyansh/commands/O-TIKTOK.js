const axios = require("axios");

module.exports.config = {
  name: "tiktok",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Search and download TikTok videos by keyword",
  commandCategory: "media",
  usages: "[keyword]",
  cooldowns: 5,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const keyword = args.join(" ").trim();

  if (!keyword) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ Please provide a keyword to search.\n\nExample:\n.tiktok Zoro", threadID, messageID);
  }

  api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    const res = await axios.get(
      `https://toshiro-api-editz6t9.vercel.app/api/search/tiksearch?keyword=${encodeURIComponent(keyword)}`,
      { timeout: 15000 }
    );

    if (!res.data || !res.data.success || !res.data.result?.video) {
      throw new Error("No video found for this query.");
    }

    const { video: videoUrl, title, author, duration } = res.data.result;

    const stream = (await axios.get(videoUrl, { responseType: "stream", timeout: 20000 })).data;

    api.setMessageReaction("✅", messageID, () => {}, true);

    const msgData = {
      body: `╭━━━━━━━━━━━━╮\n🎵 𝑻𝒊𝒌𝑻𝒐𝒌 𝑺𝒆𝒂𝒓𝒄𝒉\n╰━━━━━━━━━━━━╯\n🔍 𝗞𝗲𝘆𝘄𝗼𝗿𝗱: ${keyword}\n🎬 𝗧𝗶𝘁𝗹𝗲: ${title || "N/A"}\n👤 𝗖𝗿𝗲𝗮𝘁𝗼𝗿: ${author || "N/A"}\n⏳ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${duration || 0}s\n\n📌 𝗢𝘄𝗻𝗲𝗿 : 𝗦𝗵𝗮𝗮𝗻 𝗞𝗵𝗮𝗻`,
      attachment: stream
    };

    return api.sendMessage(msgData, threadID, (err, info) => {
      if (!err) {
        setTimeout(() => {
          api.unsendMessage(info.messageID);
        }, 15000);
      }
    }, messageID);

  } catch (err) {
    console.error("TikTok Search Error:", err.response?.data || err.message);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(`❌ Failed to search TikTok.\nReason: ${err.response?.data?.message || err.message}`, threadID, messageID);
  }
};
