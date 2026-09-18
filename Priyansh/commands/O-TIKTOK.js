const axios = require("axios");

module.exports.config = {
  name: "tiktok",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Search TikTok videos or fetch random video from a user profile",
  commandCategory: "search",
  usages: "<keyword or @username>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  let rawKeyword = args.join(" ").trim();

  if (!rawKeyword) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ Please provide a keyword or TikTok username.\n\nExamples:\n1. tiktok Zoro edit\n2. tiktok @username", threadID, messageID);
  }

  api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    // Lead '@' cleanup agar username enter kiya jaye
    const cleanQuery = rawKeyword.startsWith("@") ? rawKeyword.substring(1) : rawKeyword;
    
    const searchUrl = `https://toshiro-api-editz6t9.vercel.app/api/search/tiksearch?keyword=${encodeURIComponent(cleanQuery)}`;
    const { data } = await axios.get(searchUrl, { timeout: 15000 });

    let videoData = null;

    // Checking if API returns an array of results or single object
    if (data.success && Array.isArray(data.result) && data.result.length > 0) {
      // Pick a random video from the returned profile/search list
      const randomIndex = Math.floor(Math.random() * data.result.length);
      videoData = data.result[randomIndex];
    } else if (data.success && data.result?.video) {
      videoData = data.result;
    }

    if (!videoData || (!videoData.video && !videoData.play)) {
      throw new Error("No videos found for this username or keyword.");
    }

    const videoUrl = videoData.video || videoData.play;
    const title = videoData.title || "N/A";
    const author = videoData.author?.nickname || videoData.author || "N/A";
    const duration = videoData.duration || 0;

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
      body: `╭━━━━━━━━━━━━╮\n🎵 𝑻𝒊𝒌𝑻𝒐𝒌 𝑺𝒆𝒂𝒓𝒄𝒉\n╰━━━━━━━━━━━━╯\n🔍 𝗀𝖰𝗎𝖾𝗋𝗒: ${rawKeyword}\n🎬 𝗧𝗶𝘁𝗹𝗲: ${title}\n👤 𝗖𝗿𝗲𝗮𝘁𝗼𝒓: ${author}\n⏳ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${duration}s\n\n📌 »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 👉 TIKTOK-VIDEO`,
      attachment: videoStream.data
    };

    return api.sendMessage(msg, threadID, messageID);

  } catch (err) {
    console.error("TT Error:", err.response?.data || err.message);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(`❌ Failed to fetch video.\nReason: ${err.response?.data?.message || err.message}`, threadID, messageID);
  }
};
