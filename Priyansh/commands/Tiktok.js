const axios = require("axios");

module.exports.config = {
  name: "tiktok",
  version: "1.8.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Search TikTok videos or download by URL via Uzair API",
  commandCategory: "search",
  usages: "<keyword or TikTok URL>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ").trim();

  if (!query) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(
      "❌ Keyword ya TikTok URL enter karo.\n\n" +
      "Examples:\n" +
      "tiktok Zoro edit\n" +
      "tiktok funny videos\n" +
      "tiktok https://www.tiktok.com/@user/video/123456",
      threadID,
      messageID
    );
  }

  api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    const isUrl = /^https?:\/\/\S+/i.test(query);

    // Payload formatted for Uzair API (handling both URL & Search)
    const payload = isUrl 
      ? { url: query } 
      : { search: query, query: query, keyword: query };

    const { data } = await axios.post(
      "https://uzairtikdown.dpdns.org/api/downloader",
      payload,
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0"
        },
        // Fallback query params if POST body isn't read by server
        params: isUrl ? { url: query } : { search: query, query: query }
      }
    );

    console.log("TikTok Uzair API response:", data);

    const result = data?.result ?? data?.data ?? data;

    let videoData = result;

    if (Array.isArray(result)) {
      if (!result.length) throw new Error("No TikTok videos found.");
      videoData = result[Math.floor(Math.random() * result.length)];
    } else if (Array.isArray(result?.videos)) {
      if (!result.videos.length) throw new Error("No TikTok videos found.");
      videoData = result.videos[Math.floor(Math.random() * result.videos.length)];
    } else if (Array.isArray(result?.results)) {
      if (!result.results.length) throw new Error("No TikTok videos found.");
      videoData = result.results[Math.floor(Math.random() * result.results.length)];
    }

    const videoUrl =
      videoData?.video ||
      videoData?.play ||
      videoData?.videoUrl ||
      videoData?.downloadUrl ||
      videoData?.nowm ||
      videoData?.wm;

    if (data?.success === false || !videoUrl) {
      throw new Error(
        data?.message ||
        data?.error ||
        "Video URL nahi mila. Response format check karo."
      );
    }

    const video = await axios.get(videoUrl, {
      responseType: "stream",
      timeout: 60000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const title = videoData?.title || videoData?.desc || "TikTok Video";
    const author =
      videoData?.author?.nickname ||
      videoData?.author?.name ||
      (typeof videoData?.author === "string" ? videoData.author : "Unknown");
    const duration = videoData?.duration || 0;

    api.setMessageReaction("✅", messageID, () => {}, true);

    return api.sendMessage(
      {
        body:
          `╭━━━━━━━━━━━━╮\n` +
          `🎵 TIKTOK ${isUrl ? "DOWNLOADER" : "SEARCH"}\n` +
          `╰━━━━━━━━━━━━╯\n` +
          `🔍 Query: ${query}\n` +
          `🎬 Title: ${title}\n` +
          `👤 Creator: ${author}\n` +
          `⏳ Duration: ${duration}s\n\n` +
          `📌 »» SHAAN KHAN ««\n` +
          `🎥 TIKTOK VIDEO`,
        attachment: video.data
      },
      threadID,
      messageID
    );
  } catch (err) {
    console.error("TikTok Error:", err.response?.data || err.message);

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
