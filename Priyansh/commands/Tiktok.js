const axios = require("axios");

module.exports.config = {
  name: "tiktok",
  version: "1.6.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Search TikTok videos by keywords",
  commandCategory: "search",
  usages: "<keyword>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const keywords = args.join(" ").trim();

  if (!keywords) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(
      "❌ Please provide a search keyword.\n\nExamples:\ntiktok travel Pakistan\ntiktok Zoro edit",
      threadID,
      messageID
    );
  }

  api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    const { data } = await axios.post(
      "https://uzairtikdown.dpdns.org/api/downloader",
      {
        keywords: keywords,
        limit: 20
      },
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    );

    console.log("TikTok API response:", JSON.stringify(data, null, 2));

    if (data?.success === false) {
      throw new Error(data.message || "TikTok search failed.");
    }

    const result = data?.result ?? data?.data ?? data;

    let videos = Array.isArray(result)
      ? result
      : Array.isArray(result?.videos)
      ? result.videos
      : Array.isArray(result?.results)
      ? result.results
      : result?.video || result?.play || result?.videoUrl
      ? [result]
      : [];

    if (!videos.length) {
      throw new Error("No videos found. Check API response format.");
    }

    // Pick a random video from search results
    const videoData = videos[
      Math.floor(Math.random() * videos.length)
    ];

    const videoUrl =
      videoData.video ||
      videoData.play ||
      videoData.videoUrl ||
      videoData.downloadUrl ||
      videoData.nowm;

    if (!videoUrl) {
      throw new Error("Video URL field was not found in API response.");
    }

    const videoResponse = await axios.get(videoUrl, {
      responseType: "stream",
      timeout: 60000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const title =
      videoData.title ||
      videoData.desc ||
      videoData.description ||
      "TikTok Video";

    const author =
      videoData.author?.nickname ||
      videoData.author?.name ||
      videoData.author ||
      videoData.username ||
      "Unknown";

    const duration = videoData.duration || 0;

    const msg = {
      body:
        `╭━━━━━━━━━━━━╮\n` +
        `🎵 TIKTOK SEARCH\n` +
        `╰━━━━━━━━━━━━╯\n` +
        `🔍 Query: ${keywords}\n` +
        `🎬 Title: ${title}\n` +
        `👤 Creator: ${author}\n` +
        `⏳ Duration: ${duration}s\n\n` +
        `📌 »»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉\n` +
        `🎥 TIKTOK VIDEO`,
      attachment: videoResponse.data
    };

    api.setMessageReaction("✅", messageID, () => {}, true);

    return api.sendMessage(msg, threadID, messageID);
  } catch (err) {
    console.error(
      "TikTok Error:",
      err.response?.data || err.message
    );

    api.setMessageReaction("❌", messageID, () => {}, true);

    return api.sendMessage(
      `❌ TikTok request failed.\nReason: ${
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message
      }`,
      threadID,
      messageID
    );
  }
};