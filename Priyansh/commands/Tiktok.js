const axios = require("axios");

module.exports.config = {
  name: "tiktok",
  version: "1.4.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Download TikTok videos using the official downloader API",
  commandCategory: "downloader",
  usages: "<TikTok Video URL or Keyword>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  let rawKeyword = args.join(" ").trim();

  if (!rawKeyword) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ Please provide a TikTok video link or keyword.\n\nExample:\n.tiktok https://vt.tiktok.com/...", threadID, messageID);
  }

  api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    // Naya API Endpoint integration
    const apiURL = `https://uzairtikdown.dpdns.org/api/downloader?url=${encodeURIComponent(rawKeyword)}`;
    const { data } = await axios.get(apiURL, { timeout: 15000 });

    // Response data mapping for official video links
    const videoData = data.result || data.data || data;

    const videoUrl = videoData.video || videoData.play || videoData.nowm || videoData.url;
    const title = videoData.title || videoData.desc || "N/A";
    const author = videoData.author?.nickname || videoData.author?.unique_id || videoData.author || "N/A";

    if (!videoUrl) {
      throw new Error("Could not retrieve the video stream from the API.");
    }

    // Stream download with User-Agent header
    const videoStream = await axios.get(videoUrl, {
      responseType: "stream",
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    api.setMessageReaction("✅", messageID, () => {}, true);

    const msg = {
      body: `╭━━━━━━━━━━━━╮\n🎵 𝑻𝒊𝒌𝑻𝒐𝒌 𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅𝒆𝒓\n╰━━━━━━━━━━━━╯\n🎬 𝗧𝗶𝘁𝗹𝗲: ${title}\n👤 𝗖𝗿𝗲𝗮𝘁𝗼𝗿: ${author}\n\n📌 »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 👉 TIKTOK-VIDEO`,
      attachment: videoStream.data
    };

    return api.sendMessage(msg, threadID, messageID);

  } catch (err) {
    console.error("TT Error:", err.response?.data || err.message);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(`❌ Failed to fetch video.\nReason: ${err.response?.data?.message || err.message}`, threadID, messageID);
  }
};
